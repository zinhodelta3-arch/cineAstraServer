import { STATUS } from "./purchase-data";

export default function StatusBadge({ status }) {
  const current = STATUS[status];
  return <span className={`cp-status cp-status-${status}`}><span />{current.label}</span>;
}
