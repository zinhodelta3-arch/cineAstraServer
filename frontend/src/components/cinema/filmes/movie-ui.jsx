import styles from "./filmes.module.css";

export function AgeRating({ age }) {
  return <span className={`${styles.ageRating} ${styles[`age${age}`]}`} aria-label={age === "L" ? "Classificação livre" : `Classificação: ${age} anos`}>{age}</span>;
}

export function Barcode({ seed }) {
  return <div className={styles.barcode} aria-hidden="true">{Array.from({ length: 34 }, (_, i) => (
    <span key={i} style={{ width: ((i * seed) % 3) + 1, height: `${60 + ((i * 13 + seed) % 40)}%` }} />
  ))}</div>;
}
