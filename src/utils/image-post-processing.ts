/**
 * Processes an image using OpenCV.js to create a clean, high-contrast document.
 * Pipeline: Grayscale → Gaussian Blur → Adaptive Thresholding
 *
 * IMPORTANT:
 * - OpenCV.js must be loaded via <Script> and available as window.cv
 * - This function MUST run in the browser (Client Component)
 *
 * @param imageFile The original image file
 * @returns Promise with the processed File and Object URL
 */
export const processImage = async (
  imageFile: File,
): Promise<{ file: File; url: string }> => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cv = (window as any).cv;

    if (!cv) {
      reject(new Error("OpenCV.js is not loaded"));
      return;
    }

    const waitForOpenCV = () => {
      // ✅ wasm ready check (THIS is the key)
      if (cv.Mat) {
        run();
      } else {
        setTimeout(waitForOpenCV, 30);
      }
    };

    const run = () => {
      const img = new Image();
      const originalUrl = URL.createObjectURL(imageFile);

      img.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let src: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let dst: any = null;

        try {
          src = cv.imread(img);
          dst = new cv.Mat();

          cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);

          const ksize = new cv.Size(5, 5);
          cv.GaussianBlur(src, src, ksize, 0, 0, cv.BORDER_DEFAULT);

          cv.adaptiveThreshold(
            src,
            dst,
            255,
            cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv.THRESH_BINARY,
            21,
            10,
          );

          const outputCanvas = document.createElement("canvas");
          cv.imshow(outputCanvas, dst);

          src.delete();
          dst.delete();
          URL.revokeObjectURL(originalUrl);

          outputCanvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas encoding failed"));
                return;
              }

              const file = new File([blob], `ocr_${Date.now()}.png`, {
                type: "image/png",
              });

              resolve({
                file,
                url: URL.createObjectURL(file),
              });
            },
            "image/png",
            1,
          );
        } catch (err) {
          if (src) src.delete();
          if (dst) dst.delete();
          URL.revokeObjectURL(originalUrl);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(originalUrl);
        reject(new Error("Image load failed"));
      };

      img.src = originalUrl;
    };

    // 🚀 start here
    waitForOpenCV();
  });
};
