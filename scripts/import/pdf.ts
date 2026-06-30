// PDF -> text extraction using pdfjs-dist (legacy build works in Node).
//
// We reconstruct line structure from text-item positions so the downstream
// label-anchored parser sees output similar to the Question Bank's linearized
// text. Math rendered as images won't appear here (that's expected and handled
// by the importer's NEEDS_REVIEW flagging); Unicode math text is preserved and
// later normalized by NFKC.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TextItem = { str: string; transform: number[]; hasEOL?: boolean };

export async function extractPdfText(data: Uint8Array): Promise<string> {
  // Dynamic import of the legacy ESM build (Node-friendly, no DOM canvas needed
  // for text extraction).
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data,
    // Disable worker for a simple synchronous Node run.
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const doc = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items as TextItem[];

    let lastY: number | null = null;
    let line = "";
    const lines: string[] = [];
    for (const item of items) {
      const y = item.transform?.[5] ?? 0;
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        // New line.
        lines.push(line.trim());
        line = "";
      }
      line += item.str;
      if (item.hasEOL) {
        lines.push(line.trim());
        line = "";
        lastY = null;
        continue;
      }
      lastY = y;
    }
    if (line.trim()) lines.push(line.trim());
    pages.push(lines.join("\n"));
  }

  await doc.cleanup();
  // Blank line between pages helps paragraph segmentation.
  return pages.join("\n\n");
}
