import Icon from "./icon";

export default function SectionHeading({ eyebrow, title, description }) {
  return <div className="ca-section-head"><div><p className="ca-eyebrow"><Icon name="film" />{eyebrow}</p><h2 className="ca-display">{title}</h2></div>{description && <p className="ca-muted">{description}</p>}</div>;
}
