import { notFound, redirect } from "next/navigation";
import { STICKER_TYPE_SLUGS, slugToStickerType } from "@/lib/stickerTypeSlug";
import { getPricingConfig } from "@/lib/pricing";
import { SHEET_MATERIALS, orderNumber } from "@/lib/orderLabels";
import { cmToMm } from "@/lib/pricingUtils";
import { getSessionUser, isEmailVerified } from "@/lib/auth";
import { findCustomerOrderItem } from "@/lib/customerOrders";
import { getCart } from "@/lib/cart";
import { TypeConfigurator, type ReorderSelection } from "@/components/configurator/TypeConfigurator";
import { Container } from "@/components/Container";
import { Reviews } from "@/components/Reviews";

/**
 * ?reorder=<orderItemId> prefills the configurator from one of the logged-in
 * customer's own past items. Anyone else's item id (or no login) is ignored.
 */
async function loadReorder(reorderId: string | undefined) {
  if (!reorderId) return null;
  const user = await getSessionUser();
  if (!user || !isEmailVerified(user)) return null;
  return findCustomerOrderItem(user.id, reorderId);
}

/** ?edit=<cartLineId> prefills the configurator from a line in the visitor's own cart. */
async function loadCartLine(editId: string | undefined) {
  if (!editId) return null;
  const cart = await getCart();
  return cart.find((item) => item.id === editId) ?? null;
}

export default async function ConfigureTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ reorder?: string; edit?: string }>;
}) {
  const { type } = await params;
  const stickerType = slugToStickerType(type);
  if (!stickerType) notFound();

  const { reorder, edit } = await searchParams;
  const editItem = await loadCartLine(edit);
  // Editing a cart line wins over a reorder link.
  const reorderItem = editItem ? null : await loadReorder(reorder);
  // Keep the URL honest if someone edits the type part of an edit or reorder link.
  if (editItem && editItem.stickerType !== stickerType) {
    redirect(`/configure/${STICKER_TYPE_SLUGS[editItem.stickerType]}?edit=${encodeURIComponent(editItem.id)}`);
  }
  if (reorderItem && reorderItem.stickerType !== stickerType) {
    redirect(`/configure/${STICKER_TYPE_SLUGS[reorderItem.stickerType]}?reorder=${encodeURIComponent(reorderItem.id)}`);
  }
  const initialSelection: ReorderSelection | undefined = editItem
    ? {
        cutType: editItem.cutType,
        shape: editItem.shape,
        finish: editItem.finish,
        roundedCorners: editItem.roundedCorners ?? false,
        whiteInk: editItem.whiteInk,
        lamination: editItem.lamination,
        widthMm: cmToMm(editItem.widthCm),
        heightMm: cmToMm(editItem.heightCm),
        quantity: editItem.quantity,
        sheetMaterial: editItem.sheetMaterial,
        sheetCuts: editItem.sheetCuts,
        artworkUrl: editItem.artworkUrl,
        artworkFilename: editItem.artworkFilename,
      }
    : reorderItem
    ? {
        sourceItemId: reorderItem.id,
        cutType: reorderItem.cutType,
        shape: reorderItem.shape,
        finish: reorderItem.finish,
        roundedCorners: reorderItem.roundedCorners,
        whiteInk: reorderItem.whiteInk,
        lamination: reorderItem.lamination,
        widthMm: cmToMm(Number(reorderItem.widthCm)),
        heightMm: cmToMm(Number(reorderItem.heightCm)),
        quantity: reorderItem.quantity,
        sheetMaterial: reorderItem.sheetMaterial ?? undefined,
        sheetCuts: reorderItem.sheetCuts ?? undefined,
        artworkUrl: reorderItem.artworkUrl,
        artworkFilename: reorderItem.artworkFilename ?? "Your artwork",
      }
    : undefined;

  const pricingConfig = await getPricingConfig(stickerType);
  // A sticker sheet is priced on whichever material the customer picks.
  const materialPricingConfigs =
    stickerType === "STICKER_SHEETS"
      ? Object.fromEntries(
          await Promise.all(
            SHEET_MATERIALS.map(async (m) => [m, await getPricingConfig(m)] as const),
          ),
        )
      : undefined;

  return (
    <main className="relative isolate flex flex-1 flex-col bg-night">
      {editItem && (
        <Container className="pt-4">
          <p role="status" className="rounded-[20px] border-[1.5px] border-zap bg-zap/10 px-5 py-3 text-sm text-white">
            <span className="font-black text-zap">Editing a sticker in your cart.</span> Change anything
            you like, then save. Your cart updates with the new choices and price.
          </p>
        </Container>
      )}
      {reorderItem && (
        <Container className="pt-4">
          <p role="status" className="rounded-[20px] border-[1.5px] border-zap bg-zap/10 px-5 py-3 text-sm text-white">
            <span className="font-black text-zap">Reordering from order {orderNumber(reorderItem.order.id)}.</span>{" "}
            We&apos;ve filled in your last choices and artwork. Change anything you like. The price
            below is today&apos;s price.
          </p>
        </Container>
      )}
      <TypeConfigurator
        // Remount when switching between a normal, edit and reorder visit.
        key={editItem ? `edit-${editItem.id}` : (reorderItem?.id ?? "new")}
        initialSelection={initialSelection}
        editCartItemId={editItem?.id}
        stickerType={stickerType}
        pricingConfig={pricingConfig}
        materialPricingConfigs={materialPricingConfigs}
      />
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
