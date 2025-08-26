import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resizeAndCompressImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const reader = new FileReader();

    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        return reject(new Error("Failed to read file."));
      }
    };
    reader.onerror = reject;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return reject(new Error("Could not get canvas context."));
      }
      
      // Draw the image onto the canvas, cropping to fit
      const sourceX = 0;
      const sourceY = 0;
      const sourceWidth = img.width;
      const sourceHeight = img.height;
      const destX = 0;
      const destY = 0;
      const destWidth = maxWidth;
      const destHeight = maxHeight;

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        destX,
        destY,
        destWidth,
        destHeight
      );
      
      resolve(canvas.toDataURL("image/webp", quality));
    };

    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

    