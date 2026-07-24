"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { CutType, Finish, Shape, StickerType } from "@/generated/prisma/client";
import type { PricingConfig } from "@/lib/pricing";
import {
  MIN_QUANTITY,
  MAX_QUANTITY,
  MIN_SIZE_CM,
  MAX_SIZE_CM,
  clampQuantity,
  clampSizeCm,
  calculateStickerPricing,
  inchesToCm,
} from "@/lib/pricingUtils";
import { WaypointLine, type WaypointStep } from "./WaypointLine";
import { StepCard, ChoiceChip } from "./StepCard";
import { PriceReadout } from "./PriceReadout";
import { CutIcon } from "@/components/icons/CutIcon";
import { ShapeIcon } from "@/components/icons/ShapeIcon";
import { FinishIcon } from "@/components/icons/FinishIcon";
import { SizeIcon, CustomSizeIcon } from "@/components/icons/SizeIcon";
import { UploadIcon } from "@/components/icons/UploadIcon";
import { STICKER_TYPE_LABELS } from "@/lib/stickerTypeSlug";
import { formatCurrency } from "@/lib/pricingUtils";
import { uploadArtworkAction } from "@/app/actions/upload";
import { MAX_ARTWORK_BYTES } from "@/lib/uploadConstants";

const CUT_TYPES: { value: CutType; label: string; hint: string }[] = [
  { value: "DIE", label: "Die Cut", hint: "Through the backing" },
  { value: "KISS", label: "Kiss Cut", hint: "On a backing square" },
];

const SHAPES: { value: Shape; label: string }[] = [
  { value: "CUSTOM", label: "Custom Shape" },
  { value: "CIRCLE", label: "Circle" },
  { value: "OVAL", label: "Oval" },
  { value: "SQUARE", label: "Square" },
  { value: "RECTANGLE", label: "Rectangle" },
];

const FINISHES: { value: Finish; label: string }[] = [
  { value: "MATTE", label: "Matte" },
  { value: "GLOSS", label: "Gloss" },
];

function formatCm(cm: number): string {
  return `${cm.toFixed(1)} cm`;
}

// Canonical product sizes are defined in inches (2"/3"/4"/5" printer presets)
// and converted to cm here — the customer never sees inches.
const SIZE_PRESETS: { key: string; label: string; cm: number }[] = [
  { key: "small", label: `Small (${formatCm(inchesToCm(2))})`, cm: inchesToCm(2) },
  { key: "medium", label: `Medium (${formatCm(inchesToCm(3))})`, cm: inchesToCm(3) },
  { key: "large", label: `Large (${formatCm(inchesToCm(4))})`, cm: inchesToCm(4) },
  { key: "xlarge", label: `X-Large (${formatCm(inchesToCm(5))})`, cm: inchesToCm(5) },
];

const QUANTITY_PRESETS = [100, 200, 300, 500, 1000, 3000];

const STEPS: readonly WaypointStep[] = [
  { key: "shapeCut", label: "Shape & Cut" },
  { key: "material", label: "Material" },
  { key: "size", label: "Size" },
  { key: "quantity", label: "Quantity" },
  { key: "upload", label: "Upload" },
];

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
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preset = SIZE_PRESETS.find((p) => p.key === sizeChoice);
  const customWidth = parseFloat(customWidthInput);
  const customHeight = parseFloat(customHeightInput);
  const hasCustomSize =
    sizeChoice === "custom" && !Number.isNaN(customWidth) && !Number.isNaN(customHeight);
  const hasSize = !!preset || hasCustomSize;

  const widthCm = preset ? preset.cm : clampSizeCm(customWidth || 0);
  const heightCm = preset ? preset.cm : clampSizeCm(customHeight || 0);

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
  const activeIndex = completed.findIndex((c) => !c);
  const currentStep = activeIndex === -1 ? STEPS.length - 1 : activeIndex;

  function selectQuantity(q: number) {
    setQuantityChoice(q);
    setQuantityTouched(true);
  }

  async function handleFile(file: File) {
    if (file.size > MAX_ARTWORK_BYTES) {
      setUploadStatus("error");
      setUploadError(`"${file.name}" is too large — max ${MAX_ARTWORK_BYTES / 1024 / 1024}MB.`);
      return;
    }

    setUploadStatus("uploading");
    setUploadError(undefined);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadArtworkAction(formData);

    if (result.ok) {
      setArtworkUrl(result.url);
      setArtworkFilename(result.filename);
      setUploadStatus("idle");
    } else {
      setUploadStatus("error");
      setUploadError(result.error);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/"
        className="group inline-flex items-center gap-1.5 font-mono text-sm uppercase tracking-wide text-coral-signal"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 origin-center transition-transform duration-150 group-hover:scale-125"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 6l-6 6 6 6" />
        </svg>
        <span className="origin-left transition-transform duration-150 group-hover:scale-110">
          {STICKER_TYPE_LABELS[stickerType]}
        </span>
      </Link>
      <h1 className="mt-2 font-display text-4xl font-bold text-ink-navy">
        Build your stickers
      </h1>

      <WaypointLine steps={STEPS} completed={completed} activeIndex={currentStep} />

      <PriceReadout
        totalPrice={pricing?.totalPrice ?? null}
        pricePerUnit={pricing?.pricePerUnit ?? null}
        quantity={quantity}
        savingsPercent={pricing?.discountPercent ?? 0}
        status={hasSize ? "ready" : "empty"}
      />

      <div className="mt-10 flex flex-col gap-6">
        <StepCard title="Shape & Cut" done={completed[0]}>
          <p className="mb-2 text-sm font-medium text-ink-navy/70">Cut type</p>
          <div className="flex flex-wrap gap-3">
            {CUT_TYPES.map((c) => (
              <ChoiceChip
                key={c.value}
                label={c.label}
                hint={c.hint}
                selected={cutType === c.value}
                onClick={() => setCutType(c.value)}
              >
                <CutIcon cut={c.value} className="h-full w-full" />
              </ChoiceChip>
            ))}
          </div>

          <p className="mt-6 mb-2 text-sm font-medium text-ink-navy/70">Shape</p>
          <div className="flex flex-wrap gap-3">
            {SHAPES.map((s) => (
              <ChoiceChip
                key={s.value}
                label={s.label}
                selected={shape === s.value}
                onClick={() => setShape(s.value)}
              >
                <ShapeIcon shape={s.value} className="h-full w-full" />
              </ChoiceChip>
            ))}
          </div>
        </StepCard>

        <StepCard title="Material" done={completed[1]}>
          <div className="flex flex-wrap gap-3">
            {FINISHES.map((f) => (
              <ChoiceChip
                key={f.value}
                label={f.label}
                selected={finish === f.value}
                onClick={() => setFinish(f.value)}
              >
                <FinishIcon finish={f.value} className="h-full w-full" />
              </ChoiceChip>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <label className="flex items-center gap-3 text-sm text-ink-navy">
              <input
                type="checkbox"
                checked={whiteInk}
                onChange={(e) => setWhiteInk(e.target.checked)}
                className="h-4 w-4 accent-coral-signal"
              />
              White ink
              {isHolographic && (
                <span className="text-xs text-ink-navy/45">(no effect on holographic)</span>
              )}
            </label>
            <label className="flex items-center gap-3 text-sm text-ink-navy">
              <input
                type="checkbox"
                checked={lamination}
                onChange={(e) => setLamination(e.target.checked)}
                className="h-4 w-4 accent-coral-signal"
              />
              Lamination
            </label>
          </div>
        </StepCard>

        <StepCard
          title="Size"
          done={completed[2]}
          description={
            sizeChoice === "custom"
              ? `Both dimensions must be between ${formatCm(MIN_SIZE_CM)} and ${formatCm(MAX_SIZE_CM)}.`
              : `Preset sizes are treated as a square — e.g. Medium is ${formatCm(inchesToCm(3))} x ${formatCm(inchesToCm(3))}.`
          }
        >
          <div className="flex flex-wrap gap-3">
            {SIZE_PRESETS.map((p) => (
              <ChoiceChip
                key={p.key}
                label={p.label}
                selected={sizeChoice === p.key}
                onClick={() => setSizeChoice(p.key)}
              >
                <SizeIcon cm={p.cm} className="h-full w-full" />
              </ChoiceChip>
            ))}
            <ChoiceChip
              label="Custom size"
              selected={sizeChoice === "custom"}
              onClick={() => setSizeChoice("custom")}
            >
              <CustomSizeIcon className="h-full w-full" />
            </ChoiceChip>
          </div>

          {sizeChoice === "custom" && (
            <div className="mt-4 flex gap-4">
              <label className="flex flex-col gap-1 text-sm text-ink-navy/70">
                Height (cm)
                <input
                  type="number"
                  min={MIN_SIZE_CM}
                  max={MAX_SIZE_CM}
                  step={0.1}
                  value={customHeightInput}
                  onChange={(e) => setCustomHeightInput(e.target.value)}
                  onBlur={() => {
                    const n = parseFloat(customHeightInput);
                    if (!Number.isNaN(n)) setCustomHeightInput(String(clampSizeCm(n)));
                  }}
                  className="w-28 rounded-lg border border-ink-navy/15 px-3 py-2 font-mono text-sm outline-none focus:border-coral-signal"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-ink-navy/70">
                Width (cm)
                <input
                  type="number"
                  min={MIN_SIZE_CM}
                  max={MAX_SIZE_CM}
                  step={0.1}
                  value={customWidthInput}
                  onChange={(e) => setCustomWidthInput(e.target.value)}
                  onBlur={() => {
                    const n = parseFloat(customWidthInput);
                    if (!Number.isNaN(n)) setCustomWidthInput(String(clampSizeCm(n)));
                  }}
                  className="w-28 rounded-lg border border-ink-navy/15 px-3 py-2 font-mono text-sm outline-none focus:border-coral-signal"
                />
              </label>
            </div>
          )}
        </StepCard>

        <StepCard
          title="Quantity"
          done={completed[3]}
          description={!hasSize ? "Pick a size first to see pricing per quantity." : undefined}
        >
          <div className="flex flex-wrap gap-3">
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
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => selectQuantity(q)}
                  disabled={!hasSize}
                  className={[
                    "rounded-xl border-2 px-4 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    quantityChoice === q
                      ? "border-coral-signal bg-coral-signal/5"
                      : "border-ink-navy/10 hover:border-ink-navy/30",
                  ].join(" ")}
                >
                  <span className="block font-mono text-sm font-medium text-ink-navy">
                    {q.toLocaleString()}
                  </span>
                  {preview && (
                    <>
                      <span className="block font-mono text-xs text-ink-navy/60">
                        {formatCurrency(preview.totalPrice)}
                      </span>
                      {preview.discountPercent > 0 && (
                        <span className="block text-xs font-semibold text-trail-teal">
                          Save {preview.discountPercent}%
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setQuantityChoice("custom");
                setQuantityTouched(true);
              }}
              className={[
                "rounded-xl border-2 px-4 py-2 text-left transition-colors",
                quantityChoice === "custom"
                  ? "border-coral-signal bg-coral-signal/5"
                  : "border-ink-navy/10 hover:border-ink-navy/30",
              ].join(" ")}
            >
              <span className="block font-mono text-sm font-medium text-ink-navy">Custom</span>
            </button>
          </div>

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
              placeholder="Enter custom amount. Minimum 50"
              className="mt-4 w-64 rounded-lg border border-ink-navy/15 px-3 py-2 font-mono text-sm outline-none focus:border-coral-signal"
            />
          )}
        </StepCard>

        <StepCard title="Upload" done={completed[4]}>
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
            onClick={() => uploadStatus !== "uploading" && fileInputRef.current?.click()}
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
              "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              isDraggingOver ? "border-coral-signal bg-coral-signal/5" : "border-ink-navy/20",
            ].join(" ")}
          >
            {uploadStatus === "uploading" ? (
              <>
                <UploadIcon className="h-10 w-10 animate-pulse text-ink-navy/40" />
                <p className="text-sm text-ink-navy/60">Uploading…</p>
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
                >
                  <path d="M4 10.5l4 4 8-9" />
                </svg>
                <p className="max-w-sm text-sm text-ink-navy">
                  <span className="font-medium">{artworkFilename}</span> uploaded
                </p>
                <p className="text-xs text-ink-navy/50">Click or drop a file to replace it</p>
              </>
            ) : (
              <>
                <UploadIcon className="h-10 w-10 text-ink-navy/40" />
                <p className="max-w-sm text-sm text-ink-navy/60">
                  Drag or click to upload your file. All formats support, we recommend image
                  files without cutlines. 25MB Max &bull; 1 Design Max
                </p>
              </>
            )}
          </div>
          {uploadStatus === "error" && uploadError && (
            <p className="mt-3 text-sm text-coral-signal">{uploadError}</p>
          )}
        </StepCard>
      </div>
    </div>
  );
}
