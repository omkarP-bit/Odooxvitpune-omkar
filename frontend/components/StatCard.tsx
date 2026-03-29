import Card from "./Card";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, icon, accent }: Props) {
  return (
    <Card glow={accent} className={`p-6 animate-float ${accent ? "border-[#FDE047]/20" : ""}`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-white/40 text-xs uppercase tracking-widest font-medium">{label}</p>
        {icon && (
          <span className={`text-lg ${accent ? "text-[#FDE047]" : "text-white/20"}`}>{icon}</span>
        )}
      </div>
      <p className={`text-4xl font-black tracking-tight ${accent ? "text-[#FDE047]" : "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-white/30 text-xs mt-2">{sub}</p>}
    </Card>
  );
}
