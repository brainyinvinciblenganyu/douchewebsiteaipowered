'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Bot, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { useBackendAuth as useAuth } from '../../components/BackendAuthProvider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

let messageIdCounter = 0;
function nextMessageId() {
  messageIdCounter += 1;
  return `msg-${messageIdCounter}`;
}

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part.split('\n').map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const greeting = user?.role === 'vendor'
    ? `Hi ${user?.name || 'there'}! I'm Brainy, your selling assistant. Ask me about your orders, revenue, or product catalog.`
    : user
      ? `Hi ${user?.name || 'there'}! I'm Brainy, your personal shopping assistant. Ask me about your orders or for product recommendations.`
      : "Hi! I'm Brainy. Ask me about our products or categories — log in any time for personalized recommendations and order tracking.";

  useEffect(() => {
    setMessages([{ id: nextMessageId(), role: 'assistant', content: greeting }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAssistantMessage = useCallback((id: string, updater: (prevContent: string) => string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: updater(m.content) } : m)));
  }, []);

  const streamReply = useCallback(async (userMessage: string, history: { role: string; content: string }[]) => {
    const assistantId = nextMessageId();
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const response = await fetch('/api/brainy/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, history }),
      signal: controller.signal,
    }).catch((error) => {
      if (error?.name === 'AbortError') return null;
      updateAssistantMessage(assistantId, () => "I'm sorry, I'm having trouble connecting right now. Please check your connection and try again.");
      return null;
    });

    if (!response) return;

    if (!response.ok || !response.body) {
      updateAssistantMessage(assistantId, () => "I'm sorry, I'm having trouble connecting right now. Please try again.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read().catch(() => ({ done: true, value: undefined }));
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        const line = event.trim();
        if (!line.startsWith('data:')) continue;
        const jsonStr = line.slice(5).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr) as { text?: string };
          if (parsed.text) {
            updateAssistantMessage(assistantId, (prevContent) => prevContent + parsed.text);
            scrollToBottom();
          }
        } catch {
          // ignore malformed chunk
        }
      }
    }

    abortControllerRef.current = null;
  }, [scrollToBottom, updateAssistantMessage]);

  const resetChat = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    setInput('');
    setMessages([{ id: nextMessageId(), role: 'assistant', content: greeting }]);
  }, [greeting]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    const historyForRequest = messages.map((m) => ({ role: m.role, content: m.content }));
    setInput('');
    setMessages((prev) => [...prev, { id: nextMessageId(), role: 'user', content: userMessage }]);
    setIsStreaming(true);
    scrollToBottom();

    try {
      await streamReply(userMessage, historyForRequest);
    } finally {
      setIsStreaming(false);
      scrollToBottom();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage();
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-72px)] max-w-3xl flex-col px-4 py-4 sm:px-6">
      <div className="flex shrink-0 items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#0058a3] to-[#003d73] p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Back" className="rounded-lg p-1.5 transition hover:bg-white/20">
            <ArrowLeft size={20} />
          </Link>
          <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="font-bold text-sm">Brainy</h1>
            <p className="text-xs text-blue-100 opacity-90">
              {user?.role === 'vendor' ? 'Your selling assistant' : 'Your shopping assistant'}
            </p>
          </div>
        </div>
        <button
          onClick={resetChat}
          className="rounded-lg p-2 transition hover:bg-white/20"
          aria-label="New chat"
          title="New chat"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="my-3 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-gray-100 bg-gradient-to-b from-slate-50 to-white p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'rounded-br-md bg-[#0058a3] text-white'
                  : 'rounded-bl-md border border-gray-100 bg-white text-gray-800 shadow-sm'
              }`}
            >
              {msg.content ? renderMarkdown(msg.content) : <Loader2 className="animate-spin text-[#0058a3]" size={16} />}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex shrink-0 gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void sendMessage();
            }
          }}
          placeholder={
            user?.role === 'vendor'
              ? 'Ask about your orders, sales...'
              : user
                ? 'Ask about your orders, picks...'
                : 'Ask about products, categories...'
          }
          rows={1}
          autoFocus
          className="max-h-32 flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#0058a3] focus:ring-2 focus:ring-[#0058a3]/30"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-xl bg-[#0058a3] p-2.5 text-white transition hover:bg-[#003d73] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
