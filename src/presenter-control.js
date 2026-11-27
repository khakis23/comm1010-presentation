export const COMMAND_LIFETIME = 10_000;
const commands = new Set(['next', 'prev', 'simulate', 'reset']);

export function validCommand(command) {
  return commands.has(command);
}

export function readStation(station) {
  if (!station) return null;
  const { index, title, total = 5 } = station;
  if (!Number.isSafeInteger(index) || !Number.isSafeInteger(total) || index < 1 || index > total
    || typeof title !== 'string' || !title.trim() || title.length > 160) return null;
  return { index, total, title };
}
