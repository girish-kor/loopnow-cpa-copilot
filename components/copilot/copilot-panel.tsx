'use client';
import { useState } from 'react';
import type { ToolEvent } from '../dashboard/dashboard-shell';

export function CopilotPanel({
  selectedReceiptId, messages, onMessage, onToolEvent, onStage,
}: {
  selectedReceiptId: string | null;
  messages: Array<{ role: 'user' | 'assistant'; text: string }>;
  onMessage: (m: { role: 'user' | 'assistant'; text: string }) => void;
  onToolEvent: (e: ToolEvent) => void;
  onStage: (s: string) => void;
}) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput('');
    onMessage({ role: 'user', text });
    setBusy(true);
    onStage('reading');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: crypto.randomUUID(), selectedReceiptId, message: text }),
      });
      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let assistant = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';
        for (const part of parts) {
          const evMatch = /^event: (.+)$/m.exec(part);
          const dataMatch = /^data: (.+)$/m.exec(part);
          if (!evMatch || !dataMatch) continue;
          const ev = evMatch[1];
          const rawData = dataMatch[1];
          if (ev === undefined || rawData === undefined) continue;
          const data: unknown = JSON.parse(rawData);
          if (ev === 'tool') onToolEvent(data as ToolEvent);
          else if (ev === 'state') onStage((data as { stage: string }).stage);
          else if (ev === 'message') assistant += (data as { text: string }).text;
          else if (ev === 'error') assistant += `\n[error: ${(data as { message: string }).message}]`;
        }
      }
      if (assistant) onMessage({ role: 'assistant', text: assistant });
    } catch (e) {
      onMessage({ role: 'assistant', text: `Request failed: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="flex flex-col h-screen">
      <header className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold">AI Copilot</h2>
        <p className="text-xs text-fg-muted">
          {selectedReceiptId ? `Context: ${selectedReceiptId}` : 'No receipt selected'}
        </p>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div className={
              m.role === 'user'
                ? 'inline-block bg-accent/20 rounded-md px-3 py-2 text-sm'
                : 'inline-block bg-bg-raised rounded-md px-3 py-2 text-sm whitespace-pre-wrap'
            }>{m.text}</div>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="p-4 border-t border-border flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Process this receipt…"
          disabled={busy}
          aria-label="Message"
          className="flex-1 bg-bg-raised border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-3 py-2 rounded-md bg-accent hover:bg-accent-hover text-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </aside>
  );
}
