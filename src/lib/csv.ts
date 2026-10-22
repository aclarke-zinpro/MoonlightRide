type Cell = string | number | boolean | Date | null | undefined;

const FORMULA_START = /^[=+\-@\t\r]/;

function formatCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  // Spreadsheet apps run cells that start with these characters as formulas.
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Builds an RFC 4180 CSV document with a UTF-8 BOM so Excel reads accents correctly. */
export function toCsv(headers: string[], rows: Cell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(formatCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}
