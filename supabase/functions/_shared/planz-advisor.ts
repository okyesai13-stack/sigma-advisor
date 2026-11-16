// Keep the existing advisor's mutation and SSE contract behind the common adapter.
export async function readAdvisor(response: Response, onUpdate: (value: Record<string, unknown>) => void): Promise<string> {
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw Object.assign(new Error(body.error || body.message || `AI request failed (${response.status})`), {status:response.status}); }
  if (!response.body) throw new Error("Planz AI returned no response");
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "", text = "";
  while (true) {
    const chunk = await reader.read(); if (chunk.done) break;
    buffer += decoder.decode(chunk.value, {stream:true}); const lines = buffer.split("\n"); buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ") || line.slice(6).trim() === "[DONE]") continue;
      const event = JSON.parse(line.slice(6));
      if (event.type === "result_updated") onUpdate(event);
      if (event.error) throw new Error(event.error.message || event.error);
      text += event.choices?.[0]?.delta?.content || "";
    }
  }
  if (!text.trim()) throw new Error("Planz AI returned an empty response");
  return text;
}