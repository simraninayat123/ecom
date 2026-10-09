export function EmptyState({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="admin-empty">
      <strong>{title}</strong>
      {message && <p>{message}</p>}
    </div>
  );
}
