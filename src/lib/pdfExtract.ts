import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface PDFBlock {
  text: string;
  fontSize: number;
  isBold: boolean;
  alignment: "left" | "center" | "right";
  pageBreakBefore: boolean;
  isListItem: boolean;
}

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  fontName: string;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const { blocks } = await extractStructuredPDF(file);
  return blocks.map((b) => b.text).join("\n\n");
}

export async function extractStructuredPDF(file: File): Promise<{ text: string; blocks: PDFBlock[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allBlocks: PDFBlock[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const pageWidth = viewport.width;

    const items = content.items as TextItem[];
    if (items.length === 0) continue;

    // Group items into lines by Y position (items within 3pt are same line)
    const lines: { items: TextItem[]; y: number }[] = [];
    for (const item of items) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const existing = lines.find((l) => Math.abs(l.y - y) < 3);
      if (existing) {
        existing.items.push(item);
      } else {
        lines.push({ items: [item], y });
      }
    }

    // Sort lines top-to-bottom (higher Y = top of page in PDF coords)
    lines.sort((a, b) => b.y - a.y);

    // Sort items within each line left-to-right
    for (const line of lines) {
      line.items.sort((a, b) => a.transform[4] - b.transform[4]);
    }

    // Group consecutive lines into paragraphs based on spacing
    const paragraphs: { lines: typeof lines; }[] = [];
    let currentParagraph: typeof lines = [];

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      if (currentParagraph.length === 0) {
        currentParagraph.push(line);
        continue;
      }

      const prevLine = currentParagraph[currentParagraph.length - 1];
      const gap = prevLine.y - line.y;
      const avgFontSize = line.items.reduce((s, it) => s + Math.abs(it.transform[0]), 0) / line.items.length;
      const lineHeight = avgFontSize * 1.8;

      // If gap is much larger than line height, it's a new paragraph
      if (gap > lineHeight) {
        paragraphs.push({ lines: currentParagraph });
        currentParagraph = [line];
      } else {
        currentParagraph.push(line);
      }
    }
    if (currentParagraph.length > 0) {
      paragraphs.push({ lines: currentParagraph });
    }

    // Convert paragraphs to blocks
    for (const para of paragraphs) {
      const allItems = para.lines.flatMap((l) => l.items);
      const text = para.lines
        .map((l) => l.items.map((it) => it.str).join(" "))
        .join(" ");

      if (!text.trim()) continue;

      // Determine font size (most common)
      const fontSizes = allItems.map((it) => Math.abs(it.transform[0]));
      const avgFontSize = fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length;

      // Detect bold from font name
      const isBold = allItems.some(
        (it) => /bold|black|heavy/i.test(it.fontName)
      );

      // Detect alignment by analyzing X positions
      const lineXStarts = para.lines.map((l) => l.items[0].transform[4]);
      const lineXEnds = para.lines.map((l) => {
        const last = l.items[l.items.length - 1];
        return last.transform[4] + last.width;
      });
      const avgStart = lineXStarts.reduce((a, b) => a + b, 0) / lineXStarts.length;
      const avgEnd = lineXEnds.reduce((a, b) => a + b, 0) / lineXEnds.length;
      const leftMargin = avgStart;
      const rightMargin = pageWidth - avgEnd;

      let alignment: "left" | "center" | "right" = "left";
      if (Math.abs(leftMargin - rightMargin) < pageWidth * 0.1 && leftMargin > pageWidth * 0.1) {
        alignment = "center";
      } else if (rightMargin < leftMargin * 0.5 && rightMargin < 50) {
        alignment = "right";
      }

      // Detect list items
      const isListItem = /^[\u2022\u2023\u25E6\u2043\-•●◦▪]\s/.test(text.trim()) ||
        /^\d+[\.\)]\s/.test(text.trim()) ||
        /^[a-z][\.\)]\s/i.test(text.trim());

      allBlocks.push({
        text: text.trim(),
        fontSize: Math.round(avgFontSize * 10) / 10,
        isBold,
        alignment,
        pageBreakBefore: i > 1 && paragraphs.indexOf(para) === 0 && allBlocks.length > 0,
        isListItem,
      });
    }
  }

  const fullText = allBlocks.map((b) => b.text).join("\n\n");
  return { text: fullText, blocks: allBlocks };
}
