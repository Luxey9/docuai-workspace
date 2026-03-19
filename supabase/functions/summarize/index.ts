import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Field 'text' is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    const AI_BASE_URL = Deno.env.get("AI_BASE_URL") || "https://api.openai.com/v1";
    const AI_MODEL = Deno.env.get("AI_MODEL") || "gpt-4o-mini";

    if (!AI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content: `Anda adalah asisten AI yang ahli dalam meringkas dokumen. Berikan ringkasan dalam bentuk poin-poin penting (bullet points) dalam Bahasa Indonesia. Maksimal 5-7 poin. PENTING: Balas HANYA dengan JSON array of strings, tanpa markdown code blocks, tanpa penjelasan tambahan. Contoh format: ["poin 1", "poin 2", "poin 3"]`,
          },
          {
            role: "user",
            content: `Ringkas dokumen berikut:\n\n${text}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("AI API error:", response.status, errBody);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit tercapai, coba lagi nanti." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: `AI API error: ${response.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse as JSON array, clean markdown if needed
    let points: string[];
    try {
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      points = JSON.parse(cleaned);
      if (!Array.isArray(points)) throw new Error("Not an array");
    } catch {
      points = content
        .replace(/```json\s*/g, "").replace(/```\s*/g, "")
        .split("\n")
        .map((line: string) => line.replace(/^[-•*"\[\],]\s*/g, "").replace(/["\[\],]+$/g, "").trim())
        .filter((line: string) => line.length > 3);
    }

    return new Response(JSON.stringify({ points }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
