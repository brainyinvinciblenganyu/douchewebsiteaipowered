'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useBackendAuth } from '../../components/BackendAuthProvider';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  DollarSign,
  Leaf,
  Lock,
  Package,
  ShieldCheck,
  Sparkles,

  Truck,
  Users,
  Star,
  Instagram,
  Twitter,
  Linkedin,
  CalendarCheck,
  Mail,
  Headphones,
  Box,
  Zap,
  Store,
} from 'lucide-react';
import PageHero from '../../components/PageHero';

type RevealProps = {
  children: React.ReactNode;
  className?: string;
};

function useRevealOnScroll<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2, ...options },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);

  return { ref, isVisible };
}

function Reveal({ children, className }: RevealProps) {
  const { ref, isVisible } = useRevealOnScroll<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={
        className ??
        'transition-all duration-700 ease-out transform opacity-0 translate-y-4 data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0'
      }
      data-visible={isVisible ? 'true' : 'false'}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0px)' : 'translateY(16px)',
      }}
    >
      {children}
    </div>
  );
}

function StatCounter({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix?: string;
  label: string;
}) {
  const { ref, isVisible } = useRevealOnScroll<HTMLDivElement>({ threshold: 0.25 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const start = performance.now();
    const duration = 900;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) requestAnimationFrame(tick);
    };

    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [isVisible, value]);

  return (
    <div ref={ref} className="rounded-[28px] border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
      <div className="text-4xl font-semibold text-white">
        {display.toLocaleString()}
        {suffix ?? ''}
      </div>
      <div className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-sky-100">{label}</div>
    </div>
  );
}

function AccordionItem({
  q,
  a,
}: {
  q: string;
  a: string;
}) {
  const [open, setOpen] = useState(false);
  const contentId = useMemo(() => `faq-${q.replace(/\s+/g, '-').toLowerCase()}`, [q]);

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-sm">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-base font-semibold text-slate-950">{q}</span>
        <span aria-hidden className="text-slate-400 text-xl leading-none">
          {open ? '−' : '+'}
        </span>
      </button>
      <div
        id={contentId}
        className={
          open
            ? 'px-6 pb-6 text-slate-600 transition-[max-height] duration-300 ease-out'
            : 'px-6 pb-0 max-h-0 overflow-hidden text-slate-600 transition-[max-height] duration-300 ease-out'
        }
        style={{ maxHeight: open ? 220 : 0 }}
      >
        <p className="text-sm leading-6">{a}</p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  const router = useRouter();
  const { user, isHydrated } = useBackendAuth();

  const requireLoginForShop = (e: React.MouseEvent) => {
    if (isHydrated && !user) {
      e.preventDefault();
      router.push('/auth/login');
    }
  };

  const team = useMemo(
    () => [
      {
        name: 'Kah Kissingere',
        position: 'CEO • Innovative Tech',
        bio: 'Building immersive commerce experiences with practical product strategy.',
        img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyoAGem8obilgKKonsw89hAZR32iCbNDSv8R1MAnzWVRvINtxwa0C6_ps&s=10',
      },
      {
        name: 'Nganyu Brandon',
        position: 'Web Developer',
        bio: 'Crafting fast, responsive interfaces and smooth customer journeys.',
        img: 'https://scontent-los4-1.xx.fbcdn.net/v/t39.30808-6/449388383_1641209413337625_4800909064096925221_n.jpg?stp=dst-jpg_tt6&cstp=mx320x326&ctp=s320x326&_nc_cat=110&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=xg9e2bWcz_oQ7kNvwHvT2u8&_nc_oc=AdpAba_b9SIyvfS0JLEZqyXHYrVcqnoeGUrBNs-vWgqmm0-pVrqZsg8rwwlQDJChpPLqknLlpAjqTUKbib5T1d5j&_nc_zt=23&_nc_ht=scontent-los4-1.xx&_nc_gid=4bR91Wsv0zCB9VnzUuHLRQ&_nc_ss=7b289&oh=00_Af8GDvpWdL5FGFpiWPDaRiO4zflTQoBY8RSCZglKqAH0Bw&oe=6A4729E6',
      },
      {
        name: 'Dr. Nde Nguti',
        position: 'Project Supervisor',
        bio: 'Guiding the team with mentorship and research-led execution.',
        img: 'https://media.licdn.com/dms/image/v2/C5603AQERR8Zt2l4Dvw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1552562848958?e=2147483647&v=beta&t=bq90-C2riNOw87yK4uOQaioxPiGDCecAcdaV_mUd5Qw',
      },
      {
        name: 'Beshe Jackson',
        position: 'Operations Sponsor',
        bio: 'Ensuring quality delivery workflows from planning to shipping.',
        img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyoAGem8obilgKKonsw89hAZR32iCbNDSv8R1MAnzWVRvINtxwa0C6_ps&s=10',
      },
    ],
    [],
  );

  const testimonials = useMemo(
    () => [
      {
        name: 'Abanda Sergio',
        text: 'The 3D preview made choosing effortless. Everything feels premium and clear—no guesswork.',
        img: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=256&q=80',
      },
      {
        name: 'Abila Vin Wilson',
        text: 'As a vendor, the experience helps us present products in a way customers truly understand.',
        img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
      },
      {
        name: 'Agbor Emmanuel',
        text: 'Smooth navigation, fast responses, and the recommendations actually feel personal.',
        img: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=256&q=80',
      },
    ],
    [],
  );

  const faq = useMemo(
    () => [
      {
        q: 'Who are we?',
        a: 'We are Douche—an ecommerce experience focused on immersive 3D product visualization and calmer, more helpful shopping through personalization.',
      },
      {
        q: 'Where do you ship?',
        a: 'We serve customers across multiple African regions. Availability may vary by product and vendor. Contact us for guidance on delivery timelines.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'Purchases in this demo are request-based. In the real platform, we would support secure online payments and vendor-verified checkout flows.',
      },
      {
        q: 'What is your return policy?',
        a: 'We prioritize quality and customer satisfaction. Returns are typically handled after inspection and agreement with the vendor for each order.',
      },
      {
        q: 'How can customers contact support?',
        a: 'You can reach our team through the Contact page. For urgent order questions, include your reference and product details.',
      },
    ],
    [],
  );

  return (
    <div className="min-h-[calc(100vh-72px)]">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-sky-50 opacity-90" />
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-accent-soft blur-3xl opacity-70" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-accent-soft blur-3xl opacity-50" />
      </div>

      <main className="relative z-10">
        {/* Section 1: Hero */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <Reveal>
            <PageHero>
              <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                    <Sparkles size={16} />
                    Experience-led commerce
                  </div>
                  <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white">
                    More Than Products—We&apos;re Building Better Experiences.
                  </h1>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-sky-100">
                    Douche connects African craftsmanship with modern technology—so you can explore, preview, and request
                    with confidence.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                      href="/products"
                      onClick={requireLoginForShop}
                      className="inline-flex items-center rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-[#0058a3] transition hover:-translate-y-[1px] hover:shadow-lg"
                    >
                      Shop Now <ArrowRight size={18} className="ml-2" />
                    </Link>
                    <Link href="/contact" className="inline-flex items-center rounded-2xl border-2 border-white px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-[1px] hover:bg-white hover:text-[#0058a3]">
                      Contact Us
                    </Link>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-gradient-to-br from-slate-50 to-sky-50 p-6">
                  <div className="absolute inset-0 opacity-30">
                    <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(0,88,163,0.25),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(245,158,11,0.20),transparent_50%)]" />
                  </div>
                  <div className="relative">
                    <div className="rounded-[24px] bg-white/70 p-6 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                          <Cpu size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">AI-Powered</p>
                          <p className="text-xs text-slate-500">3D previews + calm recommendations</p>
                        </div>
                      </div>
                      <div className="mt-6 grid gap-3">
                        {[
                          { icon: <Package size={18} />, t: 'Immersive preview' },
                          { icon: <ShieldCheck size={18} />, t: 'Safe request flow' },
                          { icon: <Leaf size={18} />, t: 'Quality-first curation' },
                        ].map((x) => (
                          <div key={x.t} className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-950">{x.icon}</span>
                              <span className="text-sm font-semibold text-slate-900">{x.t}</span>
                            </div>
                            <CheckCircle2 className="text-[#0058a3]" size={18} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </PageHero>
          </Reveal>
        </section>

        {/* Section 2: Our Story */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <Reveal>
            <PageHero>
              <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] items-center">
                <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-sm">
                  <div className="relative p-8">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0058a3]">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Crafted with care</p>
                        <p className="text-xs text-sky-100">A modern platform for African products</p>
                      </div>
                    </div>
                    <div className="mt-6 aspect-[4/3] rounded-[24px] bg-white/10 border border-white/20" role="img" aria-label="About illustration placeholder">
                      <div className="flex h-full w-full items-center justify-center text-sky-100">
                        Illustration Placeholder
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-4xl font-semibold text-white">Our Story</h2>
                  <div className="mt-5 space-y-4 text-sky-100">
                    <p>
                      Douche started with one simple belief: online shopping should feel like exploring a showroom—not guessing from photos.
                    </p>
                    <p>
                      We saw a problem: African craftsmanship deserves better presentation. Many products lose their character in basic listings.
                    </p>
                    <p>
                      So we built a platform that combines AI-powered 3D visualization, a VR showroom, and personalized recommendations.
                    </p>
                    <p>
                      Today, we&apos;re growing one detail at a time—because great technology is only meaningful when it celebrates people.
                    </p>
                  </div>
                </div>
              </div>
            </PageHero>
          </Reveal>
        </section>

        {/* Section 3: Mission & Vision */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <PageHero>
            <div className="grid gap-6 md:grid-cols-2">
              <Reveal>
                <div className="rounded-[28px] border border-white/20 bg-white/10 p-10 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/15">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0058a3]">
                      <TargetIcon />
                    </div>
                    <h3 className="text-2xl font-semibold text-white">Mission</h3>
                  </div>
                  <p className="mt-4 text-sky-100 leading-7">
                    Deliver premium, confident shopping through immersive 3D previews and calm AI personalization—so customers choose faster and with trust.
                  </p>
                </div>
              </Reveal>
              <Reveal>
                <div className="rounded-[28px] border border-white/20 bg-white/10 p-10 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/15">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0058a3]">
                      <VisionIcon />
                    </div>
                    <h3 className="text-2xl font-semibold text-white">Vision</h3>
                  </div>
                  <p className="mt-4 text-sky-100 leading-7">
                    Make African products globally discoverable, beautifully presented, and sustainably delivered—one immersive experience at a time.
                  </p>
                </div>
              </Reveal>
            </div>
          </PageHero>
        </section>

        {/* Section 4: Why Choose Us */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <PageHero>
            <Reveal>
              <div className="flex items-end justify-between gap-6 mb-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-100">Why Choose Douche</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Premium experiences built for everyday shopping</h2>
                </div>
              </div>
            </Reveal>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: <Sparkles size={22} />, title: 'Premium Quality', desc: 'Curated listings with clear product details and 3D-ready assets.' },
                { icon: <Truck size={22} />, title: 'Fast Delivery', desc: 'Efficient request-to-confirm workflows designed to reduce waiting.' },
                { icon: <Lock size={22} />, title: 'Secure Payments', desc: 'Verified checkout flows with safety-first handling (request-based in demo).' },
                { icon: <Headphones size={22} />, title: 'Customer Support', desc: 'Support that helps you move from questions to decisions quickly.' },
                { icon: <CalendarCheck size={22} />, title: 'Easy Returns', desc: 'Order-friendly policies handled with care after confirmation.' },
                { icon: <Users size={22} />, title: 'Trusted by Thousands', desc: 'A platform customers trust for product discovery and experience.' },
              ].map((f) => (
                <Reveal key={f.title}>
                  <div className="rounded-[28px] border border-white/20 bg-white/10 p-8 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/15">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0058a3]">
                      {f.icon}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-white">{f.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-sky-100">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </PageHero>
        </section>

        {/* Section 5: Our Values */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <PageHero>
            <Reveal>
              <h2 className="text-3xl font-semibold text-white">Our Values</h2>
              <p className="mt-3 max-w-2xl text-sky-100">The principles behind every preview, recommendation, and request.</p>
            </Reveal>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'Integrity', icon: <ShieldCheck size={22} />, bg: 'from-[#e8f2fa] to-white', tint: 'text-[#0058a3]' },
                { title: 'Innovation', icon: <Sparkles size={22} />, bg: 'from-cyan-50 to-white', tint: 'text-cyan-700' },
                { title: 'Sustainability', icon: <Leaf size={22} />, bg: 'from-emerald-50 to-white', tint: 'text-emerald-700' },
                { title: 'Customer First', icon: <Users size={22} />, bg: 'from-amber-50 to-white', tint: 'text-amber-700' },
              ].map((v) => (
                <Reveal key={v.title}>
                  <div className={`rounded-[28px] border border-white/20 bg-white/10 p-8 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/15`}>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${v.bg}`}>
                      <span className={`${v.tint}`}>{v.icon}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-white">{v.title}</h3>
                  </div>
                </Reveal>
              ))}
            </div>
          </PageHero>
        </section>

        {/* Section 5b: What Makes Us Different */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <PageHero>
            <Reveal>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-100">Why Douche</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">What makes us different</h2>
              <p className="mt-3 max-w-2xl text-sky-100">The technology and standards behind every product experience.</p>
            </Reveal>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: <Sparkles size={22} />, title: 'AI Recommendations', desc: 'Personalized product matches that learn from your browsing and shopping habits.' },
                { icon: <Box size={22} />, title: '3D Product Viewer', desc: 'Rotate, zoom, and explore products in interactive 3D before you buy.' },
                { icon: <ShieldCheck size={22} />, title: 'Secure Shopping', desc: 'Safety-first request and checkout flows that protect every transaction.' },
                { icon: <Zap size={22} />, title: 'Fast Performance', desc: 'A responsive, modern storefront built for speed on any device.' },
                { icon: <Store size={22} />, title: 'Vendor Friendly', desc: 'Simple tools for vendors to upload, manage, and showcase their catalog.' },
                { icon: <Cpu size={22} />, title: 'Modern Technology', desc: 'AI-powered 3D generation and recommendations, built on a modern stack.' },
              ].map((f) => (
                <Reveal key={f.title}>
                  <div className="rounded-[28px] border border-white/20 bg-white/10 p-8 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/15">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0058a3]">
                      {f.icon}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-white">{f.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-sky-100">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </PageHero>
        </section>

        {/* Section 6: By the Numbers */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <PageHero>
            <Reveal>
              <h2 className="text-3xl font-semibold text-white">By the Numbers</h2>
              <p className="mt-3 max-w-2xl text-sky-100">Proof that premium experiences scale with trust.</p>
            </Reveal>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCounter value={10000} suffix="+" label="Happy Customers" />
              <StatCounter value={500} suffix="+" label="Products" />
              <StatCounter value={50} suffix="+" label="Countries Served" />
              <StatCounter value={99} suffix="%" label="Customer Satisfaction" />
            </div>
          </PageHero>
        </section>

        {/* Section 7: Meet the Team */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <PageHero>
            <Reveal>
              <h2 className="text-3xl font-semibold text-white">Meet the Team</h2>
              <p className="mt-3 max-w-2xl text-sky-100">People behind the platform—focused on quality and clarity.</p>
            </Reveal>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((m) => (
                <Reveal key={m.name}>
                  <article className="rounded-[28px] border border-white/20 bg-white/10 p-8 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/15">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/30 bg-white/10">
                        {/* Image placeholder */}
                        <img src={m.img} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-white">{m.name}</h3>
                      <p className="mt-1 text-sm font-medium text-sky-100">{m.position}</p>
                      <p className="mt-4 text-sm leading-6 text-sky-100">{m.bio}</p>

                      <div className="mt-6 flex items-center gap-3" aria-label={`${m.name} social links`}>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white" aria-hidden>
                          <Instagram size={16} />
                        </span>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white" aria-hidden>
                          <Twitter size={16} />
                        </span>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white" aria-hidden>
                          <Linkedin size={16} />
                        </span>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </PageHero>
        </section>

        {/* Section 8: Our Process */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <PageHero>
            <Reveal>
              <h2 className="text-3xl font-semibold text-white">Our Process</h2>
              <p className="mt-3 max-w-2xl text-sky-100">From selection to delivery—with quality checks at every step.</p>
            </Reveal>

            <div className="mt-10">
              <ol className="relative grid gap-6 md:grid-cols-1 md:gap-8 lg:gap-0 lg:grid-cols-5">
                {[
                  { t: 'Product Selection', icon: <Sparkles size={18} /> },
                  { t: 'Quality Inspection', icon: <ShieldCheck size={18} /> },
                  { t: 'Secure Packaging', icon: <Package size={18} /> },
                  { t: 'Fast Shipping', icon: <Truck size={18} /> },
                  { t: 'Happy Customer', icon: <Users size={18} /> },
                ].map((step, idx) => (
                  <li key={step.t} className="lg:relative">
                    <div className="flex flex-col items-start lg:items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0058a3]">
                        {step.icon}
                      </div>
                      <div className="mt-3 text-left lg:text-center">
                        <p className="text-base font-semibold text-white">{step.t}</p>
                      </div>
                    </div>

                    {idx !== 4 && (
                      <div className="hidden lg:block absolute left-1/2 top-6 h-px w-full bg-white/25" aria-hidden />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </PageHero>
        </section>

        {/* Section 9: Testimonials */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <Reveal>
            <h2 className="text-3xl font-semibold text-slate-950">Testimonials</h2>
            <p className="mt-3 max-w-2xl text-slate-600">Trusted feedback from customers and vendors.</p>
          </Reveal>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Reveal key={t.name}>
                <article className="rounded-[32px] border border-slate-200/70 bg-white/95 p-8 shadow-sm backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200/70 bg-slate-100">
                      <img src={t.img} alt={t.name} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{t.name}</p>
                      <div className="mt-1 flex items-center gap-1" aria-label="5 star rating">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={14} className="fill-amber-400 text-amber-400" aria-hidden />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-slate-600">“{t.text}”</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Section 10: Trust & Certifications */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <PageHero>
            <Reveal>
              <h2 className="text-3xl font-semibold text-white">Trust &amp; Certifications</h2>
              <p className="mt-3 max-w-2xl text-sky-100">Premium standards for secure and sustainable shopping.</p>
            </Reveal>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { t: 'Secure Payments', icon: <DollarSign size={20} /> },
                { t: 'Quality Guarantee', icon: <ShieldCheck size={20} /> },
                { t: 'Eco Friendly', icon: <Leaf size={20} /> },
                { t: 'Fast Shipping', icon: <Truck size={20} /> },
              ].map((x) => (
                <Reveal key={x.t}>
                  <div className="rounded-[28px] border border-white/20 bg-white/10 p-8 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/15">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8f2fa] to-white text-[#0058a3]">
                      {x.icon}
                    </div>
                    <p className="mt-4 text-base font-semibold text-white">{x.t}</p>
                    <p className="mt-2 text-sm text-sky-100">Premium promise backed by careful workflows.</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </PageHero>
        </section>

        {/* Section 11: FAQ */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <Reveal>
            <h2 className="text-3xl font-semibold text-slate-950">FAQ</h2>
            <p className="mt-3 max-w-2xl text-slate-600">Clear answers to help you shop with confidence.</p>
          </Reveal>

          <div className="mt-8 grid gap-4">
            {faq.map((f) => (
              <AccordionItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </section>

        {/* Section 12: Final CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <Reveal>
            <div className="rounded-[36px] bg-gradient-to-r from-slate-950 via-slate-900 to-[#003d70] p-10 text-white shadow-2xl shadow-slate-900/20">
              <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] items-center">
                <div>
                  <h2 className="text-4xl font-semibold">Ready to shop smarter?</h2>
                  <p className="mt-4 max-w-2xl text-slate-200">
                    Explore our collection of African products in immersive 3D—and request with confidence.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
                  <Link
                    href="/products"
                    onClick={requireLoginForShop}
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-[#0058a3] transition hover:-translate-y-[1px] hover:shadow-lg"
                  >
                    Shop Collection
                  </Link>
                  <Link href="/contact" className="btn-secondary rounded-2xl text-white" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.18)' }}>
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
    </div>
  );
}

function TargetIcon() {
  // small wrapper to avoid extra imports in the main component
  return <CheckCircle2 size={20} />;
}

function VisionIcon() {
  return <Sparkles size={20} />;
}

