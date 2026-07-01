'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Box, ShoppingBag, ArrowRight } from 'lucide-react';
import ModelViewer from './ModelViewer';
import Link from 'next/link';

interface Recommendation {
  id: string;
  name: string;
  price: string;
  image: string;
}

export default function AI3DGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [status, setStatus] = useState('');

  // Clean up object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (preview) URL.revokeObjectURL(preview);
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setGeneratedModelUrl(null);
      setRecommendations([]);
      setStatus('');
    }
  };

  const generate3DModel = async () => {
    if (!file) return;

    setIsGenerating(true);
    setStatus('Uploading image to AI engine...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/generate-3d', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      
      if (data.modelUrl) {
        setGeneratedModelUrl(data.modelUrl);
        setStatus('Generation complete!');
        
        // Simulate fetching recommendations based on the generated object
        // In a real app, the AI would return tags like "furniture" or "chair"
        setRecommendations([
          { id: '1', name: 'Matching Side Table', price: 'FCFA 45,000', image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=200' },
          { id: '2', name: 'Premium Seat Cushion', price: 'FCFA 12,500', image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=200' },
          { id: '3', name: 'African Print Throw', price: 'FCFA 18,000', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=200' },
        ]);

      } else {
        throw new Error('Failed to get model URL');
      }
    } catch (error) {
      console.error(error);
      setStatus('Error generating model. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-[#0058a3] mb-2">AI Image-to-3D Lab</h2>
        <p className="text-gray-600">Upload a clear photo of an object to create a personalized 3D model.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#0058a3] transition-colors cursor-pointer relative">
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileChange}
              accept="image/*"
              title="Upload image"
            />
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
              
            ) : (
              <div className="py-10">
                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-sm text-gray-500">Click or drag image to upload</p>
              </div>
            )}
          </div>

          <button
            onClick={generate3DModel}
            disabled={!file || isGenerating}
            className="w-full bg-[#0058a3] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Box size={20} />}
            {isGenerating ? 'Processing AI...' : 'Generate 3D Model'}
          </button>
          
          {status && <p className="text-center text-sm font-medium text-gray-600">{status}</p>}
        </div>

        {/* Result Section */}
        <div className="h-[400px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative">
          {generatedModelUrl ? (
            <ModelViewer modelUrl={generatedModelUrl} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
              <p>Your 3D model will appear here after generation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <ShoppingBag className="text-[#0058a3]" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Complete the Look</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {recommendations.map((item) => (
              <div key={item.id} className="group bg-gray-50 rounded-xl p-4 hover:shadow-md transition">
                <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-white">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">{item.name}</h4>
                <p className="text-[#0058a3] text-sm font-semibold mb-3">{item.price}</p>
                <Link 
                  href={`/products/${item.id}`}
                  className="flex items-center justify-between text-xs font-bold text-gray-500 hover:text-[#0058a3] transition"
                >
                  View Details
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 italic">Our AI suggested these products based on your generated model.</p>
          </div>
        </div>
      )}
    </div>
  );
}