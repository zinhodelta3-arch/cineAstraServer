import CinemaPayment from "@/components/cinema/pagamento/cinema-payment";
import { validOrderId } from "@/lib/api/purchases.mjs";

export default async function Page({ searchParams }) {
  const { draft } = await searchParams;
  return <CinemaPayment draftId={validOrderId(draft) ? draft : null} />;
}
