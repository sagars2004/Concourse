type Level = "green" | "yellow" | "red";

const config: Record<Level, { colorClass: string; dotClass: string; label: string }> = {
  green: {
    colorClass: "text-success",
    dotClass: "bg-success",
    label: "Plenty of time",
  },
  yellow: {
    colorClass: "text-warning",
    dotClass: "bg-warning",
    label: "Tight but doable",
  },
  red: {
    colorClass: "text-danger",
    dotClass: "bg-danger",
    label: "Stay near gate",
  },
};

export function TimeIndicator({ level }: { level: Level }) {
  const { colorClass, dotClass, label } = config[level];
  return (
    <div className={`flex items-center gap-1.5 ${colorClass}`}>
      <span
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotClass}`}
      />
      <span className="text-xs font-medium whitespace-nowrap">{label}</span>
    </div>
  );
}
