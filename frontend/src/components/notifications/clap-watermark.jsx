import styles from "./notifications.module.css";

export default function ClapWatermark() {
  return <div className={styles.watermark} aria-hidden="true">
    <svg viewBox="0 0 640 560" fill="none"><defs><pattern id="ca-notification-dots" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="currentColor" /></pattern></defs>
      <g fill="url(#ca-notification-dots)"><rect x="60" y="170" width="540" height="330" rx="22" /><path d="M60 162 32 87Q28 75 42 69L531 3Q546 0 550 14L577 90Z" /></g>
      <path d="M107 68 156 135M218 53 265 119M327 37 375 105M437 22 486 89M100 250H553M100 338H553M300 250V438" stroke="var(--background)" strokeWidth="20" />
    </svg>
  </div>;
}
