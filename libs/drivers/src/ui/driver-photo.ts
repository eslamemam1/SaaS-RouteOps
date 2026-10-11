// A driver photo is shown at most a few dozen pixels wide, so 256 pixels is
// sharp on any screen and a WebP of that size is usually 10 to 30 KB.
export const photoSide = 256;

const photoQuality = 0.8;
const largestSourceBytes = 25 * 1024 * 1024;

export interface SquareCrop {
  readonly x: number;
  readonly y: number;
  readonly side: number;
}

// The largest square in the middle of the picture, where a face usually is.
export function centerSquare(width: number, height: number): SquareCrop {
  const side = Math.min(width, height);
  return {
    x: Math.round((width - side) / 2),
    y: Math.round((height - side) / 2),
    side,
  };
}

// Returns the shrunk photo, or null when the browser cannot read the file as
// a picture. Drawing it again drops the camera details, such as where it was
// taken.
export async function shrinkPhoto(file: File): Promise<Blob | null> {
  if (!file.type.startsWith('image/') || file.size > largestSourceBytes) {
    return null;
  }
  let picture: ImageBitmap;
  try {
    picture = await createImageBitmap(file);
  } catch {
    return null;
  }
  const crop = centerSquare(picture.width, picture.height);
  const canvas = document.createElement('canvas');
  canvas.width = photoSide;
  canvas.height = photoSide;
  const context = canvas.getContext('2d');
  if (!context || crop.side === 0) {
    picture.close();
    return null;
  }
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    picture,
    crop.x,
    crop.y,
    crop.side,
    crop.side,
    0,
    0,
    photoSide,
    photoSide,
  );
  picture.close();

  const webp = await encode(canvas, 'image/webp');
  if (webp?.type === 'image/webp') {
    return webp;
  }
  return encode(canvas, 'image/jpeg');
}

function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, photoQuality));
}
