export function formatRelativeTime(isoDate: string) {
  const timestamp = new Date(isoDate).getTime();
  const now = Date.now();
  const deltaMinutes = Math.max(0, Math.round((now - timestamp) / 60_000));

  if (deltaMinutes < 1) {
    return "just now";
  }

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.round(deltaHours / 24);
  return `${deltaDays}d ago`;
}
