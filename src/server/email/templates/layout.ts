export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain text from the simple Markdown used in ride text (bold markers and list dashes). */
export function markdownToText(markdown: string): string {
  return markdown.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^\s*-\s+/gm, "• ").trim();
}

/** Minimal Markdown to HTML for emails: paragraphs, bullet lists, and bold. Input is escaped. */
export function markdownToEmailHtml(markdown: string): string {
  const blocks = markdown.trim().split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n");
      const bold = (s: string) => escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      if (lines.every((l) => /^\s*-\s+/.test(l))) {
        return `<ul style="padding-left:20px;margin:12px 0">${lines
          .map((l) => `<li style="margin:6px 0">${bold(l.replace(/^\s*-\s+/, ""))}</li>`)
          .join("")}</ul>`;
      }
      return `<p style="margin:12px 0">${bold(lines.join(" "))}</p>`;
    })
    .join("");
}

export function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="background:#d9772b;color:#0d0f12;padding:12px 20px;border-radius:6px;font-weight:bold;text-decoration:none;display:inline-block">${escapeHtml(label)}</a></p>`;
}

/** Wraps email body HTML in the site's dark and orange style, with live text (no images). */
export function emailLayout(title: string, bodyHtml: string, footerHtml = ""): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#0d0f12;color:#ece8e1;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
<div style="max-width:600px;margin:0 auto;padding:24px">
<p style="margin:0 0 4px;color:#d9772b;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:bold;text-align:center">Moonlight Ride</p>
<hr style="border:none;border-top:2px solid #d9772b;margin:8px 0 24px">
<h1 style="color:#d9772b;font-family:Georgia,'Times New Roman',serif;font-size:24px;margin:0 0 12px">${escapeHtml(title)}</h1>
${bodyHtml}
<hr style="border:none;border-top:1px solid #2e333b;margin:32px 0 12px">
<div style="color:#a9a39a;font-size:13px">${footerHtml}</div>
</div>
</body>
</html>`;
}
