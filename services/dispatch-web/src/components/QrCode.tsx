import React, { useMemo } from "react";
import qrcode from "qrcode-generator";

// A QR code drawn as one SVG path (no image, no network). Dark modules on white with the standard
// four-module quiet zone, so any phone camera reads it. Error correction M: a smudge or glare still scans.
export const QrCode: React.FC<{ value: string; size?: number; label: string; className?: string }> = ({ value, size = 184, label, className = "" }) => {
  const { d, n } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    let path = "";
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) path += `M${c + 4} ${r + 4}h1v1h-1z`;
    return { d: path, n: count + 8 };
  }, [value]);
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${n} ${n}`} width={size} height={size} shapeRendering="crispEdges" className={`rounded-lg bg-white ${className}`}>
      <rect width={n} height={n} fill="#fff" />
      <path d={d} fill="#0b1018" />
    </svg>
  );
};
