

export default function Barcode() {
  return <div className="ca-barcode" aria-hidden="true">{Array.from({ length: 43 }, (_, index) => <i key={index} style={{ width: `${1 + (index * 7) % 3}px`, height: `${70 + (index * 11) % 30}%` }} />)}</div>;
}
