export function formatDuration(duration?: string) {
  if (!duration) {
    return undefined;
  }

  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!match) {
    return duration;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes ? `${totalMinutes} min` : undefined;
}