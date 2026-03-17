import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

const simulateProcess = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Message {
  role: "ai" | "user";
  text: string;
}

const AI_RESPONSES = [
  "Berdasarkan dokumen tersebut, informasi yang Anda cari terdapat pada halaman 4 bagian analisis data.",
  "Dokumen ini menyebutkan bahwa tingkat akurasi OCR mencapai 98.5% untuk teks berformat standar.",
  "Menurut kesimpulan dokumen, integrasi API direkomendasikan untuk meningkatkan skalabilitas.",
  "Ya, dokumen ini membahas tentang kompatibilitas dengan format PDF/A dan PDF 2.0.",
];

export default function ChatView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Halo! Saya telah membaca dokumen Anda. Ada yang ingin Anda tanyakan?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);

    setIsTyping(true);
    await simulateProcess(1500);

    const aiResponse =
      AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
    setMessages((prev) => [...prev, { role: "ai", text: aiResponse }]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-[450px]">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Chatbot Dokumen</h3>
        <p className="text-muted-foreground text-sm">
          Tanyakan apa saja berdasarkan isi dokumen ini.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm border border-border"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted p-4 rounded-2xl rounded-tl-sm border border-border">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Tanyakan sesuatu tentang dokumen ini..."
          className="flex-1 bg-muted border border-input rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 ring-ring outline-none transition-smooth"
        />
        <button
          onClick={handleSend}
          className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:opacity-90 transition-smooth shadow-lg shadow-primary/20"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
