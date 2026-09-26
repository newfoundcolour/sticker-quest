"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CutType, Finish, Shape, StickerType } from "@/generated/prisma/client";
import type { PricingConfig } from "@/lib/pricing";
import { addToCartAction } from "@/app/actions/cart";
import { Container } from "@/components/Container";
import {
  MIN_QUANTITY,
  MIN_SIZE_MM,
  MAX_SIZE_MM,
  clampQuantity,
  clampSizeMm,
  calculateStickerPricing,
  formatMmValue,
  mmToCm,
} from "@/lib/pricingUtils";
import {
  StepCard,
  OptionTile,
  SELECTED_CLASSES,
  IDLE_CLASSES,
  LIFT_ON_HOVER,
  LIFT_ON_HOVER_ANY,
  OPTION_TRANSITION,
  TILT_ON_HOVER,
} from "./StepCard";
import { PriceReadout } from "./PriceReadout";
import { ShapeImage } from "./ShapeImage";
import { STICKER_TYPE_DESCRIPTIONS, STICKER_TYPE_LABELS } from "@/lib/stickerTypeSlug";
import { formatCurrency } from "@/lib/pricingUtils";
import { MAX_ARTWORK_BYTES, type UploadArtworkResult } from "@/lib/uploadConstants";

const CUT_TYPES: { value: CutType; label: string; hint: string }[] = [
  { value: "DIE", label: "Die Cut", hint: "Through the backing" },
  { value: "KISS", label: "Kiss Cut", hint: "On a backing square" },
];

const SHAPES: { value: Shape; label: string; image: string }[] = [
  { value: "CUSTOM", label: "Custom Shape", image: "/configurator/shapes/custom.png" },
  { value: "CIRCLE", label: "Circle", image: "/configurator/shapes/circle.png" },
  { value: "OVAL", label: "Oval", image: "/configurator/shapes/oval.png" },
  { value: "SQUARE", label: "Square", image: "/configurator/shapes/square.png" },
  { value: "RECTANGLE", label: "Rectangle", image: "/configurator/shapes/rectangle.png" },
];

const FINISHES: { value: Finish; label: string; icon: string }[] = [
  { value: "MATTE", label: "Matte", icon: "/icons/matte.png" },
  { value: "GLOSS", label: "Gloss", icon: "/icons/gloss.png" },
];

// Preset sizes are square, in mm.
// Presets without an image fall back to a plain outline until their artwork lands.
const SIZE_PRESETS: { key: string; label: string; mm: number; image?: string }[] = [
  { key: "small", label: "Small", mm: 50, image: "/icons/size-small.png" },
  { key: "medium", label: "Medium", mm: 75 },
  { key: "large", label: "Large", mm: 100, image: "/icons/size-large.png" },
  { key: "xlarge", label: "X-Large", mm: 125, image: "/icons/size-xlarge.png" },
];

const QUANTITY_PRESETS = [50, 100, 200, 300, 500, 1000, 2000];

// What a fresh configurator starts on.
const DEFAULT_CUT_TYPE: CutType = "DIE";
const DEFAULT_SHAPE: Shape = "CUSTOM";
const DEFAULT_ROUNDED_CORNERS = true;
const DEFAULT_FINISH: Finish = "MATTE";
const DEFAULT_LAMINATION = false;
const DEFAULT_SIZE = "medium";
const DEFAULT_QUANTITY = 100;

/**
 * XMLHttpRequest rather than fetch so we get real upload-progress events —
 * fetch's request-body streaming progress isn't reliably supported.
 */
function uploadWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadArtworkResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    // Backstop for a stalled connection — the server times out its own
    // Cloudinary call well before this fires under normal conditions.
    xhr.timeout = 45_000;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText) as UploadArtworkResult);
      } catch {
        resolve({ ok: false, error: "Upload failed — please try again." });
      }
    };

    xhr.onerror = () => resolve({ ok: false, error: "Upload failed — please try again." });
    xhr.ontimeout = () => resolve({ ok: false, error: "Upload timed out — please try again." });

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

/** A question answered with a full-width pair of Yes / No pills. */
function YesNoQuestion({
  question,
  hint,
  value,
  onChange,
  className = "",
}: {
  question: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      <div>
        <p className="text-sm font-black text-night">{question}</p>
        {hint && <p className="text-[10px] text-quiet">{hint}</p>}
      </div>
      <div className="flex gap-2.5">
        {[
          { answer: true, label: "Yes" },
          { answer: false, label: "No" },
        ].map((o) => {
          const selected = value === o.answer;
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => onChange(o.answer)}
              aria-pressed={selected}
              className={[
                "flex-1 rounded-full border px-5 py-1.5 text-sm font-black",
                OPTION_TRANSITION,
                LIFT_ON_HOVER,
                selected ? SELECTED_CLASSES : IDLE_CLASSES,
              ].join(" ")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** "Vinyl" → "Vinyl Stickers"; the sheet types already say what they are. */
function pageTitle(stickerType: StickerType): string {
  const label = STICKER_TYPE_LABELS[stickerType];
  return label.endsWith("Sheets") ? label : `${label} Stickers`;
}

export function TypeConfigurator({
  stickerType,
  pricingConfig,
}: {
  stickerType: StickerType;
  pricingConfig: PricingConfig;
}) {
  const [cutType, setCutType] = useState<CutType | undefined>(DEFAULT_CUT_TYPE);
  const [shape, setShape] = useState<Shape | undefined>(DEFAULT_SHAPE);
  const [roundedCorners, setRoundedCorners] = useState(DEFAULT_ROUNDED_CORNERS);

  const [finish, setFinish] = useState<Finish | undefined>(DEFAULT_FINISH);
  const [whiteInk, setWhiteInk] = useState(false);
  const [lamination, setLamination] = useState(DEFAULT_LAMINATION);

  const [sizeChoice, setSizeChoice] = useState<string | undefined>(DEFAULT_SIZE); // preset key | 'custom'
  const [customWidthInput, setCustomWidthInput] = useState("");
  const [customHeightInput, setCustomHeightInput] = useState("");

  const [quantityChoice, setQuantityChoice] = useState<number | "custom" | undefined>(DEFAULT_QUANTITY);
  const [customQuantityInput, setCustomQuantityInput] = useState("");

  const [artworkUrl, setArtworkUrl] = useState<string | undefined>();
  const [artworkFilename, setArtworkFilename] = useState<string | undefined>();
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "error" | "tooLarge"
  >("idle");
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preset = SIZE_PRESETS.find((p) => p.key === sizeChoice);
  const customWidth = parseFloat(customWidthInput);
  const customHeight = parseFloat(customHeightInput);
  const hasCustomSize =
    sizeChoice === "custom" && !Number.isNaN(customWidth) && !Number.isNaN(customHeight);
  const hasSize = !!preset || hasCustomSize;

  // Inputs and presets are in mm; pricing and the cart work in cm.
  const widthCm = mmToCm(preset ? preset.mm : clampSizeMm(customWidth || 0));
  const heightCm = mmToCm(preset ? preset.mm : clampSizeMm(customHeight || 0));

  const customQuantity = parseInt(customQuantityInput, 10);
  const quantity =
    quantityChoice === "custom"
      ? clampQuantity(Number.isNaN(customQuantity) ? MIN_QUANTITY : customQuantity)
      : (quantityChoice ?? MIN_QUANTITY);

  // A custom choice only counts once a number has actually been typed in.
  const hasQuantity =
    typeof quantityChoice === "number" ||
    (quantityChoice === "custom" && !Number.isNaN(customQuantity));

  const isHolographic = stickerType === "HOLOGRAPHIC";
  const hasWhiteInkOption = stickerType !== "VINYL";
  const hasRoundedCornersOption = shape === "SQUARE" || shape === "RECTANGLE";

  const pricing = hasSize
    ? calculateStickerPricing({
        config: pricingConfig,
        isHolographic,
        whiteInk,
        lamination,
        widthCm,
        heightCm,
        quantity,
      })
    : null;

  const completed = [
    !!cutType && !!shape,
    !!finish,
    hasSize,
    hasQuantity,
    !!artworkUrl,
  ];
  const allComplete = completed.every(Boolean);

  const [isAddingToCart, startAddToCart] = useTransition();

  function handleAddToCart() {
    if (!cutType || !shape || !finish || !artworkUrl || !artworkFilename) return;
    startAddToCart(async () => {
      await addToCartAction({
        stickerType,
        cutType,
        shape,
        finish,
        roundedCorners: hasRoundedCornersOption && roundedCorners,
        whiteInk: hasWhiteInkOption && whiteInk,
        lamination,
        widthCm,
        heightCm,
        quantity,
        artworkUrl,
        artworkFilename,
      });
    });
  }

  async function handleFile(file: File) {
    if (file.size > MAX_ARTWORK_BYTES) {
      setUploadStatus("tooLarge");
      setUploadError(undefined);
      return;
    }

    setUploadStatus("uploading");
    setUploadError(undefined);
    setUploadProgress(0);

    const result = await uploadWithProgress(file, setUploadProgress);

    if (result.ok) {
      setArtworkUrl(result.url);
      setArtworkFilename(result.filename);
      setUploadStatus("idle");
    } else {
      setUploadStatus("error");
      setUploadError(result.error);
    }
  }

  const inputClass =
    "rounded-lg border border-grape bg-white px-3 py-2 text-sm font-black text-night outline-none focus:border-blaze";

  return (
    <Container className="pb-8 pt-4">
      <Link
        href="/"
        className="mb-2 inline-block text-base font-bold text-blaze transition-colors hover:text-grape"
      >
        &lt; {pageTitle(stickerType)}
      </Link>
      <div className="flex items-center gap-5 overflow-hidden rounded-[20px] bg-linear-[167deg] from-zap via-blaze via-55% to-grape px-5 py-4 sm:px-8 md:h-[208px] md:py-0 lg:px-12">
        <Image
          src="/mascot/knight-helmet.png"
          alt=""
          width={615}
          height={880}
          className="hidden h-28 w-auto shrink-0 drop-shadow-[4px_4px_0_rgba(22,18,42,0.45)] sm:block md:h-40"
        />
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-[28px] font-black leading-none text-sand uppercase lg:text-[40px] xl:text-[64px]">
            {pageTitle(stickerType)}
          </h1>
          <p className="pt-3 text-sm leading-[1.5] text-sand md:text-base">
            {STICKER_TYPE_DESCRIPTIONS[stickerType]}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.5fr]">
          <StepCard step={1} title="Shape & Cut" className="xl:min-h-[780px]">
            <div className="flex flex-1 flex-col gap-2.5 p-6">
              <div className="flex gap-1 rounded-[14px] border border-grape bg-grape/25 p-1">
                {CUT_TYPES.map((c) => {
                  const selected = cutType === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCutType(c.value)}
                      aria-pressed={selected}
                      className={[
                        "flex flex-1 flex-col items-center rounded-[10px] border py-2.5",
                        OPTION_TRANSITION,
                        LIFT_ON_HOVER,
                        selected ? SELECTED_CLASSES : `${IDLE_CLASSES} text-grape`,
                      ].join(" ")}
                    >
                      <span className="text-xs font-black">{c.label}</span>
                      <span className={selected ? "text-[10px]" : "text-[10px] text-grape/70"}>
                        {c.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom spans both columns; every row is 148px so all five options match. */}
              <div className="grid auto-rows-[148px] grid-cols-2 gap-2.5">
              {(() => {
                const custom = SHAPES[0];
                const customSelected = shape === custom.value;
                return (
                  <button
                    type="button"
                    onClick={() => setShape(custom.value)}
                    aria-pressed={customSelected}
                    className={[
                      "group col-span-2 flex items-center justify-center gap-4 rounded-[14px] border px-5",
                      OPTION_TRANSITION,
                      LIFT_ON_HOVER,
                      customSelected ? SELECTED_CLASSES : IDLE_CLASSES,
                    ].join(" ")}
                  >
                    <ShapeImage src={custom.image} size={64} kissCut={cutType === "KISS"} />
                    <span className="text-sm font-black">{custom.label}</span>
                  </button>
                );
              })()}

                {SHAPES.slice(1).map((s) => (
                  <OptionTile
                    key={s.value}
                    selected={shape === s.value}
                    onClick={() => setShape(s.value)}
                    className="gap-2"
                  >
                    <ShapeImage src={s.image} size={64} kissCut={cutType === "KISS"} />
                    <span className="text-sm font-black">{s.label}</span>
                  </OptionTile>
                ))}
              </div>

              {hasRoundedCornersOption && (
                <YesNoQuestion
                  question="Rounded corners?"
                  value={roundedCorners}
                  onChange={setRoundedCorners}
                  className="pt-1.5"
                />
              )}
            </div>
          </StepCard>

          <StepCard step={2} title="Material" className="xl:min-h-[780px]">
            <div className="flex flex-1 flex-col p-6">
              <div className="grid grid-cols-2 gap-2.5">
                {FINISHES.map((f) => (
                  <OptionTile
                    key={f.value}
                    selected={finish === f.value}
                    onClick={() => setFinish(f.value)}
                    className="h-[148px] gap-2"
                  >
                    <Image
                      src={f.icon}
                      alt=""
                      width={64}
                      height={64}
                      className={`size-16 ${TILT_ON_HOVER}`}
                    />
                    <span className="text-sm font-black">{f.label}</span>
                  </OptionTile>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-4 border-t border-grape/30 pt-4">
                {hasWhiteInkOption && (
                  <YesNoQuestion
                    question="White ink?"
                    hint={
                      isHolographic
                        ? "No effect on holographic"
                        : "A white base that makes your colours pop"
                    }
                    value={whiteInk}
                    onChange={setWhiteInk}
                  />
                )}
                <YesNoQuestion
                  question="Laminated?"
                  hint="Extra armour against scratches, sun and splashes"
                  value={lamination}
                  onChange={setLamination}
                />
              </div>
            </div>
          </StepCard>

          <StepCard step={3} title="Size" className="xl:min-h-[780px]">
            <div className="flex flex-1 flex-col p-6">
              <div className="grid grid-cols-2 gap-2">
                {SIZE_PRESETS.map((p) => {
                  const selected = sizeChoice === p.key;
                  return (
                    <OptionTile
                      key={p.key}
                      selected={selected}
                      onClick={() => setSizeChoice(p.key)}
                      className="h-[148px] gap-2 px-2"
                    >
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt=""
                          width={64}
                          height={64}
                          className={`size-16 ${TILT_ON_HOVER}`}
                        />
                      ) : (
                        <span
                          className={[
                            "h-[30px] w-9 rounded-[6px] border-night",
                            selected ? "border-[1.5px] bg-night/15" : "border",
                          ].join(" ")}
                        />
                      )}
                      <span className="text-center">
                        <span className="block text-sm font-black">{p.label}</span>
                        <span
                          className={["block text-[10px]", selected ? "text-night/60" : "text-night/50"].join(
                            " ",
                          )}
                        >
                          {formatMmValue(p.mm)} × {formatMmValue(p.mm)} mm
                        </span>
                      </span>
                    </OptionTile>
                  );
                })}
                {(() => {
                  const selected = sizeChoice === "custom";
                  return (
                    <button
                      type="button"
                      onClick={() => setSizeChoice("custom")}
                      aria-pressed={selected}
                      className={[
                        "col-span-2 flex h-[62px] flex-col items-center justify-center rounded-[14px] border",
                        OPTION_TRANSITION,
                        LIFT_ON_HOVER,
                        selected ? SELECTED_CLASSES : `${IDLE_CLASSES} border-dashed`,
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-2 text-sm font-black">
                        <Image src="/icons/size-custom.png" alt="" width={48} height={48} className="size-12" />
                        Custom size
                      </span>
                    </button>
                  );
                })()}
              </div>

              {sizeChoice === "custom" && (
                <div className="mt-4 flex gap-4">
                  <label className="flex flex-col gap-1 text-xs font-black text-quiet">
                    Height (mm)
                    <input
                      type="number"
                      min={MIN_SIZE_MM}
                      max={MAX_SIZE_MM}
                      step={0.5}
                      value={customHeightInput}
                      onChange={(e) => setCustomHeightInput(e.target.value)}
                      onBlur={() => {
                        const n = parseFloat(customHeightInput);
                        if (!Number.isNaN(n)) setCustomHeightInput(String(clampSizeMm(n)));
                      }}
                      className={`w-full ${inputClass}`}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-black text-quiet">
                    Width (mm)
                    <input
                      type="number"
                      min={MIN_SIZE_MM}
                      max={MAX_SIZE_MM}
                      step={0.5}
                      value={customWidthInput}
                      onChange={(e) => setCustomWidthInput(e.target.value)}
                      onBlur={() => {
                        const n = parseFloat(customWidthInput);
                        if (!Number.isNaN(n)) setCustomWidthInput(String(clampSizeMm(n)));
                      }}
                      className={`w-full ${inputClass}`}
                    />
                  </label>
                </div>
              )}

              <p className="mt-3 text-xs text-quiet">
                {sizeChoice === "custom"
                  ? `Both dimensions must be between ${MIN_SIZE_MM} mm and ${MAX_SIZE_MM} mm.`
                  : "Preset sizes are treated as a square."}
              </p>
            </div>
          </StepCard>

          <StepCard step={4} title="Quantity" className="xl:min-h-[780px]">
            <div className="flex flex-col gap-3 p-6">
              {quantityChoice === "custom" ? (
                <input
                  type="number"
                  min={MIN_QUANTITY}
                  autoFocus
                  value={customQuantityInput}
                  onChange={(e) => setCustomQuantityInput(e.target.value)}
                  onBlur={() => {
                    const n = parseInt(customQuantityInput, 10);
                    if (!Number.isNaN(n)) setCustomQuantityInput(String(clampQuantity(n)));
                  }}
                  placeholder={`Enter custom quantity (min ${MIN_QUANTITY})`}
                  aria-label="Custom quantity"
                  className={[
                    // `!` beats the global :focus-visible ring; the lime selected style already shows focus.
                    "h-12 w-full rounded-[10px] border px-3.5 text-lg font-black outline-none!",
                    "placeholder:text-sm placeholder:font-bold placeholder:text-quiet",
                    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                    SELECTED_CLASSES,
                  ].join(" ")}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setQuantityChoice("custom")}
                  aria-pressed={false}
                  className={[
                    "flex h-12 items-center justify-between rounded-[10px] border px-3.5 text-lg font-black",
                    OPTION_TRANSITION,
                    LIFT_ON_HOVER,
                    IDLE_CLASSES,
                  ].join(" ")}
                >
                  <span>Custom</span>
                  <span className="text-xs font-bold text-grape">Enter qty →</span>
                </button>
              )}

              {QUANTITY_PRESETS.map((q) => {
                const preview = hasSize
                  ? calculateStickerPricing({
                      config: pricingConfig,
                      isHolographic,
                      whiteInk,
                      lamination,
                      widthCm,
                      heightCm,
                      quantity: q,
                    })
                  : null;
                const selected = quantityChoice === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantityChoice(q)}
                    disabled={!hasSize}
                    aria-pressed={selected}
                    className={[
                      "flex h-12 items-center justify-between rounded-[10px] border px-3.5 text-lg font-black disabled:cursor-not-allowed disabled:opacity-40",
                      OPTION_TRANSITION,
                      LIFT_ON_HOVER,
                      selected ? SELECTED_CLASSES : IDLE_CLASSES,
                    ].join(" ")}
                  >
                    <span>{q.toLocaleString("en-ZA")}</span>
                    {preview && (
                      <span className="flex items-center gap-1.5">
                        <span>{formatCurrency(preview.totalPrice)}</span>
                        {preview.discountPercent > 0 && (
                          <span className="text-sm text-grape">
                            Save {preview.discountPercent}%
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}

              {!hasSize && (
                <p className="px-1 pt-1 text-xs text-quiet">
                  Pick a size first to see pricing per quantity.
                </p>
              )}

              {hasQuantity && (
                <PriceReadout
                  totalPrice={pricing?.totalPrice ?? null}
                  pricePerUnit={pricing?.pricePerUnit ?? null}
                  savingsPercent={quantityChoice === "custom" ? (pricing?.discountPercent ?? 0) : 0}
                  status={hasSize ? "ready" : "empty"}
                />
              )}
            </div>
          </StepCard>
        </div>

        <StepCard step={5} title="Upload">
          <div className="p-5">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleFile(file);
              }}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => uploadStatus !== "uploading" && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && uploadStatus !== "uploading") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              className={[
                "flex h-[190px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[16px] border-[1.5px] border-dashed px-6 text-center",
                OPTION_TRANSITION,
                isDraggingOver
                  ? "border-blaze bg-blaze/5 shadow-pop-blaze"
                  : "border-grape bg-sand shadow-pop-grape-soft",
              ].join(" ")}
            >
              {uploadStatus === "uploading" ? (
                <>
                  <span aria-hidden className="animate-pulse text-2xl">
                    ⬆️
                  </span>
                  <p className="text-sm font-black text-night">
                    {uploadProgress >= 100 ? "Finishing up…" : `Uploading… ${uploadProgress}%`}
                  </p>
                  <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-night/10">
                    <div
                      className={[
                        "h-full rounded-full bg-blaze transition-[width] duration-150",
                        uploadProgress >= 100 ? "animate-pulse" : "",
                      ].join(" ")}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </>
              ) : uploadStatus === "tooLarge" ? (
                <>
                  <span className="text-3xl" role="img" aria-label="Warning">
                    ⚠️
                  </span>
                  <p className="font-black text-blaze">File Too Large</p>
                  <p className="max-w-sm text-sm text-quiet">
                    Please compress your image or use a smaller file (max 25MB)
                  </p>
                </>
              ) : artworkUrl ? (
                <>
                  <svg
                    viewBox="0 0 20 20"
                    className="h-8 w-8 text-trail-teal"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M4 10.5l4 4 8-9" />
                  </svg>
                  <p className="max-w-sm text-sm text-night">
                    <span className="font-black">{artworkFilename}</span> uploaded
                  </p>
                  <p className="text-xs text-quiet">Click or drop a file to replace it</p>
                </>
              ) : (
                <>
                  <span
                    aria-hidden
                    className="flex size-[52px] items-center justify-center rounded-[14px] border-[1.5px] border-blaze bg-blaze/15 text-2xl"
                  >
                    ⬆️
                  </span>
                  <p className="text-sm font-black text-night">Drag or click to upload your file</p>
                  <p className="text-xs text-quiet">All formats supported. 25MB max · 1 design max</p>
                </>
              )}
            </div>
            {uploadStatus === "error" && uploadError && (
              <p className="mt-3 text-sm font-black text-blaze">{uploadError}</p>
            )}
          </div>
        </StepCard>

        <div className="flex flex-wrap items-center justify-end gap-4">
          {!allComplete && (
            <p className="text-sm text-sand/60">Finish all five steps to add to cart</p>
          )}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!allComplete || isAddingToCart}
            className={[
              "ml-auto rounded-full border-2 border-night bg-blaze px-8 py-3.5 text-base font-black uppercase tracking-wide text-white",
              OPTION_TRANSITION,
              LIFT_ON_HOVER_ANY,
              "shadow-pop-blaze disabled:cursor-not-allowed disabled:opacity-40",
            ].join(" ")}
          >
            {isAddingToCart ? "Adding to cart…" : "Add to cart"}
          </button>
        </div>
      </div>
    </Container>
  );
}
