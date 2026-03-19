import { useState, useRef, useEffect, forwardRef } from "react";
import { Send, Loader2, AlertCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

interface ChatViewProps {
  documentText?: string;
}

const ChatView = forwardRef<HTMLDivElement, ChatViewProps>(({ documentText }, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setInput("");
    setMessages(newMessages);
    setIsTyping(true);
    setErrorMsg("");

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          documentContext: documentText ? documentText.slice(0, 15000) : undefined,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        if (resp.status === 429 && attempt < MAX_RETRIES) {
          setErrorMsg(`Rate limit tercapai. Mencoba ulang (${attempt}/${MAX_RETRIES})...`);
          await delay(RETRY_DELAY * attempt);
          setErrorMsg("");
          continue;
        }
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            /* ignore partial leftovers */
          }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      setErrorMsg(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[450px]">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Chatbot Dokumen</h3>
        <p className="text-muted-foreground text-sm">
          Tanyakan apa saja berdasarkan isi dokumen ini.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && !isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-4 rounded-2xl rounded-tl-sm text-sm bg-muted text-foreground border border-border">
              Halo! Saya siap membantu Anda memahami dokumen ini. Silakan ajukan pertanyaan.
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm border border-border"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-muted p-4 rounded-2xl rounded-tl-sm border border-border">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="pb-2 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle size={14} />
          {errorMsg}
        </div>
      )}

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
          disabled={isTyping}
          className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:opacity-90 transition-smooth shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
