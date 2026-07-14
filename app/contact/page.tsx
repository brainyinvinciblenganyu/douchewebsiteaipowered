'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import VisitUsOnsite from '../../components/VisitUsOnsite';
import PageHero from '../../components/PageHero';

const backgroundImages = [
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1400&q=80'
];

const styles = `
  @keyframes swipeMove {
    0% { transform: translate(0, 0) scale(1.15); }
    25% { transform: translate(-40px, 0) scale(1.15); }
    50% { transform: translate(40px, 0) scale(1.15); }
    75% { transform: translate(0, -40px) scale(1.15); }
    100% { transform: translate(0, 40px) scale(1.15); }
  }

  .bg-animation {
    animation: swipeMove 15s ease-in-out infinite alternate;
  }
`;

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [currentImage, setCurrentImage] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Thank you for your message! We will get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        alert('Something went wrong. Please try again later.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Something went wrong. Please try again later.');
    } finally {
      setStatus('idle');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="relative overflow-hidden bg-[#F3F4F6] text-[#111827] min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="fixed inset-0 -z-10 overflow-hidden">
        {backgroundImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentImage ? 'opacity-80' : 'opacity-0'}`}
          >
            <Image
              src={img}
              alt={`Contact background ${index + 1}`}
              fill
              className="object-cover opacity-90 bg-animation"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-white/70" />
          </div>
        ))}
      </div>

      <main className="relative mx-auto max-w-6xl px-6 py-16">
        <PageHero className="mb-12">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-200">Contact</p>
          <h1 className="mt-4 text-5xl font-bold leading-tight">Talk to the team behind Douche.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-sky-100">
            Share your questions, requests, or vendor inquiries and our team will respond promptly.
            We make customer support feel premium, fast, and easy.
          </p>
        </PageHero>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl bg-white p-10 shadow-lg shadow-slate-900/5 border border-[#D1D5DB]">
            <div className="mb-8 space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-[#0058A3]">Contact Information</p>
              <h2 className="text-3xl font-bold text-[#111827]">Reach out with any question.</h2>
              <p className="text-lg text-slate-600">
                Use the form to submit your request, or connect with us directly via email, phone, or WhatsApp.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 rounded-2xl border border-[#D1D5DB] bg-[#F5F7FA] p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0058A3] text-white">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Email</p>
                  <p className="text-base text-slate-600">support@douche.com</p>
                  <p className="text-base text-slate-600">info@douche.com</p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl border border-[#D1D5DB] bg-[#F5F7FA] p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0058A3] text-white">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Phone</p>
                  <p className="text-base text-slate-600">+237 678 911 891</p>
                  <p className="text-base text-slate-600">Mon - Fri, 9:00 AM - 6:00 PM</p>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl border border-[#D1D5DB] bg-[#F5F7FA] p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366] text-white">
                  <span className="font-bold">W</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">WhatsApp</p>
                  <p className="text-base text-slate-600">Chat with our vendor team directly.</p>
                  <a
                    href="https://wa.me/237678911891?text=Hi%20Douche%20team%2C%20I%27d%20like%20help%20with%20a%20product%20request."
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex items-center gap-2 text-[#0284C7] font-semibold transition hover:text-[#1E40AF]"
                  >
                    Start WhatsApp chat
                  </a>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl border border-[#D1D5DB] bg-[#F5F7FA] p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0058A3] text-white">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Address</p>
                  <p className="text-base text-slate-600">Douche Headquarters</p>
                  <p className="text-base text-slate-600">Buea, Cameroon</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-10 shadow-lg shadow-slate-900/5 border border-[#D1D5DB]">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.35em] text-[#0058A3]">Send a message</p>
              <h2 className="mt-3 text-3xl font-bold text-[#111827]">Let us know how we can help.</h2>
              <p className="mt-3 text-lg text-slate-600">
                Complete the form below with your request, and we&apos;ll respond within one business day.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-[#111827]">Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0058A3]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-[#111827]">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0058A3]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-semibold text-[#111827]">Subject *</label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="What can we help with?"
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0058A3]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-semibold text-[#111827]">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell us more about your request..."
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0058A3] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0058A3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === 'loading' ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </section>
        </div>
      </main>

      <VisitUsOnsite />
    </div>
  );
}
