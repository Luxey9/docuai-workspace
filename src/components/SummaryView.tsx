import { useState, forwardRef } from "react";
import { ChevronRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const EASE = [0.16, 1, 0.3, 1] as const;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

type Status = "idle" | "loading" | "success" | "error";

interface SummaryViewProps {
  documentText?: string;
}

const SummaryView = forwardRef<HTMLDivElement, SummaryViewProps>(({ documentText }, ref) => {
  const [status, setStatus] = useState<Status>("idle");
  const [points, setPoints] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [retryInfo, setRetryInfo] = useState("");

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleSummarize = async () => {
    setStatus("loading");
    setErrorMsg("");
    setRetryInfo("");

    const textToSummarize = documentText || "Dokumen ini belum memiliki teks yang diekstrak.";
    
    // Truncate to ~15000 chars to avoid token limits
    const truncated = textToSummarize.slice(0, 15000);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke("summarize", {
          body: { text: truncated },
        });

        if (error) {
          // Check if it's a 429 from the response
          if (error.message?.includes("non-2xx") && attempt < MAX_RETRIES) {
            setRetryInfo(`Rate limit tercapai. Mencoba ulang (${attempt}/${MAX_RETRIES})...`);
            await delay(RETRY_DELAY * attempt);
            continue;
          }
          throw new Error(error.message || "Gagal meringkas dokumen");
        }

        if (data?.error) {
          if (data.error.includes("Rate limit") && attempt < MAX_RETRIES) {
            setRetryInfo(`Rate limit tercapai. Mencoba ulang (${attempt}/${MAX_RETRIES})...`);
            await delay(RETRY_DELAY * attempt);
            continue;
          }
          throw new Error(data.error);
        }

        setPoints(data.points || []);
        setStatus("success");
        setRetryInfo("");
        return;
      } catch (e) {
        if (attempt === MAX_RETRIES) {
          console.error("Summarize error:", e);
          setErrorMsg(e instanceof Error ? e.message : "Terjadi kesalahan");
          setStatus("error");
        }
      }
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
        <h3 className="text-lg font-semibold text-foreground">Ringkasan AI</h3>
        <p className="text-muted-foreground text-sm">
          Dapatkan poin-poin penting dari dokumen Anda secara instan.
        </p>
      </div>

      {(status === "idle" || status === "error") && (
        <>
          {status === "error" && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{errorMsg}</p>
            </div>
          )}
          <button
            onClick={handleSummarize}
            className="w-full py-4 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-smooth"
          >
            {status === "error" ? "Coba Lagi" : "Buat Ringkasan"}
          </button>
        </>
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
            {points.map((point, i) => (
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
