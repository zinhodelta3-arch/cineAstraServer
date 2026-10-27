import Icon from "./icon";
import { FAQ } from "./data";

export default function PartnershipsFaq() {
  return (
    <section className="ca-section ca-wrap ca-bottom-grid" style={{paddingTop:0}}><div><p className="ca-eyebrow"><Icon name="ticket" />Antes de começar</p><h2 className="ca-display">Ficou alguma<br />dúvida?</h2><p className="ca-muted" style={{fontSize:15,lineHeight:1.85,maxWidth:330}}>Os detalhes fazem parte de uma boa experiência. Veja o que considerar antes de aproveitar uma oferta.</p></div><div className="ca-faq">{FAQ.map(([question, answer]) => <details key={question}><summary>{question}<Icon name="plus" /></summary><p>{answer}</p></details>)}</div></section>
  );
}
