// PDF -> PNG page images, for the vision importer.
//
// SAT Question Bank PDFs render equations, answer choices, and figures as images,
// so text extraction can't recover them. Rendering each page to a high-resolution
// PNG lets a vision model read the page exactly as a human would.
//
// Uses `pdf-to-png-converter` (pdfjs + @napi-rs/canvas under the hood — prebuilt
// binaries, installs cleanly on macOS/Linux without a compiler).

import { pdfToPng } from "pdf-to-png-converter";

export interface RenderedPage {
  pageNumber: number;
  png: Buffer;
  width: number;
  height: number;
}

export interface RenderOptions {
  /** 1-indexed page numbers to render. Omit for all pages. */
  pages?: number[];
  /** Higher = sharper (and larger). 2.0 is a good balance for small math text. */
  scale?: number;
}

export async function renderPdfToImages(
  pdfPath: string,
  opts: RenderOptions = {}
): Promise<RenderedPage[]> {
  const results = await pdfToPng(pdfPath, {
    viewportScale: opts.scale ?? 2.0,
    pagesToProcess: opts.pages, // undefined => all pages
    // No outputFolder => PNG bytes are returned in-memory (content is a Buffer).
  });

  return results.map((p) => ({
    pageNumber: p.pageNumber,
    png: p.content,
    width: p.width,
    height: p.height,
  }));
}
