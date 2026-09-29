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
      {/* Pinned to the viewport, behind this page's content only — the nav and
          footer paint over it with their own background. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="page-glow-left absolute bottom-0 left-0 h-[85vh] w-[70%]" />
        <div className="page-glow-right absolute bottom-0 right-0 h-[85vh] w-[70%]" />
      </div>
      <TypeConfigurator stickerType={stickerType} pricingConfig={pricingConfig} />
      <Reviews />
    </main>
  );
}
