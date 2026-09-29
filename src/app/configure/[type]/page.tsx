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
      <div aria-hidden="true" className="page-glow pointer-events-none absolute inset-0 -z-10" />
      <TypeConfigurator stickerType={stickerType} pricingConfig={pricingConfig} />
      <Reviews />
    </main>
  );
}
