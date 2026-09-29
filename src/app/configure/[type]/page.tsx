import { notFound } from "next/navigation";
import { slugToStickerType } from "@/lib/stickerTypeSlug";
import { getPricingConfig } from "@/lib/pricing";
import { TypeConfigurator } from "@/components/configurator/TypeConfigurator";
import { Reviews } from "@/components/Reviews";

export default async function ConfigureTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const stickerType = slugToStickerType(type);
  if (!stickerType) notFound();

  const pricingConfig = await getPricingConfig(stickerType);

  return (
    <main className="relative isolate flex flex-1 flex-col bg-night">
      <TypeConfigurator stickerType={stickerType} pricingConfig={pricingConfig} />
      <Reviews />
      {/* Sticks to the bottom of the viewport while scrolling, then comes to
          rest at the bottom of <main> — so the glow always ends above the
          footer. Zero height; the glows extend upward behind the content. */}
      <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -z-10 h-0">
        <div className="page-glow-left absolute bottom-0 left-0 h-[85vh] w-[70%]" />
        <div className="page-glow-right absolute bottom-0 right-0 h-[85vh] w-[70%]" />
      </div>
    </main>
  );
}
