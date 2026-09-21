"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CutType, Finish, Shape, StickerType } from "@/generated/prisma/client";
import type { PricingConfig } from "@/lib/pricing";
import { addToCartAction } from "@/app/actions/cart";
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
import { StepCard, OptionTile } from "./StepCard";
import { PriceReadout } from "./PriceReadout";
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

// Preset sizes are square, in mm. `previewPx` is the size of the little square
// drawn on the tile, from the Figma.
const SIZE_PRESETS: { key: string; label: string; mm: number; previewPx: number }[] = [
  { key: "small", label: "Small", mm: 50, previewPx: 24 },
  { key: "medium", label: "Medium", mm: 75, previewPx: 32 },
  { key: "large", label: "Large", mm: 100, previewPx: 42 },
  { key: "xlarge", label: "X-Large", mm: 125, previewPx: 52 },
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

export function TypeConfigurator({
  stickerType,
  pricingConfig,
}: {
  stickerType: StickerType;
  pricingConfig: PricingConfig;
}) {
  const [cutType, setCutType] = useState<CutType | undefined>();
  const [shape, setShape] = useState<Shape | undefined>();

  const [finish, setFinish] = useState<Finish | undefined>();
  const [whiteInk, setWhiteInk] = useState(false);
  const [lamination, setLamination] = useState(false);

  const [sizeChoice, setSizeChoice] = useState<string | undefined>(); // preset key | 'custom'
  const [customWidthInput, setCustomWidthInput] = useState("");
  const [customHeightInput, setCustomHeightInput] = useState("");

  const [quantityChoice, setQuantityChoice] = useState<number | "custom" | undefined>();
  const [customQuantityInput, setCustomQuantityInput] = useState("");
  const [quantityTouched, setQuantityTouched] = useState(false);

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
    "rounded-lg border border-ink/[0.09] bg-white px-3 py-2 text-sm font-black text-ink outline-none focus:border-blaze";

  return (
    <div className="mx-auto w-full max-w-[1600px] px-10 pb-8 pt-4">
      <div className="min-h-[140px] rounded-[20px] bg-linear-[173.6deg] from-zap via-blaze via-55% to-grape px-7 py-6">
        <div className="max-w-[512px]">
          <Link
            href="/"
            className="text-xs font-black uppercase tracking-[1.2px] text-white/60 transition-colors hover:text-white"
          >
            ← All Products
          </Link>
          <h1 className="pt-1.5 text-[30px] font-black leading-tight text-white">
            {pageTitle(stickerType)}
          </h1>
          <p className="pt-1 text-sm leading-[1.625] text-white/75">
            {STICKER_TYPE_DESCRIPTIONS[stickerType]}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1.2fr_1.4fr]">
          <StepCard step={1} title="Shape & Cut">
            <div className="flex flex-col gap-3 p-4">
              <div className="flex gap-2 rounded-xl border border-ink/[0.09] bg-mist p-1">
                {CUT_TYPES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCutType(c.value)}
                    aria-pressed={cutType === c.value}
                    className={[
                      "flex flex-1 flex-col items-center rounded-lg py-2 transition-colors",
                      cutType === c.value
                        ? "bg-white text-ink shadow-[0_1px_2px_rgba(32,31,32,0.06),0_6px_12px_rgba(32,31,32,0.07)]"
                        : "text-quiet hover:text-ink",
                    ].join(" ")}
                  >
                    <span className="text-xs font-black">{c.label}</span>
                    <span className="pt-0.5 text-[10px] text-quiet">{c.hint}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {SHAPES.map((s) =>
                  s.value === "CUSTOM" ? (
                    <OptionTile
                      key={s.value}
                      selected={shape === s.value}
                      onClick={() => setShape(s.value)}
                      tone="blaze"
                      className="col-span-2 py-5"
                    >
                      <span className="flex items-center gap-3">
                        <Image src={s.image} alt="" width={64} height={64} className="size-16" />
                        <span className="text-sm font-black">{s.label}</span>
                      </span>
                    </OptionTile>
                  ) : (
                    <OptionTile
                      key={s.value}
                      selected={shape === s.value}
                      onClick={() => setShape(s.value)}
                      tone="blaze"
                      className="gap-2 py-5"
                    >
                      <Image src={s.image} alt="" width={64} height={64} className="size-16" />
                      <span className="text-xs font-black">{s.label}</span>
                    </OptionTile>
                  ),
                )}
              </div>
            </div>
          </StepCard>

          <StepCard step={2} title="Material">
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {FINISHES.map((f) => {
                  const selected = finish === f.value;
                  return (
                    <OptionTile
                      key={f.value}
                      selected={selected}
                      onClick={() => setFinish(f.value)}
                      tone="grape"
                      className="gap-3 py-7"
                    >
                      <Image
                        src={f.icon}
                        alt=""
                        width={32}
                        height={40}
                        // The gloss icon is drawn white for the selected tile;
                        // invert it so it stays visible on the idle grey one.
                        className={["h-10 w-8", f.value === "GLOSS" && !selected ? "invert" : ""].join(" ")}
                      />
                      <span className="text-sm font-black">{f.label}</span>
                    </OptionTile>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-ink/[0.09] pt-4">
                <label className="flex items-center gap-3 text-sm font-black text-ink">
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
                <label className="flex items-center gap-3 text-sm font-black text-ink">
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
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {SIZE_PRESETS.map((p) => {
                  const selected = sizeChoice === p.key;
                  return (
                    <OptionTile
                      key={p.key}
                      selected={selected}
                      onClick={() => setSizeChoice(p.key)}
                      tone="zap"
                      className="min-h-[110px] gap-2 px-2 py-4"
                    >
                      <span className="flex h-14 items-center justify-center">
                        <span
                          className={[
                            "rounded-md border",
                            selected
                              ? "border-ink/25 bg-ink/15"
                              : "border-ink/[0.09] bg-mist",
                          ].join(" ")}
                          style={{ width: p.previewPx, height: p.previewPx }}
                        />
                      </span>
                      <span className="text-center">
                        <span className="block text-xs font-black">{p.label}</span>
                        <span className="block text-[10px] font-normal">
                          {formatMmValue(p.mm)} × {formatMmValue(p.mm)} mm
                        </span>
                      </span>
                    </OptionTile>
                  );
                })}
                <OptionTile
                  selected={sizeChoice === "custom"}
                  onClick={() => setSizeChoice("custom")}
                  tone="zap"
                  className="col-span-2 min-h-16 px-2 py-4"
                >
                  <span className="flex items-center gap-2 text-sm font-black">
                    <span aria-hidden className="text-lg font-normal">
                      ✎
                    </span>
                    Custom size
                  </span>
                </OptionTile>
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
            <div className="flex flex-col gap-0.5 px-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setQuantityChoice("custom");
                  setQuantityTouched(true);
                }}
                aria-pressed={quantityChoice === "custom"}
                className={[
                  "flex items-center justify-between rounded-xl border p-3 text-sm font-black transition-colors",
                  quantityChoice === "custom"
                    ? "border-blaze bg-blaze text-white"
                    : "border-transparent text-quiet hover:bg-mist",
                ].join(" ")}
              >
                Custom
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
                    setCustomQuantityInput(String(clampQuantity(Number.isNaN(n) ? MIN_QUANTITY : n)));
                  }}
                  placeholder={`Enter custom amount. Minimum ${MIN_QUANTITY}`}
                  aria-label="Custom quantity"
                  className={`my-1 w-full ${inputClass}`}
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
                      "flex items-center justify-between rounded-xl border p-3 text-sm font-black transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      selected
                        ? "border-blaze bg-blaze text-white"
                        : "border-transparent text-quiet enabled:hover:bg-mist",
                    ].join(" ")}
                  >
                    <span>{q.toLocaleString("en-ZA")}</span>
                    {preview && (
                      <span className="flex items-center gap-1.5">
                        <span>{formatCurrency(preview.totalPrice)}</span>
                        {preview.discountPercent > 0 && (
                          <span
                            className={[
                              "rounded-md px-1.5 py-0.5 text-[10px]",
                              selected ? "bg-white/25 text-white" : "bg-zap/20 text-zap-ink",
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

            <div className="mt-auto pt-3">
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
                "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                isDraggingOver ? "border-blaze bg-blaze/5" : "border-ink/[0.09] bg-mist",
              ].join(" ")}
            >
              {uploadStatus === "uploading" ? (
                <>
                  <span aria-hidden className="animate-pulse text-2xl">
                    ⬆️
                  </span>
                  <p className="text-sm font-black text-ink">
                    {uploadProgress >= 100 ? "Finishing up…" : `Uploading… ${uploadProgress}%`}
                  </p>
                  <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-ink/10">
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
                  <p className="max-w-sm text-sm text-ink">
                    <span className="font-black">{artworkFilename}</span> uploaded
                  </p>
                  <p className="text-xs text-quiet">Click or drop a file to replace it</p>
                </>
              ) : (
                <>
                  <span aria-hidden className="text-2xl">
                    ⬆️
                  </span>
                  <p className="text-base font-black text-ink">Drag or click to upload your file</p>
                  <p className="text-sm text-quiet">
                    All formats supported. 25MB max · 1 design max
                  </p>
                </>
              )}
            </div>
            {uploadStatus === "error" && uploadError && (
              <p className="mt-3 text-sm font-black text-blaze">{uploadError}</p>
            )}
          </div>
        </StepCard>

        <div className="flex items-center justify-end gap-4">
          {!allComplete && (
            <p className="text-sm text-white/60">Finish all five steps to add to cart</p>
          )}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!allComplete || isAddingToCart}
            className="rounded-xl bg-blaze px-8 py-3.5 text-base font-black text-white transition-colors hover:bg-blaze/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isAddingToCart ? "Adding to cart…" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
