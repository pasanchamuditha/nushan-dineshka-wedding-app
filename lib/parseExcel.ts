import * as XLSX from "xlsx";
import type { TableData } from "./seatingData";

export async function parseExcelFile(file: File): Promise<TableData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: (string | number | null)[][] = XLSX.utils.sheet_to_json(
          worksheet,
          { header: 1 }
        );

        const tables: TableData = {};
        let currentHeaders: (string | null)[] = [];

        const SKIP_VALUES = new Set([
          "hope",
          "photography",
          "",
          "null",
          "undefined",
        ]);

        for (const row of rows) {
          if (!row || row.length === 0) {
            currentHeaders = [];
            continue;
          }

          const hasTableHeaders = row.some(
            (c) => typeof c === "string" && c.toLowerCase().startsWith("table")
          );

          if (hasTableHeaders) {
            currentHeaders = row.map((c) =>
              c && typeof c === "string" && c.toLowerCase().startsWith("table")
                ? c.trim()
                : null
            );
            continue;
          }

          if (currentHeaders.length > 0) {
            for (let col = 0; col < currentHeaders.length; col++) {
              const header = currentHeaders[col];
              if (!header) continue;

              const tableName = header.replace(
                /^table(\d+)$/i,
                (_, n) => `Table ${n}`
              );
              const rawGuest = row[col];
              if (!rawGuest) continue;

              const guest = String(rawGuest).trim();
              if (SKIP_VALUES.has(guest.toLowerCase())) continue;
              if (guest.length < 2) continue;

              if (!tables[tableName]) tables[tableName] = [];
              // Normalize "Mr." format spacing
              const normalized = guest
                .replace(/^(Mr|Mrs|Ms|Dr)\.([A-Z])/i, "$1. $2")
                .replace(/\s+/g, " ")
                .trim();
              tables[tableName].push(normalized);
            }
          }
        }

        if (Object.keys(tables).length === 0) {
          reject(new Error("No table data found in the Excel file."));
        } else {
          resolve(tables);
        }
      } catch {
        reject(new Error("Failed to parse Excel file. Please check the format."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}
