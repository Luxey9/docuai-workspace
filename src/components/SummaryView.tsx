import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;
const simulateProcess = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Status = "idle" | "loading" | "success";

const summaryPoints = [
  "Dokumen ini membahas tentang implementasi kecerdasan buatan dalam alur kerja digital modern.",
  "Fokus utama adalah pada efisiensi pemrosesan dokumen PDF tanpa merusak struktur visual.",
  "Metodologi yang digunakan mencakup OCR (Optical Character Recognition) tingkat lanjut.",
  "Kesimpulan menyarankan integrasi API untuk skalabilitas bisnis yang lebih baik.",
];

export default function SummaryView() {
  const [status, setStatus] = useState<Status>("idle");

  const handleSummarize = async () => {
    setStatus("loading");
    await simulateProcess(2500);
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
        <h3 className="text-lg font-semibold text-foreground">Ringkasan AI</h3>
        <p className="text-muted-foreground text-sm">
          Dapatkan poin-poin penting dari dokumen Anda secara instan.
        </p>
      </div>

      {status === "idle" && (
        <button
          onClick={handleSummarize}
          className="w-full py-4 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-smooth"
        >
          Buat Ringkasan
        </button>
      )}

      {status === "loading" && (
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded-full w-3/4 animate-pulse" />
          <div className="h-4 bg-muted rounded-full w-full animate-pulse" />
          <div className="h-4 bg-muted rounded-full w-2/3 animate-pulse" />
          <div className="h-4 bg-muted rounded-full w-5/6 animate-pulse" />
          <p className="text-center text-muted-foreground text-sm mt-4">
            Sedang membaca keseluruhan dokumen...
          </p>
        </div>
      )}

      {status === "success" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: EASE }}
          className="p-6 bg-muted rounded-2xl border border-border"
        >
          <ul className="space-y-3 text-foreground">
            {summaryPoints.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <ChevronRight
                  size={18}
                  className="text-primary shrink-0 mt-0.5"
                />
                {point}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}
