import { useState, useRef } from "react";
import { useFile } from "../context/FileContext";
import { UploadCloud } from "lucide-react";
import * as XLSX from "xlsx";

export default function UploadZone({ onUpload }: { onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const { setFileData } = useFile();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    const type = file.type;
    const name = file.name.toLowerCase();

    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls') || type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const isText = name.endsWith('.txt') || name.endsWith('.csv') || type.startsWith('text/');
    
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        // Save as CSV text
        setFileData(file, csv, null, "text/csv");
      };
      reader.readAsArrayBuffer(file);
    } else if (isText) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileData(file, e.target?.result as string, null, type || "text/plain");
      };
      reader.readAsText(file);
    } else {
      // Images, PDF, audio, video go standard base64 for Gemini InlineData
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Result is data:mime/type;base64,.....
        const base64 = result.split(',')[1];
        setFileData(file, null, base64, type || "application/octet-stream");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
      if (onUpload) onUpload(e);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
      }`}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleChange} 
        accept=".pdf,.txt,.csv,.xlsx,.xls,image/*"
      />
      <div className="w-16 h-16 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-4">
        <UploadCloud size={32} />
      </div>
      <h3 className="text-xl font-bold mb-2">Unggah Dokumen atau Data</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Tarik & lepas file Anda di sini. Mendukung PDF, TXT, CSV, Excel, dan Gambar resolusi tinggi.
      </p>
      <button className="px-6 py-2.5 bg-foreground text-background font-medium rounded-full hover:opacity-90 transition-smooth">
        Pilih File
      </button>
    </div>
  );
}