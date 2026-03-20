import { useState, forwardRef } from "react";
import { Loader2, CheckCircle2, Download, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

const EASE = [0.16, 1, 0.3, 1] as const;

type Status = "idle" | "loading" | "success";

interface TranslatorViewProps {
  documentText?: string;
  fileName?: string;
}

const TranslatorView = forwardRef<HTMLDivElement, TranslatorViewProps>(
  ({ documentText, fileName }, ref) => {
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

    const handleDownload = () => {
      if (!translatedText) {
        toast.error("Tidak ada hasil terjemahan untuk diunduh.");
        return;
      }

      const blob = new Blob([translatedText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const baseName = fileName ? fileName.replace(/\.pdf$/i, "") : "dokumen";
      a.download = `${baseName}_terjemahan.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("File terjemahan berhasil diunduh!");
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
            Terjemahkan dokumen Anda ke bahasa lain menggunakan AI.
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
                <Download size={18} />
                Unduh Hasil Terjemahan
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
