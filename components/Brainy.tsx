'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';

export default function Brainy() {
  const pathname = usePathname();
  if (pathname?.startsWith('/chat')) return null;

  return (
    <Link
      href="/chat"
      aria-label="Chat with Brainy AI assistant"
      className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-full bg-gradient-to-br from-[#0058a3] to-[#003d73] p-4 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
    >
      <Bot size={28} className="transition-transform group-hover:rotate-12" />
      <span className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-[#ffdb00]" />
    </Link>
  );
}
