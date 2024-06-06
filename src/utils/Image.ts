/**
 * Check if format is
 * @param format
 * @param dataUri
 * @returns
 */
export const isFormatSupported = (format: string, dataUri: string) =>
  new Promise<true>((resolve, reject) => {
    const image = new Image();

    image.src = `data:image/${format};base64,${dataUri}`;

    image.onload = () => {
      resolve(true);
    };

    image.onerror = () => {
      reject(format.toUpperCase() + " format not supported");
    };
  });

export const isAvifSupported = () =>
  isFormatSupported(
    "avif",
    "AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A="
  );

export const isWebpAlphaSupported = () =>
  isFormatSupported(
    "webp",
    "UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA=="
  );

export const loadImage = (src: string, { async = false } = {}) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    if (async) {
      image.decoding = "async";
    }

    function cleanup() {
      image.onload = null;
      image.onerror = null;
    }

    image.onload = () => {
      cleanup();
      resolve(image);
    };

    image.onerror = () => {
      cleanup();
      reject(`Image with name '...${src}' was not found.`);
    };

    image.src = src;
  });
};

export type ImageFormat = 'avif' | 'webp' | 'png';
export const getImageFormat = async (fallback: ImageFormat = 'png'): Promise<ImageFormat> => {
  // check for best image format supported
  if ((await isAvifSupported().catch(console.warn)) || false) {
    return 'avif';
  }
  if ((await isWebpAlphaSupported().catch(console.warn)) || false) {
    return 'webp';
  }

  return fallback;
};