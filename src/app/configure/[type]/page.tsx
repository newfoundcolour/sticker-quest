import { notFound } from "next/navigation";
import { slugToStickerType } from "@/lib/stickerTypeSlug";
import { getPricingConfig } from "@/lib/pricing";
import { TypeConfigurator } from "@/components/configurator/TypeConfigurator";

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
    <main className="flex min-h-screen flex-col items-center">
      <TypeConfigurator stickerType={stickerType} pricingConfig={pricingConfig} />
    </main>
  );
}
