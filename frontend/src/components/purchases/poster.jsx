import usePurchasePoster from "@/hooks/cinema/minhascompras/use-purchase-poster";


export default function Poster({ order, large = false }) {
  const { imageSrc, handleError } = usePurchasePoster(order.image);
  return <div className={`cp-poster ${large ? "cp-poster-large" : ""}`}><img src={imageSrc} alt="" loading={large ? "eager" : "lazy"} onError={handleError} /><div className="cp-poster-shade" /><span className="cp-poster-title">{order.type === "streaming" && order.title === "CineAstra Essencial" ? "ESSENCIAL" : order.title}</span><span className="cp-poster-brand">CINEASTRA</span></div>;
}
