/**
 * PROJECT_BASELINE 2-1: WebP, 긴쪽 1280px 이하, 최대 300KB, 품질 75~80, EXIF 제거
 */

const MAX_LONG_EDGE = 1280;
const MAX_BYTES = 300 * 1024;
const QUALITY_MIN = 0.7;
const QUALITY_INIT = 0.78;

export async function processIssueImage(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const { width, height } = scaleDimensions(img.width, img.height, MAX_LONG_EDGE);

  let quality = QUALITY_INIT;
  let blob: Blob | null = null;

  while (quality >= QUALITY_MIN) {
    blob = await canvasToWebP(img, width, height, quality);
    if (blob.size <= MAX_BYTES) return blob;
    quality -= 0.05;
  }

  if (blob) return blob;
  return canvasToWebP(img, width, height, QUALITY_MIN);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지 로드 실패'));
    };
    img.src = url;
  });
}

function scaleDimensions(
  w: number,
  h: number,
  maxLong: number
): { width: number; height: number } {
  if (w <= maxLong && h <= maxLong) return { width: w, height: h };
  if (w >= h) {
    return { width: maxLong, height: Math.round((h * maxLong) / w) };
  }
  return { width: Math.round((w * maxLong) / h), height: maxLong };
}

function canvasToWebP(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('WebP 변환 실패'))),
      'image/webp',
      quality
    );
  });
}
