type StatCardProps = {
  label: string;
  value: string;
  change: string;
};

export default function StatCard({
  label,
  value,
  change,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 transition hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight">
        {value}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

        <p className="text-sm font-medium text-green-400">
          {change}
        </p>
      </div>
    </div>
  );
}