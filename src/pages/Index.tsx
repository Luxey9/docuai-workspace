import { useState, useCallback } from "react";
import { LayoutDashboard, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { extractTextFromPDF } from "@/lib/pdfExtract";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import UploadZone from "@/components/UploadZone";
import FileHeader from "@/components/FileHeader";
import FeatureTabs from "@/components/FeatureTabs";
import TranslatorView from "@/components/TranslatorView";
import SummaryView from "@/components/SummaryView";
import ChatView from "@/components/ChatView";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState<string>("");
  const [activeTab, setActiveTab] = useState("translate");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [extracting, setExtracting] = useState(false);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      setExtracting(true);
      
      try {
        const text = await extractTextFromPDF(uploadedFile);
        if (!text.trim()) {
          toast.warning("PDF tidak mengandung teks yang bisa diekstrak (mungkin berupa gambar/scan).");
          setDocumentText("[Dokumen PDF tidak mengandung teks yang bisa diekstrak]");
        } else {
          setDocumentText(text);
          toast.success("Teks berhasil diekstrak dari PDF!");
        }
      } catch (err) {
        console.error("PDF extraction error:", err);
        toast.error("Gagal mengekstrak teks dari PDF.");
        setDocumentText("[Gagal mengekstrak teks dari PDF]");
      } finally {
        setExtracting(false);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <AppSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Mobile header */}
      <header className="lg:hidden h-14 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 px-4 flex items-center gap-3">
        <button onClick={() => setMobileMenuOpen(true)} className="text-muted-foreground hover:text-foreground transition-smooth">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            <LayoutDashboard size={14} />
          </div>
          <span className="font-bold text-sm tracking-tight">DocuAI</span>
        </div>
      </header>

      <main className="lg:pl-64 min-h-screen">
        <header className="hidden lg:flex h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10 px-8 items-center justify-between">
          <h1 className="font-semibold text-muted-foreground">Workspace Dokumen</h1>
          <div className="w-8 h-8 rounded-full bg-muted border border-border" />
        </header>

        <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 md:px-6">
          {!file ? (
            <UploadZone onUpload={handleFileUpload} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <FileHeader fileName={file.name} onReset={() => { setFile(null); setDocumentText(""); setActiveTab("translate"); }} />

              <div className="mt-8">
                <FeatureTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="mt-6 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm min-h-[400px]">
                  <AnimatePresence mode="wait">
                    {activeTab === "translate" && <TranslatorView key="t" />}
                    {activeTab === "summary" && <SummaryView key="s" documentText={documentText} />}
                    {activeTab === "chat" && <ChatView key="c" documentText={documentText} />}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
