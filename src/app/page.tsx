import { TypeGrid } from "@/components/configurator/TypeGrid";

export default function Home() {
  return (
    <main className="relative isolate flex flex-1 flex-col bg-night">
      <TypeGrid />
      {/* Same bottom-corner glows as the configurator page. */}
      <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -z-10 h-0">
        <div className="page-glow-left absolute bottom-0 left-0 h-[85vh] w-[70%]" />
        <div className="page-glow-right absolute bottom-0 right-0 h-[85vh] w-[70%]" />
      </div>
    </main>
  );
}
