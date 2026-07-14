'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Send, Bot, Loader2, Sparkles, RefreshCw, MessageSquarePlus } from 'lucide-react';
import { useBackendAuth as useAuth } from './BackendAuthProvider';

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

export default function Brainy() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const greeting = user?.role === 'vendor'
    ? `Hi ${user?.name || 'there'}! I'm Brainy, your selling assistant. Ask me about your orders, revenue, or product catalog.`
    : user
      ? `Hi ${user?.name || 'there'}! I'm Brainy, your personal shopping assistant. Ask me about your orders or for product recommendations.`
      : "Hi! I'm Brainy. Ask me about our products or categories — log in any time for personalized recommendations and order tracking.";

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([{ id: nextMessageId(), role: 'assistant', content: greeting }]);
    }
  };

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
      throw error;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Open Brainy AI assistant"
        className={`fixed bottom-6 right-6 bg-gradient-to-br from-[#0058a3] to-[#003d73] text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 z-[60] group ${
          isOpen ? 'hidden' : 'flex'
        }`}
      >
        <Bot size={28} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#ffdb00] rounded-full border-2 border-white animate-pulse" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[calc(100vw-2rem)] sm:w-96 h-[min(560px,calc(100vh-3rem))] bg-white rounded-2xl shadow-2xl flex flex-col z-[60] border border-gray-200/80 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0058a3] to-[#003d73] p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Brainy</h3>
                <p className="text-xs text-blue-100 opacity-90">
                  {user?.role === 'vendor' ? 'Your selling assistant' : 'Your shopping assistant'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                className="hover:bg-white/20 p-2 rounded-lg transition"
                aria-label="New chat"
                title="New chat"
              >
                <MessageSquarePlus size={18} />
              </button>
              <button
                onClick={resetChat}
                className="hover:bg-white/20 p-2 rounded-lg transition"
                aria-label="Refresh chat"
                title="Refresh chat"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-2 rounded-lg transition"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#0058a3] text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                  }`}
                >
                  {msg.content ? (
                    renderMarkdown(msg.content)
                  ) : (
                    <Loader2 className="animate-spin text-[#0058a3]" size={16} />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                user?.role === 'vendor'
                  ? 'Ask about your orders, sales...'
                  : user
                    ? 'Ask about your orders, picks...'
                    : 'Ask about products, categories...'
              }
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0058a3]/30 focus:border-[#0058a3] text-sm text-gray-800 bg-gray-50"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="bg-[#0058a3] text-white p-2.5 rounded-xl hover:bg-[#003d73] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
