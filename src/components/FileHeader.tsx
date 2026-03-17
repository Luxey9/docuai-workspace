import { FileText } from "lucide-react";

interface FileHeaderProps {
  fileName: string;
  onReset: () => void;
}

export default function FileHeader({ fileName, onReset }: FileHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-destructive/10 text-destructive rounded-lg">
          <FileText size={24} />
        </div>
        <div>
          <p className="font-medium text-foreground">{fileName}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Dokumen PDF
          </p>
        </div>
      </div>
      <button
        onClick={onReset}
        className="text-sm text-muted-foreground hover:text-destructive transition-smooth"
      >
        Ganti File
      </button>
    </div>
  );
}
