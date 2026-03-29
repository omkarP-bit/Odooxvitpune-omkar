const MAP: Record<string, string> = {
  APPROVED:  "badge-green",
  PENDING:   "badge-amber",
  REJECTED:  "badge-red",
  CANCELLED: "badge-grey",
  ESCALATED: "badge-red",
  SKIPPED:   "badge-grey",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = MAP[status?.toUpperCase()] ?? "badge-grey";
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}
