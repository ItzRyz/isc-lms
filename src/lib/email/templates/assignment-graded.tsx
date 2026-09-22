import * as React from "react";

export function AssignmentGradedTemplate({
  assignmentTitle,
  grade,
  feedback,
}: {
  assignmentTitle: string;
  grade: string;
  feedback?: string;
}) {
  return (
    <div style={{ fontFamily: "sans-serif", lineHeight: "1.5" }}>
      <h2>Assignment Graded: {assignmentTitle}</h2>
      <p>Assignment Anda telah dinilai.</p>
      <p>
        <strong>Nilai: {grade}</strong>
      </p>
      {feedback && <p>Feedback: {feedback}</p>}
    </div>
  );
}
