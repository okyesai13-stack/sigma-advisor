import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, TrendingUp, Users, BarChart3, Target, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useResume } from "@/contexts/ResumeContext";
import { cn } from "@/lib/utils";

interface Message { role: "user" | "assistant"; content: string; }

const formatMessage = (content: string): string =>
  content
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[-]\s+/gm, "• ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const suggestions = [
  { icon: TrendingUp, title: "Market signal", q: "What are the strongest market signals for this business right now?" },
  { icon: Users, title: "Customer", q: "Who is the sharpest first customer to chase?" },
  { icon: BarChart3, title: "Pricing", q: "How should we think about pricing and unit economics?" },
  { icon: Target, title: "Risk", q: "What's the single biggest risk we should de-risk first?" },
];

const AdvisorChatPanel = () => {
  const { toast } = useToast();
  const { business } = useResume();
  const businessId = business?.id ?? null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!businessId) { setLoadingHistory(false); setMessages([]); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from("advisor_messages")
          .select("role, content")
          .eq("business_id", businessId)
          .order("created_at", { ascending: true });
        if (data) setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
      } finally { setLoadingHistory(false); }
    })();
  }, [businessId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading || !businessId) return;
    const userMsg: Message = { role: "user", content: input };
    const text = input;
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    if (taRef.current) taRef.current.style.height = "auto";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advisor-chat-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ message: text, business_id: businessId }),
        }
      );
      if (!res.ok) throw new Error("Failed to get response");

      if (!res.body) throw new Error("Advisor returned an empty response");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      let buffer = "";
      setMessages((p) => [...p, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              assistant += c;
              setMessages((prev) => {
                const u = [...prev];
                const last = u.length - 1;
                if (u[last]?.role === "assistant") u[last] = { ...u[last], content: formatMessage(assistant) };
                return u;
              });
            }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to reach the advisor.", variant: "destructive" });
      setMessages((p) => p.filter((_, i) => !(i === p.length - 1 && p[i].content === "")));
    } finally { setLoading(false); }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };
  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  if (loadingHistory) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between"><div><p className="eyebrow">Resident advisor</p><h2 className="mt-0.5 font-display text-lg font-semibold">Strategy counsel</h2></div><span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></span></div>
      </div>

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col justify-center px-5">
            <p className="eyebrow mb-3">Open with</p>
            <h3 className="mb-6 font-display text-2xl font-semibold leading-tight">
              {businessId ? "What should we sharpen next?" : "File a brief to begin."}
            </h3>
            {businessId && (
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => { setInput(s.q); taRef.current?.focus(); }}
                    className="flex w-full items-start gap-3 rounded-md border border-border bg-card px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-accent"
                  >
                    <s.icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="eyebrow">{s.title}</p>
                      <p className="text-sm mt-0.5">{s.q}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Composer ta={taRef} value={input} disabled={!businessId} loading={loading} onChange={onChange} onKey={onKey} onSend={send} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <div className="py-5 px-5 space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={cn("animate-fade-in", m.role === "user" && "flex justify-end")}>
                  {m.role === "assistant" ? (
                    <div>
                      <p className="eyebrow mb-2 text-primary">Advisor</p>
                      <p className="whitespace-pre-wrap rounded-md border border-border bg-card p-3 text-sm leading-6">{formatMessage(m.content)}</p>
                    </div>
                  ) : (
                    <div className="max-w-[85%]">
                      <p className="eyebrow mb-1 text-right">You</p>
                      <div className="rounded-md bg-primary px-4 py-2.5 text-primary-foreground">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && messages[messages.length - 1]?.content === "" && (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" />
                </div>
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>
          <Composer ta={taRef} value={input} disabled={false} loading={loading} onChange={onChange} onKey={onKey} onSend={send} />
        </div>
      )}
    </div>
  );
};

const Composer = ({ ta, value, disabled, loading, onChange, onKey, onSend }: any) => (
  <div className="shrink-0 border-t border-border p-3">
    <div className="relative rounded-md border border-border bg-card focus-within:border-primary/50">
      <Textarea
        ref={ta}
        value={value}
        onChange={onChange}
        onKeyDown={onKey}
        placeholder={disabled ? "File a brief to begin..." : "Ask the advisor..."}
        className="min-h-[46px] max-h-[160px] w-full resize-none border-0 bg-transparent py-3 pl-3 pr-12 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        rows={1}
        disabled={loading || disabled}
      />
      <Button
        onClick={onSend}
        disabled={!value.trim() || loading || disabled}
        size="icon"
        className="absolute bottom-1.5 right-1.5 h-8 w-8 disabled:opacity-30"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </Button>
    </div>
  </div>
);

export default AdvisorChatPanel;
