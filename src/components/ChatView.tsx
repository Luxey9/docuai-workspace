import { useState } from "react";
import { Send, Loader2, Sparkles, FileText, BarChart3 } from "lucide-react";
import { useFile } from "../context/FileContext";

interface Message {
  role: "ai" | "user";
  text: string;
}

export default function ChatView() {
  const { extractedText, base64Data, mimeType } = useFile();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Halo! Saya adalah AI Assistant. Anda bisa bertanya tentang dokumen yang Anda unggah, meminta ringkasan, atau analisis data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const askGemini = async (userText: string) => {
    try {
      const apiKey = import.meta.env.VITE_AI_API_KEY;
      const model = import.meta.env.VITE_AI_MODEL || "gemini-2.5-flash";
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      let documentParts: Record<string, unknown>[] = [];
      if (extractedText) {
        documentParts = [{ text: `\n\n--- DOKUMEN REFERENSI ---\n${extractedText.substring(0, 150000)}\n--- AKHIR DOKUMEN ---\n` }];
      } else if (base64Data && mimeType) {
        documentParts = [{
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        }];
      }

      const history = messages.slice(1).map((msg) => ({
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: msg.text }],
      }));

      const contents = [
        ...history,
        {
          role: "user",
          parts: [
            ...documentParts,
            { text: userText }
          ],
        },
      ];

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Gagal menghubungi server Gemini");
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error: unknown) {
      console.error("Error calling Gemini:", error);
      return `Maaf, terjadi kesalahan: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsTyping(true);
    
    const aiResponse = await askGemini(text);
    
    setMessages((prev) => [...prev, { role: "ai", text: aiResponse }]);
    setIsTyping(false);
  };

  const quickPrompts = [
    { label: "Buatkan Ringkasan", icon: <FileText size={14} />, prompt: "Tolong buatkan ringkasan yang jelas dan komprehensif dari dokumen ini." },
    { label: "Analisis Tren Data", icon: <BarChart3 size={14} />, prompt: "Tolong analisis data ini, temukan pola, tren, atau insight penting yang ada di dalamnya." },
    { label: "Ekstrak Poin Penting", icon: <Sparkles size={14} />, prompt: "Sebutkan poin paling penting atau temuan utama dari dokumen ini secara berurutan." },
  ];

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground">AI Analyzer & Chat</h3>
        <p className="text-muted-foreground text-sm">
          Berkolaborasi dengan data Anda menggunakan model Gemini 2.5.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pb-4 custom-scrollbar pr-2 flex flex-col">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted text-foreground rounded-tl-sm border border-border shadow-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q.prompt)}
                className="flex items-center gap-2 bg-background border border-border hover:border-primary/50 text-foreground text-xs py-2 px-4 rounded-full transition-smooth hover:bg-muted"
              >
                {q.icon}
                {q.label}
              </button>
            ))}
          </div>
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted p-4 rounded-2xl rounded-tl-sm border border-border shadow-sm">
              <Loader2 size={18} className="animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 mt-auto border-t border-border flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder="Tanyakan analisis atau insight spesifik..."
          className="flex-1 bg-background border-2 border-border focus:border-primary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-smooth"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isTyping}
          className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-smooth shadow-md shadow-primary/10"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}