export function StatusBadge({
  value,
  tone,
}: {
  value: string;
  tone?: 'good' | 'warn' | 'bad';
}) {
  return (
    <span
      className={`admin-status ${tone ?? (value === 'Active' || value === 'Published' || value === 'Completed' ? 'good' : 'warn')}`}
    >
      {value}
    </span>
  );
}
