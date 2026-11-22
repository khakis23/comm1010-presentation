import qrcode from 'qrcode-generator';

export function drawVoteQr(canvas, url) {
  const qr = qrcode(0, 'M');
  qr.addData(url.href);
  qr.make();

  const margin = 4;
  const pixelSize = 6;
  const modules = qr.getModuleCount();
  const size = (modules + margin * 2) * pixelSize;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');

  canvas.width = size;
  canvas.height = size;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, size, size);
  context.fillStyle = '#000';
  for (let row = 0; row < modules; row += 1) {
    for (let column = 0; column < modules; column += 1) {
      if (qr.isDark(row, column)) {
        context.fillRect((column + margin) * pixelSize, (row + margin) * pixelSize, pixelSize, pixelSize);
      }
    }
  }
  canvas.hidden = false;
}
