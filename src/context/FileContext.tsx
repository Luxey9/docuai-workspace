import React, { createContext, useContext, useState, ReactNode } from "react";

interface FileContextType {
  file: File | null;
  extractedText: string | null;   // for Text, CSV, parsed Excel
  base64Data: string | null;      // for PDF, Image directly sent to Gemini
  mimeType: string | null;        // Mime Type for Gemini inlineData
  setFileData: (file: File | null, text: string | null, base64: string | null, mime: string | null) => void;
  resetFile: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  const setFileData = (
    file: File | null, 
    text: string | null, 
    base64: string | null, 
    mime: string | null
  ) => {
    setFile(file);
    setExtractedText(text);
    setBase64Data(base64);
    setMimeType(mime);
  };

  const resetFile = () => {
    setFile(null);
    setExtractedText(null);
    setBase64Data(null);
    setMimeType(null);
  };

  return (
    <FileContext.Provider value={{ file, extractedText, base64Data, mimeType, setFileData, resetFile }}>
      {children}
    </FileContext.Provider>
  );
}

export const useFile = () => {
  const context = useContext(FileContext);
  if (!context) throw new Error("useFile must be used within a FileProvider");
  return context;
};