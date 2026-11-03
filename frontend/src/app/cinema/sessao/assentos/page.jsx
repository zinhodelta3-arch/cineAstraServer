import SeatSelection from "@/components/cinema/assentos/seat-selection";

export const metadata = {
  title: "Escolha seus assentos | CineAstra",
  description: "Selecione seus lugares para a sessão de cinema.",
};

export default async function AssentosPage({ searchParams }) {
  const { sessionId } = await searchParams;
  return <SeatSelection sessionId={typeof sessionId === "string" ? sessionId : ""} />;
}
