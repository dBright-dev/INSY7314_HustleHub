export default function StatusMessage({ type = 'info', children }) {
  if (!children) return null;
  const color = type === 'error' ? 'var(--mauve-deep)' : type === 'success' ? 'var(--green)' : 'var(--muted)';
  return <p role={type === 'error' ? 'alert' : 'status'} style={{ color }}>{children}</p>;
}

