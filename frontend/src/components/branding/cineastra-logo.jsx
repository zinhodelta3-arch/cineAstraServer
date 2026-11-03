import styles from "./cineastra-logo.module.css";

export default function CineAstraLogo({ className = "" }) {
  return <svg
    viewBox="0 0 1416 1111"
    width="40"
    height="40"
    aria-hidden="true"
    focusable="false"
    className={`${styles.logo} ${className}`}
  >
    <use href="/CineAstra.svg#cineastra-logo" />
  </svg>;
}
