"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function CertificateQR({ token }: { token: string }) {
  const [qr, setQr] = useState<string>("");
  const url = typeof window !== "undefined" ? `${window.location.origin}/verify/certificate/${token}` : `/verify/certificate/${token}`;

  useEffect(() => {
    QRCode.toDataURL(url, { width: 200, margin: 1 }).then(setQr);
  }, [url]);

  return (
    <div className="flex flex-col items-center gap-2">
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="QR Verify" className="w-40 h-40 border rounded" />
      ) : (
        <div className="w-40 h-40 border rounded bg-muted animate-pulse" />
      )}
      <p className="text-xs font-mono bg-muted px-1 py-0.5 rounded break-all max-w-40 text-center">{url}</p>
    </div>
  );
}
