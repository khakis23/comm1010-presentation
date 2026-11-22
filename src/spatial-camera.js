// X and Y are viewport fractions. Z is relative to perspective depth.
const STATIONS = [
  { x: 0, y: 0, z: 0, yaw: 0 },
  { x: 1.25, y: 0.06, z: -0.18, yaw: -10 },
  { x: 2.5, y: -0.06, z: -0.34, yaw: 8 },
  { x: 3.75, y: 0.04, z: -0.13, yaw: -8 },
  { x: 5, y: 0, z: 0, yaw: 0 },
];

function transform(x, y, z, yaw) {
  return `translate3d(${x}px, ${y}px, ${z}px) rotateY(${yaw}deg)`;
}

export function createSpatialCamera(viewport, onStationChange) {
  const world = viewport.querySelector('#stage-world');
  const stations = Array.from(world.querySelectorAll('[data-station]'), (element) => ({
    element,
    heading: element.querySelector('h1'),
  }));
  let active = 0;
  let positions;

  function aim() {
    const { x, y, z, yaw } = positions[active];
    const angle = yaw * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    // Invert the station's translation and yaw so its face fills the viewport.
    world.style.transform = transform(-x * cos + z * sin, -y, -x * sin - z * cos, -yaw);
  }

  function layout() {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const depth = Math.max(width, 700);
    viewport.style.perspective = `${depth}px`;
    positions = STATIONS.map(({ x, y, z, yaw }, index) => {
      const position = { x: x * width, y: y * height, z: z * depth, yaw };
      stations[index].element.style.transform = transform(position.x, position.y, position.z, yaw);
      return position;
    });
    aim();
  }

  function announce(focus) {
    const { heading } = stations[active];
    if (focus) heading.focus({ preventScroll: true });
    onStationChange({ index: active + 1, title: heading.textContent.trim() });
  }

  function move(delta) {
    const next = active + delta;
    if (next < 0 || next >= stations.length) return;
    stations[active].element.inert = true;
    stations[active].element.removeAttribute('data-active');
    active = next;
    stations[active].element.inert = false;
    stations[active].element.setAttribute('data-active', '');
    aim();
    announce(true);
  }

  layout();
  world.setAttribute('data-ready', '');
  new ResizeObserver(() => {
    world.setAttribute('data-resizing', '');
    layout();
    world.getBoundingClientRect();
    world.removeAttribute('data-resizing');
  }).observe(viewport);
  announce(false);

  return {
    next: () => move(1),
    prev: () => move(-1),
    focus: () => stations[active].heading.focus({ preventScroll: true }),
  };
}
