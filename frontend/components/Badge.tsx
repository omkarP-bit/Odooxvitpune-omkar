const VARIANTS: Record<string, string> = {
  approved:  "badge-green",
  pending:   "badge-amber",
  rejected:  "badge-red",
  cancelled: "badge-grey",
  escalated: "badge-red",
  skipped:   "badge-grey",
  draft:     "badge-blue",
};

export default function Badge({ status, children }: { status?: string; children?: React.ReactNode }) {
  const cls = VARIANTS[status?.toLowerCase() ?? ""] ?? "badge-grey";
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {children ?? status}
    </span>
  );
}
