import { ChevronDown } from 'lucide-react';
import styles from './schedule-select.module.css';

export default function ScheduleSelect({ children, ...props }) {
  return <span className={styles.field}>
    <select {...props} className={styles.select}>{children}</select>
    <ChevronDown size={15} aria-hidden="true" className={styles.chevron} />
  </span>;
}
