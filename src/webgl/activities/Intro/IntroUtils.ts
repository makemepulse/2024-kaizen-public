import AssetDatabase from "@webgl/resources/AssetDatabase";

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = AssetDatabase.getAssetPath(decodeURI(src));
  });
}