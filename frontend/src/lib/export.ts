import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Entry } from "@/types";

const getEntryTypeLabel = (entryType: Entry["entry_type"]) =>
  entryType === "Credit" ? "Cash In" : "Cash Out";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const formatPdfCurrency = (value: number) =>
  `INR ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const exportEntriesToExcel = (entries: Entry[]) => {
  const rows = entries.map((entry) => ({
    Date: entry.date,
    Name: entry.entry_name,
    Category: entry.category,
    Type: getEntryTypeLabel(entry.entry_type),
    Method: entry.payment_method,
    Description: entry.description,
    Amount: entry.amount,
    User: entry.full_name || entry.email || "You",
  }));
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Entries");
  XLSX.writeFile(workbook, "food-book-entries.xlsx");
};

export const exportEntriesToPdf = (entries: Entry[]) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const reportTitle = "Cashbook Statement";
  const generatedAt = new Date();
  const generatedLabel = generatedAt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const totalCredit = entries.reduce(
    (sum, entry) => sum + (entry.entry_type === "Credit" ? Number(entry.amount) : 0),
    0
  );
  const totalDebit = entries.reduce(
    (sum, entry) => sum + (entry.entry_type === "Debit" ? Number(entry.amount) : 0),
    0
  );
  const balance = totalCredit - totalDebit;
  const totalEntries = entries.length;

  doc.setFillColor(7, 42, 57);
  doc.roundedRect(24, 24, pageWidth - 48, 118, 24, 24, "F");
  doc.setFillColor(58, 211, 177);
  doc.circle(44, 50, 5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("FOOD BOOK", 58, 54);
  doc.setFontSize(25);
  doc.text(reportTitle, 40, 86);
  doc.setFontSize(10);
  doc.setTextColor(196, 220, 255);
  doc.text("Professional export for entries, totals, and payment records", 40, 106);
  doc.text(`Generated on ${generatedLabel}`, 40, 124);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - 198, 42, 150, 74, 18, 18, "F");
  doc.setFillColor(8, 145, 209);
  doc.roundedRect(pageWidth - 184, 55, 38, 38, 10, 10, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.line(pageWidth - 176, 66, pageWidth - 154, 66);
  doc.line(pageWidth - 176, 74, pageWidth - 154, 74);
  doc.line(pageWidth - 176, 82, pageWidth - 154, 82);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text("FOOD BOOK", pageWidth - 140, 67);
  doc.setFontSize(14);
  doc.text("Cashbook", pageWidth - 140, 86);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(totalEntries === 1 ? "1 entry exported" : `${totalEntries} entries exported`, pageWidth - 140, 101);

  const cards = [
    {
      label: "Total Cash In",
      value: formatCurrency(totalCredit),
      pdfValue: formatPdfCurrency(totalCredit),
      fill: [236, 253, 245],
      text: [6, 95, 70],
      accent: [16, 185, 129],
    },
    {
      label: "Total Cash Out",
      value: formatCurrency(totalDebit),
      pdfValue: formatPdfCurrency(totalDebit),
      fill: [255, 241, 242],
      text: [159, 18, 57],
      accent: [244, 63, 94],
    },
    {
      label: "Balance",
      value: formatCurrency(balance),
      pdfValue: formatPdfCurrency(balance),
      fill: [239, 246, 255],
      text: [30, 64, 175],
      accent: [37, 99, 235],
    },
  ] as const;

  cards.forEach((card, index) => {
    const gap = 12;
    const width = (pageWidth - 48 - gap * 2) / 3;
    const x = 24 + index * (width + gap);
    doc.setFillColor(card.fill[0], card.fill[1], card.fill[2]);
    doc.roundedRect(x, 160, width, 72, 18, 18, "F");
    doc.setFillColor(card.accent[0], card.accent[1], card.accent[2]);
    doc.roundedRect(x + 14, 174, 5, 43, 4, 4, "F");
    doc.setTextColor(card.text[0], card.text[1], card.text[2]);
    doc.setFontSize(9);
    doc.text(card.label.toUpperCase(), x + 30, 184);
    doc.setFontSize(16);
    doc.text(card.pdfValue, x + 30, 210);
  });

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(24, 250, pageWidth - 48, pageHeight - 306, 22, 22, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text("Entry Breakdown", 40, 278);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Date, remark, entry by, mode, and signed amounts", 40, 294);

  if (!entries.length) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(40, 320, pageWidth - 80, 132, 18, 18, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text("No entries available", 56, 366);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("Add cash in or cash out records in Food Book, then export again.", 56, 392);
  } else {
    autoTable(doc, {
      startY: 314,
      head: [["Date", "Remark", "Type", "Mode", "Amount", "Entry by"]],
      body: entries.map((entry) => [
        new Date(entry.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        entry.description || entry.entry_name || "No remark",
        getEntryTypeLabel(entry.entry_type),
        entry.payment_method,
        `${entry.entry_type === "Credit" ? "+" : "-"} ${formatPdfCurrency(Number(entry.amount))}`,
        entry.full_name || entry.email || "You",
      ]),
      margin: { left: 40, right: 40 },
      tableWidth: pageWidth - 80,
      theme: "grid",
      headStyles: {
        fillColor: [7, 42, 57],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
        lineColor: [7, 42, 57],
        cellPadding: { top: 9, right: 8, bottom: 9, left: 8 },
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85],
        cellPadding: { top: 9, right: 8, bottom: 9, left: 8 },
        lineColor: [226, 232, 240],
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 72 },
        1: { cellWidth: 180 },
        2: { cellWidth: 56, halign: "center" },
        3: { cellWidth: 56, halign: "center" },
        4: { cellWidth: 82, halign: "right" },
        5: { cellWidth: "auto" },
      },
      didParseCell: (hookData) => {
        if (hookData.section === "body" && hookData.column.index === 2) {
          const isCredit = hookData.cell.raw === "Cash In";
          hookData.cell.styles.fillColor = isCredit ? [236, 253, 245] : [255, 241, 242];
          hookData.cell.styles.textColor = isCredit ? [6, 95, 70] : [159, 18, 57];
          hookData.cell.styles.fontStyle = "bold";
        }

        if (hookData.section === "body" && hookData.column.index === 3) {
          hookData.cell.styles.fillColor = [241, 245, 249];
          hookData.cell.styles.textColor = [15, 23, 42];
        }

        if (hookData.section === "body" && hookData.column.index === 4) {
          const raw = String(hookData.cell.raw || "");
          const isCredit = raw.trim().startsWith("+");
          hookData.cell.styles.textColor = isCredit ? [5, 150, 105] : [225, 29, 72];
          hookData.cell.styles.fontStyle = "bold";
        }
      },
      didDrawPage: (hookData) => {
        doc.setDrawColor(226, 232, 240);
        doc.line(24, pageHeight - 34, pageWidth - 24, pageHeight - 34);
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("Food Book  |  Clean cashbook export", 24, pageHeight - 18);
        doc.text(
          `Page ${hookData.pageNumber}`,
          pageWidth - 64,
          pageHeight - 18
        );
      },
    });
  }

  const fileStamp = generatedAt.toISOString().slice(0, 10);
  doc.save(`food-book-report-${fileStamp}.pdf`);
};
