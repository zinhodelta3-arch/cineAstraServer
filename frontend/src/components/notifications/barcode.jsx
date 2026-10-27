import styles from "./notifications.module.css";

export default function Barcode() {
  return <div className={styles.barcode} aria-hidden="true">{Array.from({ length: 30 }, (_, i) => <i key={i} style={{ width: (i * 7) % 3 + 1, height: `${65 + (i * 13) % 35}%` }} />)}</div>;
}
