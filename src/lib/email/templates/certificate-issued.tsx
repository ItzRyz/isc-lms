import * as React from "react";

export function CertificateIssuedTemplate({
  certificateNumber,
  verifyUrl,
  recipientName,
}: {
  certificateNumber: string;
  verifyUrl: string;
  recipientName?: string;
}) {
  return (
    <div style={{ fontFamily: "sans-serif", lineHeight: "1.5" }}>
      <h2>Certificate Issued</h2>
      <p>{recipientName ? `Halo ${recipientName},` : "Halo,"}</p>
      <p>
        Sertifikat Anda <strong>{certificateNumber}</strong> telah terbit.
      </p>
      <p>
        Verifikasi: <a href={verifyUrl}>{verifyUrl}</a>
      </p>
      <p style={{ fontSize: "12px", color: "#666" }}>QR pada sertifikat mengarah ke URL verifikasi di atas.</p>
    </div>
  );
}
