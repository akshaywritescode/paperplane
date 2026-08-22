// Reuse the Open Graph image as the Twitter card image. The file convention
// emits `twitter:image` (+ width/height/type) automatically at a reachable
// route, so the card renders when the site is shared on X.
// See app/opengraph-image.tsx for the image design.
// Note: `runtime` is intentionally NOT re-exported — Next.js requires route
// segment config to be statically parseable in-file.
export { alt, size, contentType, default } from "./opengraph-image";
