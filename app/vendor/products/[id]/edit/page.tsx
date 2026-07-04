'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import RequireAuth from '../../../../../components/RequireAuth';
import { products, categories } from '../../../../../lib/mockData';
import { addVendorDraft, getVendorDrafts, type VendorDraft } from '../../../../../lib/vendorDrafts';
import ModelViewer from '../../../../../components/ModelViewer';
import { ArrowLeft, PencilLine, UploadCloud, Loader2, ChevronRight, RotateCcw, CheckCircle2 } from 'lucide-react';

type FormData = {
  name: string;
  category: string;
  description: string;
  tags: string;
  price: number;
  currency: string;
};

export default function EditVendorProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const [form, setForm] = useState<FormData>({
    name: '',
    category: 'Furniture',
    description: '',
    tags: '',
    price: 0,
    currency: 'FCFA',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [previewVersions, setPreviewVersions] = useState<Array<{ versionId: string; modelUrl: string; generatedAt: string }>>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>('');
  const [saved, setSaved] = useState(false);

  const product = resolvedParams ? products.find((item) => item.id === Number(resolvedParams.id)) : undefined;
  const isDraft = resolvedParams?.id.startsWith('vd_');

  const activePreview = useMemo(() => {
    return previewVersions.find((v) => v.versionId === activeVersionId) || null;
  }, [previewVersions, activeVersionId]);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        category: product.category,
        description: product.description,
        tags: product.tags.join(', '),
        price: product.price,
        currency: product.currency,
      });
      if (product.available3D) {
        const version = {
          versionId: `model_${product.id}`,
          modelUrl: `/models/${product.model}`,
          generatedAt: product.createdAt,
        };
        setPreviewVersions([version]);
        setActiveVersionId(version.versionId);
      }
    }
    if (resolvedParams && isDraft) {
      const draft = getVendorDrafts().find((d) => d.id === resolvedParams.id);
      if (draft) {
        setForm({
          name: draft.metadata.name,
          category: draft.metadata.category,
          description: draft.metadata.description,
          tags: draft.metadata.tags.join(', '),
          price: draft.pricing.price,
          currency: draft.pricing.currency,
        });
        setPreviewVersions(draft.previewVersions);
        setActiveVersionId(draft.activeVersionId);
      }
    }
  }, [product, resolvedParams, isDraft]);

  if (!resolvedParams) return null;
  if (!product && !isDraft) {
    notFound();
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const handleGenerate = async () => {
    if (!selectedFile || isGenerating) return;
    setIsGenerating(true);
    setStatus('Uploading image to AI engine...');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/generate-3d', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.modelUrl) {
        throw new Error(data?.detail || data?.error || 'Failed to generate model');
      }

      const version = {
        versionId: `ver_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        modelUrl: data.modelUrl,
        generatedAt: new Date().toISOString(),
      };

      setPreviewVersions((prev) => {
        const next = [...prev, version];
        return next.slice(-10);
      });
      setActiveVersionId(version.versionId);
      setStatus('Generation complete! Preview staged.');
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : 'Error generating model. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!resolvedParams) return;

    if (isDraft) {
      const drafts = getVendorDrafts();
      const existing = drafts.find((d) => d.id === resolvedParams.id);
      if (existing) {
        const updated: VendorDraft = {
          ...existing,
          updatedAt: new Date().toISOString(),
          metadata: {
            ...existing.metadata,
            name: form.name,
            category: form.category,
            description: form.description,
            tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 12),
          },
          pricing: { currency: form.currency, price: form.price },
          previewVersions,
          activeVersionId,
        };
        addVendorDraft(updated, { replace: true });
      }
    }

    setStatus('Changes saved locally (mock).');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const canSave = form.name.trim().length >= 2 && form.description.trim().length >= 10 && form.price > 0;

  return (
    <RequireAuth role="vendor">
      <div className="min-h-screen bg-transparent">
        <main className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl">
            <Link href="/vendor/products" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-200">
              <ArrowLeft size={16} />
              Back to catalog
            </Link>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mt-8">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Edit product</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">{form.name || 'Untitled product'}</h1>
                <p className="mt-4 max-w-2xl text-blue-100">
                  Update product details, pricing, and manage 3D previews.
                </p>
              </div>
              <div className="rounded-3xl border border-blue-300/50 bg-blue-500/30 p-5">
                <div className="flex items-center gap-3 text-white">
                  <PencilLine size={18} />
                  <span className="font-semibold">{previewVersions.length > 0 ? '3D preview ready' : '3D preview pending'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-blue-200/50 bg-blue-600 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Product details</h2>

              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-blue-100">Name</span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-blue-300/50 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="Product name"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-blue-100">Category</span>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-blue-300/50 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-blue-100">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="min-h-[120px] w-full resize-y rounded-xl border border-blue-300/50 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="Product description"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-blue-100">Tags</span>
                  <input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full rounded-xl border border-blue-300/50 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="tag1, tag2, tag3"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[28px] border border-blue-200/50 bg-blue-600 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Pricing & 3D preview</h2>

              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-blue-100">Currency</span>
                  <input
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full rounded-xl border border-blue-300/50 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-blue-100">Price</span>
                  <input
                    type="number"
                    value={form.price}
                    min={0}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value || 0) })}
                    className="w-full rounded-xl border border-blue-300/50 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-blue-200/50 bg-blue-600 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">3D preview management</h2>

            <label className="block">
              <span className="text-sm font-semibold text-blue-100">Upload new image</span>
              <div className="mt-2 border-2 border-dashed border-blue-300/50 rounded-xl p-6 text-center bg-blue-500/30">
                <input
                  type="file"
                  className="hidden"
                  id="image-upload-edit"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <label htmlFor="image-upload-edit" className="cursor-pointer block">
                  <div className="flex items-center justify-center gap-2 text-blue-100">
                    <UploadCloud size={18} />
                    <span className="text-sm font-semibold">Choose file</span>
                  </div>
                  <p className="mt-2 text-xs text-blue-200">
                    Generate additional preview versions. Latest stays active by default.
                  </p>
                </label>
                {selectedFile && (
                  <p className="mt-3 text-xs text-blue-200">Selected: {selectedFile.name}</p>
                )}
              </div>
            </label>

            <button
              type="button"
              disabled={!selectedFile || isGenerating}
              onClick={handleGenerate}
              className="mt-4 rounded-2xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              {isGenerating ? 'Generating...' : 'Generate 3D preview'}
            </button>

{status && <p className="mt-3 text-sm text-blue-100">{status}</p>}

              <div className="mt-6 rounded-2xl border border-blue-300/50 bg-blue-500/30 p-4">
                <p className="text-sm font-semibold text-white">Active preview</p>
                <p className="mt-1 text-xs text-blue-200">
                  Latest staged version is active automatically.
                </p>
                <div className="mt-3">
                  {activePreview ? (
                    <div className="h-[360px]">
                      <ModelViewer modelUrl={activePreview.modelUrl} />
                    </div>
                  ) : (
                    <div className="h-[360px] rounded-xl border border-blue-300/50 bg-white/70 flex items-center justify-center text-sm text-blue-200">
                      No preview yet. Upload an image and generate.
                    </div>
                  )}
                </div>
              </div>

              {previewVersions.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-sm font-semibold text-white">Preview versions ({previewVersions.length})</p>
                  {previewVersions
                    .slice()
                    .reverse()
                    .map((v) => {
                      const isActive = v.versionId === activeVersionId;
                      return (
                        <button
                          key={v.versionId}
                          type="button"
                          onClick={() => setActiveVersionId(v.versionId)}
                          className={`w-full rounded-3xl border p-4 text-left transition ${
                            isActive
                              ? 'border-sky-300 bg-sky-500/80 text-white'
                              : 'border-blue-300/50 bg-white/70 hover:bg-white text-blue-900'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-blue-900">{isActive ? 'Version (active)' : 'Version'}</p>
                              <p className="mt-1 text-xs text-blue-600">
                                {new Date(v.generatedAt).toLocaleString()}
                              </p>
                            </div>
                            {isActive && (
                              <CheckCircle2 size={18} className="text-sky-300 shrink-0" />
                            )}
                          </div>
                          <p className="mt-2 text-xs text-blue-500 break-all">{v.modelUrl}</p>
                        </button>
                      );
                    })
                }
              </div>
              )}

              {previewVersions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewVersions([]);
                    setActiveVersionId('');
                    setStatus('Cleared staged previews.');
                    setSelectedFile(null);
                  }}
                  disabled={isGenerating}
                  className="mt-4 rounded-2xl border border-blue-300/50 bg-white px-4 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Clear staged previews
                </button>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Link
                href="/vendor/products"
                className="rounded-2xl border border-blue-300/50 bg-white px-6 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave || isGenerating}
                className="rounded-2xl bg-blue-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saved ? 'Saved!' : 'Save changes'}
              </button>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }