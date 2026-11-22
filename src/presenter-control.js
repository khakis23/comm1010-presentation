export const COMMAND_LIFETIME = 10_000;
const commands = new Set(['next', 'prev', 'simulate', 'reset']);

export function validCommand(command) {
  return commands.has(command);
}

export function validStation(station) {
  return Number.isInteger(station?.index) && station.index >= 1 && station.index <= 5
    && typeof station.title === 'string' && station.title.length > 0 && station.title.length <= 160;
}
