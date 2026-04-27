export function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    HIGH: "bg-red-500/15 text-red-400 border-red-500/30",
    MEDIUM: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    LOW: "bg-green-500/15 text-green-400 border-green-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold ${styles[level] || styles.LOW}`}>
      {level}
    </span>
  );
}
