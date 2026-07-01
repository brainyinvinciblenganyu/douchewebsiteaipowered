export default function TermsPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <main className="mx-auto max-w-5xl px-6 py-16">
        <section className="section-card p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:shadow-slate-950/20">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Legal</p>
          <h1 className="mt-4 text-4xl font-semibold text-[#0058a3]">Terms of use</h1>
          <div className="mt-8 space-y-5 text-slate-600 dark:text-slate-400">
            <p>By using Douche, you agree to use the platform responsibly and respect the rights of vendors, customers, and creators.</p>
            <p>Product information, pricing, and availability may change without notice. Requests and recommendations are provided for convenience and may not reflect live inventory.</p>
            <p>All content, visuals, and 3D experiences on the platform remain the property of their respective owners unless otherwise stated.</p>
            <p>For questions about these terms or platform usage, please contact the support team through the contact page.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
