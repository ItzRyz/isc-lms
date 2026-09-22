import * as React from "react";

export function GradePublishedTemplate({ period }: { period: string }) {
  return (
    <div style={{ fontFamily: "sans-serif", lineHeight: "1.5" }}>
      <h2>Grade Published: {period}</h2>
      <p>Nilai periode <strong>{period}</strong> telah dipublikasikan. Silakan cek halaman Grades.</p>
    </div>
  );
}
