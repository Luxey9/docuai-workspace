import { Upload } from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

interface UploadZoneProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UploadZone({ onUpload }: UploadZoneProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="border-2 border-dashed border-border rounded-3xl p-12 md:p-16 flex flex-col items-center justify-center bg-card hover:border-primary transition-smooth group cursor-pointer relative"
    >
      <input
        type="file"
        accept=".pdf"
        onChange={onUpload}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <div className="w-16 h-16 bg-sidebar-accent text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-smooth">
        <Upload size={32} />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-foreground">
        Unggah Dokumen PDF Anda di sini
      </h2>
      <p className="text-muted-foreground text-center max-w-sm text-sm">
        Tarik dan lepas file Anda, atau klik untuk memilih file dari komputer
        Anda.
      </p>
    </motion.div>
  );
}
