export function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function rowsToCsv(headers, rows) {
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\r\n");
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
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
      field += char;
    }
  }

  row.push(field);
  rows.push(row);
  return rows.filter((item) => item.some((fieldValue) => String(fieldValue || "").trim()));
}

export function csvObjects(text, expectedHeaders) {
  const rows = parseCsv(String(text || ""));
  if (rows.length < 2) throw new Error("CSV must include a header row and at least one data row.");

  const headers = rows[0].map((header) => String(header || "").trim());
  if (headers.length !== expectedHeaders.length || expectedHeaders.some((header, index) => headers[index] !== header)) {
    throw new Error(`CSV header must be exactly: ${expectedHeaders.join(",")}`);
  }

  return rows.slice(1).map((row, rowIndex) => ({
    rowNumber: rowIndex + 2,
    data: Object.fromEntries(expectedHeaders.map((header, index) => [header, String(row[index] || "").trim()]))
  }));
}
