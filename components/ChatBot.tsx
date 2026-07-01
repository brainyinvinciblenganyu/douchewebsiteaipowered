'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Send, Bot, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { getInteractions } from '../lib/interactionTracker';
import type { ProductSuggestion } from '../lib/recommendationEngine';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: ProductSuggestion[];
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

function formatPrice(price: number) {
  return `FCFA ${price.toLocaleString()}`;
}

export default function ChatBot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  const fetchReply = useCallback(async (userMessage: string) => {
    const interactions = getInteractions();
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        history: messages,
        currentPage: pathname,
        ...interactions,
      }),
    });
    return response.json();
  }, [messages, pathname]);

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      setIsLoading(true);
      fetchReply('')
        .then((data) => {
          if (data.reply) {
            setMessages([{ role: 'assistant', content: data.reply, suggestions: data.suggestions }]);
          }
        })
        .catch(() => {
          setMessages([{
            role: 'assistant',
            content: 'Hello! I\'m your Douche AI assistant. Ask me for recommendations, prices, or VR help.',
          }]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, hasGreeted, fetchReply]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const data = await fetchReply(userMessage);
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply, suggestions: data.suggestions },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open AI assistant"
        className={`fixed bottom-6 right-6 bg-gradient-to-br from-[#0058a3] to-[#003d73] text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 z-[60] group ${
          isOpen ? 'hidden' : 'flex'
        }`}
      >
        <Bot size={28} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[calc(100vw-2rem)] sm:w-96 h-[min(560px,calc(100vh-3rem))] bg-white rounded-2xl shadow-2xl flex flex-col z-[60] border border-gray-200/80 overflow-hidden animate-in">
          <div className="bg-gradient-to-r from-[#0058a3] to-[#003d73] p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Douche AI</h3>
                <p className="text-xs text-blue-100 opacity-90">Personal shopping assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#0058a3] text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                  }`}
                >
                  {renderMarkdown(msg.content)}
                </div>

                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 w-[88%] space-y-2">
                    {msg.suggestions.map((s) => (
                      <Link
                        key={s.id}
                        href={`/product/${s.id}`}
                        className="flex items-center justify-between gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:border-[#0058a3]/30 hover:shadow-md transition group"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-xs truncate">{s.name}</p>
                          <p className="text-[#0058a3] text-xs font-medium">{formatPrice(s.price)}</p>
                          <p className="text-gray-400 text-[10px] truncate">{s.reason}</p>
                        </div>
                        <ExternalLink size={14} className="text-gray-300 group-hover:text-[#0058a3] shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-gray-100 shadow-sm flex items-center gap-2">
                  <Loader2 className="animate-spin text-[#0058a3]" size={16} />
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for recommendations..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0058a3]/30 focus:border-[#0058a3] text-sm text-gray-800 bg-gray-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
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
