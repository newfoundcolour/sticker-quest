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
  MAX_QUANTITY,
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
  { value: "MATTE", label: "Matte", icon: "/icons/matte.svg" },
  { value: "GLOSS", label: "Gloss", icon: "/icons/gloss.svg" },
];

// Preset sizes are square, in mm.
const SIZE_PRESETS: { key: string; label: string; mm: number }[] = [
  { key: "small", label: "Small", mm: 50 },
  { key: "medium", label: "Medium", mm: 75 },
  { key: "large", label: "Large", mm: 100 },
  { key: "xlarge", label: "X-Large", mm: 125 },
];

const QUANTITY_PRESETS = [50, 100, 200, 300, 500, 1000];

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

/** "Vinyl" → "Vinyl Stickers"; the sheet types already say what they are. */
function pageTitle(stickerType: StickerType): string {
  const label = STICKER_TYPE_LABELS[stickerType];
  return label.endsWith("Sheets") ? label : `${label} Stickers`;
}

/** The hero's two-line stacked wordmark: "Vinyl Stickers" → ["VINYL", "STICKERS"]. */
function heroLines(stickerType: StickerType): [string, string] {
  const words = pageTitle(stickerType).toUpperCase().split(" ");
  const last = words.pop() ?? "";
  return [words.join(" "), last];
}

export function TypeConfigurator({
  stickerType,
  pricingConfig,
}: {
  stickerType: StickerType;
  pricingConfig: PricingConfig;
}) {
  const [cutType, setCutType] = useState<CutType | undefined>("DIE");
  const [shape, setShape] = useState<Shape | undefined>("CUSTOM");

  const [finish, setFinish] = useState<Finish | undefined>("MATTE");
  const [whiteInk, setWhiteInk] = useState(false);
  const [lamination, setLamination] = useState(false);

  const [sizeChoice, setSizeChoice] = useState<string | undefined>("medium"); // preset key | 'custom'
  const [customWidthInput, setCustomWidthInput] = useState("");
  const [customHeightInput, setCustomHeightInput] = useState("");

  const [quantityChoice, setQuantityChoice] = useState<number | "custom" | undefined>(100);
  const [customQuantityInput, setCustomQuantityInput] = useState("");
  const [quantityTouched, setQuantityTouched] = useState(true);

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

  const isHolographic = stickerType === "HOLOGRAPHIC";

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
    quantityTouched,
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
        whiteInk,
        lamination,
        widthCm,
        heightCm,
        quantity,
        artworkUrl,
        artworkFilename,
      });
    });
  }

  function selectQuantity(q: number) {
    setQuantityChoice(q);
    setQuantityTouched(true);
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
  const [headlineTop, headlineBottom] = heroLines(stickerType);

  return (
    <Container className="pb-8 pt-4">
      <div className="flex items-center gap-6 overflow-hidden rounded-[20px] bg-linear-[167deg] from-zap via-blaze via-55% to-grape px-5 py-6 sm:px-8 md:px-11 md:py-9 lg:px-14 lg:py-12">
        <Image
          src="/mascot/knight-helmet.png"
          alt=""
          width={615}
          height={880}
          className="hidden h-32 w-auto shrink-0 drop-shadow-[4px_4px_0_rgba(22,18,42,0.45)] sm:block md:h-40 lg:h-52"
        />
        <div className="max-w-[560px]">
          <Link
            href="/"
            className={`inline-block -rotate-2 rounded-full border-[2.5px] border-night bg-white px-4 py-[7px] text-base font-black uppercase text-night ${OPTION_TRANSITION} ${LIFT_ON_HOVER_ANY}`}
          >
            ← All Products
          </Link>
          <h1 className="max-w-full break-words pt-4 text-[36px] font-black leading-[0.85] text-sand uppercase lg:text-[88px]">
            <span className="block">{headlineTop}</span>
            <span className="block">{headlineBottom}</span>
          </h1>
          <p className="pt-4 text-base leading-[1.5] text-sand">
            {STICKER_TYPE_DESCRIPTIONS[stickerType]}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1.2fr_1.8fr]">
          <StepCard step={1} title="Shape & Cut">
            <div className="flex flex-col gap-2.5 p-3.5">
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

              {(() => {
                const custom = SHAPES[0];
                const customSelected = shape === custom.value;
                return (
                  <button
                    type="button"
                    onClick={() => setShape(custom.value)}
                    aria-pressed={customSelected}
                    className={[
                      "group flex h-[72px] items-center justify-center gap-3.5 rounded-[14px] border px-5",
                      OPTION_TRANSITION,
                      LIFT_ON_HOVER,
                      customSelected ? SELECTED_CLASSES : IDLE_CLASSES,
                    ].join(" ")}
                  >
                    <ShapeImage src={custom.image} size={48} kissCut={cutType === "KISS"} />
                    <span className="text-sm font-black">{custom.label}</span>
                  </button>
                );
              })()}

              <div className="grid grid-cols-2 gap-2.5">
                {SHAPES.slice(1).map((s) => (
                  <OptionTile
                    key={s.value}
                    selected={shape === s.value}
                    onClick={() => setShape(s.value)}
                    className="h-[120px] gap-2"
                  >
                    <ShapeImage src={s.image} size={52} kissCut={cutType === "KISS"} />
                    <span className="text-sm font-black">{s.label}</span>
                  </OptionTile>
                ))}
              </div>
            </div>
          </StepCard>

          <StepCard step={2} title="Material">
            <div className="p-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                {FINISHES.map((f) => (
                  <OptionTile
                    key={f.value}
                    selected={finish === f.value}
                    onClick={() => setFinish(f.value)}
                    className="min-h-[155px] gap-2 pb-3.5"
                  >
                    <Image
                      src={f.icon}
                      alt=""
                      width={32}
                      height={40}
                      // Both icons are drawn in light strokes for a dark background —
                      // invert so they stay visible on this design's light tiles.
                      className={`h-10 w-8 invert ${TILT_ON_HOVER}`}
                    />
                    <span className="text-sm font-black">{f.label}</span>
                  </OptionTile>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-grape/30 pt-4">
                <label
                  className={`flex w-fit cursor-pointer items-center gap-3 text-sm font-black text-night ${LIFT_ON_HOVER_ANY}`}
                >
                  <input
                    type="checkbox"
                    checked={whiteInk}
                    onChange={(e) => setWhiteInk(e.target.checked)}
                    className="size-4 accent-grape"
                  />
                  <span>
                    White ink
                    {isHolographic && (
                      <span className="block text-xs font-normal text-quiet">
                        (no effect on holographic)
                      </span>
                    )}
                  </span>
                </label>
                <label
                  className={`flex w-fit cursor-pointer items-center gap-3 text-sm font-black text-night ${LIFT_ON_HOVER_ANY}`}
                >
                  <input
                    type="checkbox"
                    checked={lamination}
                    onChange={(e) => setLamination(e.target.checked)}
                    className="size-4 accent-grape"
                  />
                  Lamination
                </label>
              </div>
            </div>
          </StepCard>

          <StepCard step={3} title="Size">
            <div className="p-3.5">
              <div className="grid grid-cols-2 gap-2">
                {SIZE_PRESETS.map((p) => {
                  const selected = sizeChoice === p.key;
                  return (
                    <OptionTile
                      key={p.key}
                      selected={selected}
                      onClick={() => setSizeChoice(p.key)}
                      className="h-[128px] gap-1.5 px-2"
                    >
                      <span
                        className={[
                          "h-[22px] w-[26px] rounded-[5px] border-night",
                          selected ? "border-[1.5px] bg-night/15" : "border",
                        ].join(" ")}
                      />
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
                        <span aria-hidden className="text-lg font-normal">
                          ✎
                        </span>
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

          <StepCard step={4} title="Quantity">
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex flex-col gap-1.5 px-3 pt-3 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setQuantityChoice("custom");
                    setQuantityTouched(true);
                  }}
                  aria-pressed={quantityChoice === "custom"}
                  className={[
                    "flex h-12 items-center justify-between rounded-[10px] border px-3.5 text-lg font-black",
                    OPTION_TRANSITION,
                    LIFT_ON_HOVER,
                    quantityChoice === "custom" ? SELECTED_CLASSES : IDLE_CLASSES,
                  ].join(" ")}
                >
                  <span>Custom</span>
                  {quantityChoice !== "custom" && (
                    <span className="text-xs font-bold text-grape">Enter qty →</span>
                  )}
                </button>

                {quantityChoice === "custom" && (
                  <input
                    type="number"
                    min={MIN_QUANTITY}
                    max={MAX_QUANTITY}
                    value={customQuantityInput}
                    onChange={(e) => {
                      setCustomQuantityInput(e.target.value);
                      setQuantityTouched(true);
                    }}
                    onBlur={() => {
                      const n = parseInt(customQuantityInput, 10);
                      setCustomQuantityInput(
                        String(clampQuantity(Number.isNaN(n) ? MIN_QUANTITY : n)),
                      );
                    }}
                    placeholder={`Enter custom amount. Minimum ${MIN_QUANTITY}`}
                    aria-label="Custom quantity"
                    className={`w-full ${inputClass}`}
                  />
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
                      onClick={() => selectQuantity(q)}
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
                            <span
                              className={[
                                "rounded-full px-2 py-0.5 text-base",
                                selected ? "bg-white/25 text-night" : "bg-zap/20 text-zap-ink",
                              ].join(" ")}
                            >
                              Save {preview.discountPercent}%
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}

                {!hasSize && (
                  <p className="px-1 pt-1 pb-3 text-xs text-quiet">
                    Pick a size first to see pricing per quantity.
                  </p>
                )}
              </div>

              <PriceReadout
                totalPrice={pricing?.totalPrice ?? null}
                pricePerUnit={pricing?.pricePerUnit ?? null}
                savingsPercent={quantityChoice === "custom" ? (pricing?.discountPercent ?? 0) : 0}
                status={hasSize ? "ready" : "empty"}
              />
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
