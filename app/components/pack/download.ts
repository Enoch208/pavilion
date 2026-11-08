const REVOKE_AFTER_MS = 10_000;

export function saveFile(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}

export function textFile(text: string, type: string): Blob {
  return new Blob([text], { type: `${type};charset=utf-8` });
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not encode the PNG."));
    }, "image/png");
  });
}

export async function svgToPng(
  svg: string,
  widthPx: number,
  heightPx: number,
): Promise<Blob> {
  const url = URL.createObjectURL(textFile(svg, "image/svg+xml"));
  try {
    const image = new Image(widthPx, heightPx);
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The browser could not draw the PNG.");
    context.drawImage(image, 0, 0, widthPx, heightPx);
    return await canvasBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}
