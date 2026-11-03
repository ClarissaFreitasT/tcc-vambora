import { useEffect, useState } from "react";

export default function ObjectUrlImage({ file, alt = "", className = "" }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    const frame = requestAnimationFrame(() => setPreview({ file, url }));
    return () => {
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const src = preview?.file === file ? preview.url : null;
  if (!src) return <div className={className} aria-hidden="true" />;
  return <img src={src} alt={alt} className={className} />;
}
