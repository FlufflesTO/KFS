/**
 * Project Sentinel - CSV Processing Utilities
 * Purpose: Provides type-safe CSV generation and parsing, including Excel injection protection
 * Dependencies: None
 * Structural Role: CSV utility layer
 */

export function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `\t${text}` : text;
  if (/[",\r\n\t]/.test(safe)) return `"${safe.replaceAll('"', '""')}"`;
  return safe;
}

export function rowsToCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\r\n");
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char || "";
    }
  }

  row.push(field);
  rows.push(row);
  return rows.filter((item) => item.some((fieldValue) => String(fieldValue || "").trim()));
}

export interface CsvObjectResult {
  rowNumber: number;
  data: Record<string, string>;
}

export function csvObjects(text: string | null | undefined, expectedHeaders: string[]): CsvObjectResult[] {
  const rows = parseCsv(String(text || ""));
  if (rows.length < 2) throw new Error("CSV must include a header row and at least one data row.");

  const headers = (rows[0] || []).map((header) => String(header || "").trim());
  if (headers.length !== expectedHeaders.length || expectedHeaders.some((header, index) => headers[index] !== header)) {
    throw new Error(`CSV header must be exactly: ${expectedHeaders.join(",")}`);
  }

  return rows.slice(1).map((row, rowIndex) => ({
    rowNumber: rowIndex + 2,
    data: Object.fromEntries(expectedHeaders.map((header, index) => [header, String(row[index] || "").trim()]))
  }));
}
