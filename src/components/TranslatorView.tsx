import { useState } from "react";
import { Loader2, CheckCircle2, Download } from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;
const simulateProcess = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Status = "idle" | "loading" | "success";

export default function TranslatorView() {
  const [status, setStatus] = useState<Status>("idle");

  const handleTranslate = async () => {
    setStatus("loading");
    await simulateProcess(3000);
    setStatus("success");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold text-foreground">Penerjemah Presisi</h3>
        <p className="text-muted-foreground text-sm">
          Terjemahkan dokumen dengan tata letak yang tetap terjaga (via DOCX conversion).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Bahasa Asal
          </label>
          <select className="w-full p-3 rounded-lg border border-input bg-muted text-sm text-foreground focus:ring-2 ring-ring outline-none transition-smooth">
            <option>Inggris (English)</option>
            <option>Jerman (Deutsch)</option>
            <option>Prancis (Français)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Bahasa Tujuan
          </label>
          <select className="w-full p-3 rounded-lg border border-input bg-muted text-sm text-foreground focus:ring-2 ring-ring outline-none transition-smooth">
            <option>Indonesia (Bahasa)</option>
            <option>Melayu (Malay)</option>
            <option>Jepang (日本語)</option>
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
            Sedang mengekstrak tata letak dan menerjemahkan...
          </p>
        </div>
      )}

      {status === "success" && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ease: EASE }}
          className="p-6 border border-success/20 bg-success/5 rounded-2xl flex flex-col items-center"
        >
          <CheckCircle2 className="text-success mb-3" size={40} />
          <p className="font-semibold text-foreground mb-4">Terjemahan Selesai!</p>
          <button className="flex items-center gap-2 px-8 py-3 bg-card border border-success/30 text-success rounded-xl font-medium hover:bg-success/10 transition-smooth">
            <Download size={18} />
            Unduh Hasil Terjemahan (PDF)
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
