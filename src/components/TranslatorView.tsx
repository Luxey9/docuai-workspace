import { useState, forwardRef } from "react";
import { Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  LevelFormat, PageBreak,
} from "docx";
import { saveAs } from "file-saver";
import type { PDFBlock } from "@/lib/pdfExtract";

const EASE = [0.16, 1, 0.3, 1] as const;

type Status = "idle" | "loading" | "success";

interface TranslatorViewProps {
  documentText?: string;
  fileName?: string;
  pdfBlocks?: PDFBlock[];
}

const ALIGNMENT_MAP = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
};

function pdfFontSizeToDocx(pdfSize: number): number {
  // pdfjs font size is roughly in points; docx uses half-points
  return Math.round(pdfSize * 2);
}

const TranslatorView = forwardRef<HTMLDivElement, TranslatorViewProps>(
  ({ documentText, fileName, pdfBlocks }, ref) => {
    const [status, setStatus] = useState<Status>("idle");
    const [sourceLang, setSourceLang] = useState("en");
    const [targetLang, setTargetLang] = useState("id");
    const [translatedText, setTranslatedText] = useState("");

    const handleTranslate = async () => {
      if (!documentText || documentText.startsWith("[")) {
        toast.error("Teks dokumen belum tersedia. Pastikan PDF berhasil diekstrak.");
        return;
      }

      setStatus("loading");

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data, error } = await supabase.functions.invoke("translate", {
          body: {
            text: documentText.slice(0, 15000),
            sourceLang,
            targetLang,
          },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        setTranslatedText(data.translatedText || "");
        setStatus("success");
      } catch (e) {
        console.error("Translate error:", e);
        toast.error(e instanceof Error ? e.message : "Gagal menerjemahkan");
        setStatus("idle");
      }
    };

    const handleDownload = async () => {
      if (!translatedText) {
        toast.error("Tidak ada hasil terjemahan untuk diunduh.");
        return;
      }

      try {
        const baseName = fileName ? fileName.replace(/\.pdf$/i, "") : "dokumen";
        const translatedParagraphs = translatedText.split(/\n{2,}/).filter((p) => p.trim());

        const children: Paragraph[] = [];
        const hasBlocks = pdfBlocks && pdfBlocks.length > 0;

        // Build numbering config for list items
        const numberingConfig = {
          config: [
            {
              reference: "bullets",
              levels: [{
                level: 0,
                format: LevelFormat.BULLET,
                text: "\u2022",
                alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 720, hanging: 360 } } },
              }],
            },
            {
              reference: "numbers",
              levels: [{
                level: 0,
                format: LevelFormat.DECIMAL,
                text: "%1.",
                alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 720, hanging: 360 } } },
              }],
            },
          ],
        };

        for (let i = 0; i < translatedParagraphs.length; i++) {
          const text = translatedParagraphs[i].replace(/\n/g, " ").trim();
          if (!text) continue;

          // Match with original block for styling
          const block = hasBlocks && i < pdfBlocks.length ? pdfBlocks[i] : null;

          if (block) {
            const docxSize = pdfFontSizeToDocx(block.fontSize);
            const alignment = ALIGNMENT_MAP[block.alignment] || AlignmentType.LEFT;

            // Page break
            if (block.pageBreakBefore && children.length > 0) {
              children.push(new Paragraph({ children: [new PageBreak()] }));
            }

            // List item
            if (block.isListItem) {
              // Strip bullet/number prefix from translated text
              const cleanText = text.replace(/^[\u2022\u2023\u25E6\u2043\-•●◦▪]\s*/, "")
                .replace(/^\d+[\.\)]\s*/, "")
                .replace(/^[a-z][\.\)]\s*/i, "");

              const isNumbered = /^\d+[\.\)]/.test(block.text.trim());

              children.push(new Paragraph({
                numbering: { reference: isNumbered ? "numbers" : "bullets", level: 0 },
                children: [new TextRun({
                  text: cleanText,
                  size: docxSize,
                  bold: block.isBold,
                  font: "Arial",
                })],
                spacing: { after: 80, line: Math.round(docxSize * 14) },
              }));
            } else {
              // Determine spacing based on font size (larger = more spacing)
              const isHeading = block.fontSize > 13 || block.isBold;
              const spacingAfter = isHeading ? 240 : 160;
              const spacingBefore = isHeading && i > 0 ? 300 : 0;

              children.push(new Paragraph({
                children: [new TextRun({
                  text,
                  size: docxSize,
                  bold: block.isBold,
                  font: "Arial",
                })],
                alignment,
                spacing: {
                  before: spacingBefore,
                  after: spacingAfter,
                  line: Math.round(docxSize * 14),
                },
              }));
            }
          } else {
            // Fallback: no block info, use sensible defaults
            children.push(new Paragraph({
              children: [new TextRun({ text, size: 24, font: "Arial" })],
              spacing: { after: 200, line: 360 },
              alignment: AlignmentType.LEFT,
            }));
          }
        }

        const doc = new Document({
          numbering: numberingConfig,
          sections: [{
            properties: {
              page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
              },
            },
            children,
          }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${baseName}_terjemahan.docx`);
        toast.success("File DOCX terjemahan berhasil diunduh!");
      } catch (err) {
        console.error("DOCX generation error:", err);
        toast.error("Gagal membuat file DOCX.");
      }
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="space-y-6"
      >
        <div>
          <h3 className="text-lg font-semibold text-foreground">Penerjemah Presisi</h3>
          <p className="text-muted-foreground text-sm">
            Terjemahkan dokumen Anda ke bahasa lain dengan tata letak sesuai aslinya.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Bahasa Asal
            </label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full p-3 rounded-lg border border-input bg-muted text-sm text-foreground focus:ring-2 ring-ring outline-none transition-smooth"
            >
              <option value="en">Inggris (English)</option>
              <option value="de">Jerman (Deutsch)</option>
              <option value="fr">Prancis (Français)</option>
              <option value="id">Indonesia (Bahasa)</option>
              <option value="ja">Jepang (日本語)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Bahasa Tujuan
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full p-3 rounded-lg border border-input bg-muted text-sm text-foreground focus:ring-2 ring-ring outline-none transition-smooth"
            >
              <option value="id">Indonesia (Bahasa)</option>
              <option value="en">Inggris (English)</option>
              <option value="ms">Melayu (Malay)</option>
              <option value="ja">Jepang (日本語)</option>
            </select>
          </div>
        </div>

        {status === "idle" && (
          <button
            onClick={handleTranslate}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-smooth flex items-center justify-center gap-2"
          >
            Terjemahkan Dokumen
          </button>
        )}

        {status === "loading" && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-muted-foreground font-medium">
              Sedang menerjemahkan dokumen...
            </p>
          </div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ease: EASE }}
            className="space-y-4"
          >
            <div className="p-4 border border-border bg-muted rounded-xl max-h-60 overflow-y-auto">
              <p className="text-sm text-foreground whitespace-pre-wrap">{translatedText}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-smooth"
              >
                <FileText size={18} />
                Unduh DOCX
              </button>
              <button
                onClick={() => { setStatus("idle"); setTranslatedText(""); }}
                className="px-6 py-3 bg-muted border border-border text-foreground rounded-xl font-medium hover:bg-accent transition-smooth"
              >
                Terjemahkan Ulang
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }
);
TranslatorView.displayName = "TranslatorView";

export default TranslatorView;
