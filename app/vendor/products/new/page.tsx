'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '../../../../components/RequireAuth';
import { useBackendAuth } from '../../../../components/BackendAuthProvider';
import { categories } from '../../../../lib/mockData';
import { addVendorDraft, getVendorDrafts, type VendorDraft } from '../../../../lib/vendorDrafts';
import ModelViewer from '../../../../components/ModelViewer';
import { ArrowLeft, CheckCircle2, ChevronRight, Plus, RotateCcw, UploadCloud, Loader2 } from 'lucide-react';

type DraftPricing = {
  currency: string;
  price: number;
};

const STORAGE_KEYS = {
  currentDraftId: 'douche_vendor_current_draft_id',
};

function uid() {
  return `vd_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatPrice(currency: string, price: number) {
  return `${currency} ${price.toLocaleString()}`;
}

type PreviewVersion = {
  versionId: string;
  modelUrl: string;
  generatedAt: string;
  fileName?: string;
  sourceType?: '3d-upload';
};

const ACCEPTED_3D_EXTENSIONS = ['.glb', '.gltf', '.obj', '.fbx', '.stl', '.dae'];
const ACCEPTED_3D_MIME_TYPES = [
  'model/gltf-binary',
  'model/gltf+json',
  'model/obj',
  'model/fbx',
  'application/octet-stream',
];

function isAccepted3DFile(file: File | null) {
  if (!file) return false;

  const name = file.name.toLowerCase();
  const hasAcceptedExtension = ACCEPTED_3D_EXTENSIONS.some((extension) => name.endsWith(extension));
  const hasAcceptedMime = ACCEPTED_3D_MIME_TYPES.includes(file.type.toLowerCase());

  return hasAcceptedExtension || hasAcceptedMime;
}

export default function NewVendorProductPage() {
  const { user } = useBackendAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [draftId, setDraftId] = useState<string>('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Furniture');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string>('');

  const [pricing, setPricing] = useState<DraftPricing>({ currency: 'FCFA', price: 15000 });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  const [previewVersions, setPreviewVersions] = useState<PreviewVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>('');
  const activePreview = useMemo(() => {
    return previewVersions.find((v: PreviewVersion) => v.versionId === activeVersionId) || null;
  }, [previewVersions, activeVersionId]);

  // Persist draft id so refresh doesn't lose progress.
  useEffect(() => {
    try {
      const existingId = window.localStorage.getItem(STORAGE_KEYS.currentDraftId);
      if (existingId) {
const existing = getVendorDrafts().find((d: VendorDraft) => d.id === existingId);
        if (existing) {
          setDraftId(existing.id);
          setName(existing.metadata.name);
          setCategory(existing.metadata.category);
          setDescription(existing.metadata.description);
          setTags(existing.metadata.tags.join(', '));
          setPricing(existing.pricing);
          setPreviewVersions(existing.previewVersions);
          setActiveVersionId(existing.activeVersionId);
          const maxStep = existing.isPublished ? 4 : 4; // keep simple; allow review
          setStep(maxStep as 1 | 2 | 3 | 4);
          return;
        }
      }
    } catch {
      // ignore
    }

    // start new draft
    const newId = uid();
    setDraftId(newId);
    window.localStorage.setItem(STORAGE_KEYS.currentDraftId, newId);

    const base: VendorDraft = {
      id: newId,
      vendorUserId: 'demo_vendor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false,
      metadata: { name: '', category: 'Furniture', description: '', tags: [] },
      pricing: { currency: 'FCFA', price: 15000 },
      previewVersions: [],
      activeVersionId: '',
    };
    addVendorDraft(base);
  }, []);


  // Keep storage synced as user edits.
  useEffect(() => {
    if (!draftId) return;
    const drafts = getVendorDrafts();
    const existing = drafts.find((d) => d.id === draftId);
    if (!existing) return;

    const next: VendorDraft = {
      ...existing,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...existing.metadata,
        name,
        category,
        description,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 12),
      },
      pricing,
      previewVersions,
      activeVersionId,
    };

    // overwrite by delete+add (simple, small mock)
    addVendorDraft(next, { replace: true });
  }, [draftId, name, category, description, tags, pricing, previewVersions, activeVersionId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadError('');

    if (!file) {
      setSelectedFile(null);
      setStatus('');
      return;
    }

    if (!isAccepted3DFile(file)) {
      setSelectedFile(null);
      setUploadError('Only 3D model files are supported. Please upload a converted 3D file such as .glb, .gltf, .obj, .fbx, .stl, or .dae. Static images are not accepted.');
      setStatus('');
      return;
    }

    setSelectedFile(file);
    setStatus(`3D model ready to stage: ${file.name}`);
  };

  const canContinueStep1 = name.trim().length >= 2 && description.trim().length >= 10;
  const canContinueStep2 = pricing.price > 0 && pricing.currency.trim().length > 0;
  const canContinueStep3 = previewVersions.length > 0 || Boolean(selectedFile);
  const hasStaged3DFile = previewVersions.length > 0 || Boolean(selectedFile);

  const handleGenerate = () => {
    if (!selectedFile || isGenerating) return;

    setIsGenerating(true);
    setUploadError('');
    setStatus('Staging 3D file locally...');

    const version: PreviewVersion = {
      versionId: uid(),
      modelUrl: '',
      generatedAt: new Date().toISOString(),
      fileName: selectedFile.name,
      sourceType: '3d-upload',
    };

    setPreviewVersions((prev) => {
      const next = [...prev, version];
      return next.slice(-10);
    });

    setActiveVersionId(version.versionId);
    setStatus(`3D file staged for review: ${selectedFile.name}`);
    setIsGenerating(false);
  };

  const handlePublish = async () => {
    if (!draftId) return;
    const drafts = getVendorDrafts();
    const existing = drafts.find((d) => d.id === draftId);
    if (!existing) return;

    try {
      if (!selectedFile) throw new Error('Please choose a 3D file before publishing.');

      const form = new FormData();
      form.append('name', name);
      form.append('description', description);
      form.append('category', category);

      const tagArr = tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      for (const t of tagArr) form.append('tags', t);

      form.append('price', String(pricing.price));
      form.append('currency', pricing.currency);
      form.append('vendor_user_id', user?.id ? String(user.id) : '');
      form.append('asset_name', selectedFile.name);
      form.append('asset_type', selectedFile.type || 'application/octet-stream');
      form.append('asset_size', String(selectedFile.size));
      form.append('status', 'published');

      // Actual 3D bytes go in multipart.
      form.append('asset_file', selectedFile);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3001'}/api/products`, {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create product');
      }

      const published: VendorDraft = {
        ...existing,
        isPublished: true,
        updatedAt: new Date().toISOString(),
      };

      addVendorDraft(published, { replace: true });
      setStatus('Product saved to the database.');
      setStep(4);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create product';
      setStatus(message);
    }
  };

  const activePreviewUrl = activePreview?.modelUrl ?? '';

  return (
    <RequireAuth role="vendor">
      <div className="min-h-screen bg-transparent">
        <main className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link
                  href="/vendor/products"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-200"
                >
                  <ArrowLeft size={16} />
                  Back to catalog
                </Link>

                <p className="mt-6 text-sm uppercase tracking-[0.3em] text-blue-200">Create product</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Stage a 3D asset before publishing</h1>
                <p className="mt-4 max-w-2xl text-blue-100">
                  Draft your product metadata, set pricing, and upload a converted 3D file. Static images are not accepted.
                </p>
              </div>

              <div className="rounded-3xl border border-blue-300/50 bg-blue-500/30 p-5">
                <div className="flex items-center gap-3 text-white">
                  <Plus size={18} />
                  <span className="font-semibold">Step {step} of 4</span>
                </div>
                <div className="mt-3 text-xs text-blue-200">
                  Preview versions: <span className="font-semibold text-white">{previewVersions.length}</span>
                </div>
              </div>
            </div>

            {/* Stepper */}
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((s) => {
                const done = s < step;
                const active = s === step;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStep(s as 1 | 2 | 3 | 4)}
                    className={`rounded-3xl border px-4 py-4 text-left transition ${
                      active
                        ? 'border-sky-300 bg-sky-500/80 text-white'
                        : done
                          ? 'border-emerald-300 bg-emerald-800/80 text-white'
                          : 'border-blue-300/50 bg-blue-500/30 text-blue-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {done ? (
                        <CheckCircle2 size={16} className="text-emerald-300" />
                      ) : (
                        <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-blue-200'}`}>#{s}</span>
                      )}
                      <span className="text-xs font-semibold text-blue-200">
                        {s === 1 ? 'Metadata' : s === 2 ? 'Pricing' : s === 3 ? '3D Asset' : 'Review'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Steps content */}
            {step === 1 && (
              <section className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-[28px] border border-blue-200/50 bg-blue-600 p-6">
                  <h2 className="text-xl font-semibold text-white">1) Product metadata</h2>

                  <div className="mt-6 grid gap-4">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-blue-100">Name</span>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-blue-300/50 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                        placeholder="e.g. Royal Chair"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-blue-100">Category</span>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl border border-blue-300/50 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                      >
                        {Array.from(new Set(categories.map((c) => c.name))).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-blue-100">Description</span>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[120px] w-full resize-y rounded-xl border border-blue-300/50 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                        placeholder="A premium product description vendors would publish..."
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-blue-100">Tags (comma separated)</span>
                      <input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full rounded-xl border border-blue-300/50 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                        placeholder="chair, wood, premium"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[28px] border border-blue-200/50 bg-blue-50 p-6">
                  <h3 className="text-base font-semibold text-blue-900">Preview of what will be published</h3>
                  <div className="mt-4 space-y-4 rounded-3xl border border-blue-200/50 bg-white/80 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-blue-600">Name</p>
                      <p className="mt-2 text-sm font-semibold text-blue-900">{name.trim() || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-blue-600">Category</p>
                      <p className="mt-2 text-sm font-semibold text-blue-900">{category}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-blue-600">Tags</p>
                      <p className="mt-2 text-sm text-blue-700">
                        {tags.trim() ? tags : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl bg-white/80 border border-blue-200/50 p-4">
                    <p className="text-sm text-blue-700">
                      Continue when name and description look good.
                    </p>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!canContinueStep1}
                        className="w-full rounded-2xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Continue to Pricing <ChevronRight size={16} className="inline-block ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-[28px] border border-blue-200/50 bg-blue-600 p-6">
                  <h2 className="text-xl font-semibold text-white">2) Pricing</h2>

                  <div className="mt-6 grid gap-4">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-blue-100">Currency</span>
                      <input
                        value={pricing.currency}
                        onChange={(e) => setPricing((p) => ({ ...p, currency: e.target.value }))}
                        className="w-full rounded-xl border border-blue-300/50 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-blue-100">Price</span>
                      <input
                        type="number"
                        value={pricing.price}
                        min={0}
                        onChange={(e) => setPricing((p) => ({ ...p, price: Number(e.target.value || 0) }))}
                        className="w-full rounded-xl border border-blue-300/50 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/50"
                      />
                    </label>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 rounded-2xl border border-blue-300/50 bg-white px-4 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!canContinueStep2}
                      className="flex-1 rounded-2xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Continue to 3D Asset
                    </button>
                  </div>
                </div>

                <div className="rounded-[28px] border border-blue-200/50 bg-blue-50 p-6">
                  <h3 className="text-base font-semibold text-blue-900">What buyers will see</h3>
                  <div className="mt-4 rounded-3xl border border-blue-200/50 bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-blue-600">Price</p>
                    <p className="mt-2 text-lg font-semibold text-blue-900">
                      {formatPrice(pricing.currency, pricing.price)}
                    </p>
                  </div>
                  <p className="mt-4 text-sm text-blue-700">
                    You can re-stage multiple 3D assets before publishing.
                  </p>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-[28px] border border-blue-200/50 bg-blue-600 p-6">
                  <h2 className="text-xl font-semibold text-white">3) Upload 3D model</h2>
                  <p className="mt-2 text-sm text-blue-100">
                    Vendors must upload a converted 3D file. Static images are not supported.
                  </p>

                  <div className="mt-6 space-y-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-blue-100">Upload a 3D asset</span>
                      <div className="mt-2 border-2 border-dashed border-blue-300/50 rounded-xl p-6 text-center bg-blue-500/30">
                        <input
                          type="file"
                          className="hidden"
                          id="image-upload"
                          accept=".glb,.gltf,.obj,.fbx,.stl,.dae,model/gltf-binary,model/gltf+json,model/obj,model/fbx,application/octet-stream"
                          onChange={handleFileChange}
                        />
                        <label htmlFor="image-upload" className="cursor-pointer block">
                          <div className="flex items-center justify-center gap-2 text-blue-100">
                            <UploadCloud size={18} />
                            <span className="text-sm font-semibold">Choose 3D file</span>
                          </div>
                          <p className="mt-2 text-xs text-blue-200">
                            Accepted formats: GLB, GLTF, OBJ, FBX, STL, DAE.
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
                      className="w-full rounded-2xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                      {isGenerating ? 'Staging...' : 'Stage 3D file'}
                    </button>

                    {uploadError && <p className="text-sm font-semibold text-rose-200">{uploadError}</p>}
                    {status && <p className="text-sm text-blue-100">{status}</p>}
                    <p className="text-xs text-blue-200">
                      This is the frontend-only upload step. The selected 3D file will be sent to the database once the backend is connected.
                    </p>

                    <div className="rounded-2xl border border-blue-300/50 bg-blue-500/30 p-4">
                      <p className="text-sm font-semibold text-white">Current 3D asset</p>
                      <p className="mt-1 text-xs text-blue-200">
                        The staged file will be carried into the review step.
                      </p>
                      <div className="mt-3">
                        {activePreviewUrl ? (
                          <div className="h-[360px]">
                            <ModelViewer modelUrl={activePreviewUrl} />
                          </div>
                        ) : (
                          <div className="h-[360px] rounded-xl border border-blue-300/50 bg-white/70 flex items-center justify-center text-sm text-blue-200 px-4 text-center">
                            {previewVersions.length > 0
                              ? 'A 3D asset is staged locally for review.'
                              : 'No 3D file uploaded yet. Choose a converted 3D model to continue.'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-blue-200/50 bg-blue-50 p-6">
                  <h3 className="text-xl font-semibold text-blue-900">Staged 3D files</h3>
                  <p className="mt-2 text-sm text-blue-700">
                    Keep the selected 3D asset ready for review and publish. Static images will be rejected.
                  </p>

                  <div className="mt-6 space-y-3">
                    {previewVersions.length === 0 ? (
                      <div className="rounded-3xl border border-blue-200/50 bg-white/70 p-4 text-sm text-blue-600">
                        No 3D files staged yet.
                      </div>
                    ) : (
                      previewVersions
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
                                  ? 'border-sky-500 bg-sky-50'
                                  : 'border-slate-200 bg-white/70 hover:bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-blue-900">3D asset</p>
                                  <p className="mt-1 text-xs text-blue-600">
                                    {new Date(v.generatedAt).toLocaleString()}
                                  </p>
                                </div>
                                {isActive && (
                                  <CheckCircle2 size={18} className="text-sky-600 shrink-0" />
                                )}
                              </div>
                              <p className="mt-2 text-xs text-blue-500 break-all">
                                {v.fileName ? `File: ${v.fileName}` : 'Converted 3D file staged'}
                              </p>
                            </button>
                          );
                        })
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 rounded-2xl border border-blue-300/50 bg-white px-4 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      disabled={!canContinueStep3}
                      className="flex-1 rounded-2xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Review & Publish
                    </button>
                  </div>

                  {previewVersions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewVersions([]);
                        setActiveVersionId('');
                        setStatus('Cleared staged 3D files.');
                        setSelectedFile(null);
                      }}
                      disabled={previewVersions.length === 0 || isGenerating}
                      className="mt-4 w-full rounded-2xl border border-blue-300/50 bg-white px-4 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} />
                      Clear staged 3D files
                    </button>
                  )}
                </div>
              </section>
            )}

            {step === 4 && (
              <section className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-[28px] border border-blue-200/50 bg-blue-600 p-6">
                  <h2 className="text-xl font-semibold text-white">4) Review & publish</h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-blue-300/50 bg-blue-500/30 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-blue-200">Name</p>
                      <p className="mt-2 text-sm font-semibold text-white">{name}</p>
                    </div>
                    <div className="rounded-3xl border border-blue-300/50 bg-blue-500/30 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-blue-200">Price</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {formatPrice(pricing.currency, pricing.price)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl border border-blue-300/50 bg-blue-500/30 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-blue-200">Description</p>
                    <p className="mt-2 text-sm text-blue-100">{description}</p>
                  </div>

                  <div className="mt-4 rounded-3xl border border-blue-300/50 bg-blue-500/30 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-blue-200">3D asset</p>
                    {activePreview?.fileName ? (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-white">{activePreview.fileName}</p>
                        <p className="mt-2 text-sm text-blue-100">Uploaded as a converted 3D asset and ready for backend submission.</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-blue-200">No 3D asset staged yet.</p>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 rounded-2xl border border-blue-300/50 bg-white px-4 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                    >
                      Back to 3D upload
                    </button>
                    <button
                      type="button"
                      onClick={handlePublish}
            disabled={false}
                      className="flex-1 rounded-2xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Publish product
                    </button>
                  </div>
                </div>

                <div className="rounded-[28px] border border-blue-200/50 bg-blue-50 p-6">
                  <h3 className="text-xl font-semibold text-blue-900">After publish</h3>
                  <p className="mt-2 text-sm text-blue-700">
                    The new product will appear in <span className="font-semibold">/vendor/products</span> after publishing.
                    You can generate additional preview versions later from the edit flow (mock).
                  </p>

                  <div className="mt-6 rounded-3xl border border-blue-200/50 bg-white/70 p-4">
                    <p className="text-sm font-semibold text-blue-900">Staged 3D assets</p>
                    <p className="mt-2 text-sm text-blue-700">{previewVersions.length} total</p>
                    <p className="mt-1 text-xs text-blue-500">The newest staged asset remains active for review.</p>
                  </div>

                  <div className="mt-6">
                    <Link
                      href="/vendor/products"
                      className="block w-full rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-blue-900 border border-blue-300/50 hover:bg-blue-50 transition"
                    >
                      Go to vendor products
                    </Link>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}

