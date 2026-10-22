import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("CSV builder (foundation)", () => {
  it("starts with a UTF-8 BOM and uses CRLF line endings", () => {
    const csv = toCsv(["Name", "Count"], [["Ada", 2]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe("﻿Name,Count\r\nAda,2\r\n");
  });

  it("quotes cells with commas, quotes, and line breaks (RFC 4180)", () => {
    const csv = toCsv(["A"], [['Say "hi", then\nleave']]);
    expect(csv).toBe('﻿A\r\n"Say ""hi"", then\nleave"\r\n');
  });

  it("guards against formula injection", () => {
    const csv = toCsv(["A", "B", "C", "D"], [["=SUM(A1)", "+1", "-2", "@cmd"]]);
    expect(csv).toContain("'=SUM(A1),'+1,'-2,'@cmd");
  });

  it("writes empty cells for null and undefined", () => {
    expect(toCsv(["A", "B"], [[null, undefined]])).toBe("﻿A,B\r\n,\r\n");
  });
});
