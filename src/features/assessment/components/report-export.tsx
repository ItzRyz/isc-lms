"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";

type Report = {
  student: { full_name: string; email: string; division: string; period: string };
  grades: Array<{ component: string; score: number; max_score: number; weight: number; final_score: number; grade: string }>;
  total: number;
  grade: string;
};

export function ReportExport({ report }: { report: Report }) {
  const handlePDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Report Card — ISC LMS", 14, 20);
    doc.setFontSize(10);
    doc.text(`Student: ${report.student.full_name} (${report.student.email})`, 14, 30);
    doc.text(`Division: ${report.student.division} • Period: ${report.student.period}`, 14, 36);
    doc.text(`Final: ${report.total} (${report.grade})`, 14, 42);
    let y = 50;
    doc.text("Component | Score | Weight | Weighted | Grade", 14, y);
    y += 6;
    for (const g of report.grades) {
      doc.text(`${g.component} | ${g.score}/${g.max_score} | ${g.weight}% | ${g.final_score} | ${g.grade}`, 14, y);
      y += 6;
    }
    doc.save(`report-${report.student.email}-${Date.now()}.pdf`);
  };

  const handleCSV = () => {
    const header = "Component,Score,Max,Weight,Weighted,Grade";
    const rows = report.grades.map((g) => `${g.component},${g.score},${g.max_score},${g.weight},${g.final_score},${g.grade}`).join("\n");
    const footer = `Final,${report.total},,,,${report.grade}`;
    const csv = [header, rows, footer].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${report.student.email}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handlePDF}>
        <Download className="mr-1 h-3 w-3" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handleCSV}>
        <FileSpreadsheet className="mr-1 h-3 w-3" /> CSV
      </Button>
    </div>
  );
}
