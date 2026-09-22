import * as React from "react";

export function AnnouncementTemplate({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ fontFamily: "sans-serif", lineHeight: "1.5" }}>
      <h2>{title}</h2>
      <div>{body}</div>
      <p style={{ fontSize: "12px", color: "#666" }}>Anda menerima email ini karena pengumuman major per AGENTS.md §47.</p>
    </div>
  );
}
