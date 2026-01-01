import Script from "next/script";

export default function OpenCVLoader() {
  return <Script src="/opencv.js" strategy="afterInteractive" />;
}
