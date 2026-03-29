const VARIANTS = {
  approved: 'badge-green',
  pending: 'badge-amber',
  rejected: 'badge-red',
  draft: 'badge-blue',
  default: 'badge-grey',
};

export default function Badge({ status, children }) {
  const cls = VARIANTS[status?.toLowerCase()] || VARIANTS.default;
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {children || status}
    </span>
  );
}
