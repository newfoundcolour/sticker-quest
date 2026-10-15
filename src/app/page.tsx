import { Reviews } from "@/components/Reviews";
import { HomeHero } from "@/components/home/HomeHero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { IdealForTicker } from "@/components/home/IdealForTicker";
import { MadeInCapeTown } from "@/components/home/MadeInCapeTown";
import { ProductCards } from "@/components/home/ProductCards";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col overflow-x-clip bg-night">
      <HomeHero />
      <IdealForTicker />
      <ProductCards />
      <Reviews title="Recommended by real people." />
      <HowItWorks />
      <MadeInCapeTown />
    </main>
  );
}
