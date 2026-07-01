'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// Navbar and Footer provided via app/layout.tsx
import Image from 'next/image';
import { products } from '../../lib/mockData';
import { Box, Package, ShoppingBag, Table, Headphones } from 'lucide-react';

import VRShowroom from '../../components/VRShowroom';
const styles = `
  @keyframes slideInLeft {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(0); }
  }

  @keyframes slideInRight {
    0% { transform: translateX(100%); }
    100% { transform: translateX(0); }
  }

  @keyframes slideInCenter {
    0% { transform: translateY(-100%); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  @keyframes slideLtoR {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }

  @keyframes slideRtoL {
    0% { transform: translateX(100%); }
    50% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .slide-image-1 {
    animation: slideInLeft 1.2s ease-out forwards;
  }

  .slide-image-2 {
    animation: slideInCenter 1.4s ease-out forwards;
    animation-delay: 0.2s;
  }

  .slide-image-3 {
    animation: slideInRight 1.2s ease-out forwards;
    animation-delay: 0.4s;
  }

  .image-container {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    opacity: 0.3;
  }

  .text-overlay {
    position: relative;
    z-index: 10;
  }

  .animated-bg-image-1 {
    animation: slideLtoR 6s linear infinite;
  }

  .animated-bg-image-2 {
    animation: slideRtoL 8s linear infinite;
  }

  .animated-bg-image-3 {
    animation: slideLtoR 7s linear infinite;
  }

  .background-images-container {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
    opacity: 0.6;
    z-index: 1;
  }

  .background-images-container img {
    position: absolute;
    width: 200%;
    height: 100%;
    object-fit: cover;
    top: 0;
    left: 0;
  }

  @keyframes fadeInOut1 {
    0% { opacity: 1; }
    45% { opacity: 1; }
    50% { opacity: 0; }
    95% { opacity: 0; }
    100% { opacity: 1; }
  }

  @keyframes fadeInOut2 {
    0% { opacity: 0; }
    45% { opacity: 0; }
    50% { opacity: 1; }
    95% { opacity: 1; }
    100% { opacity: 0; }
  }

  .fade-hero-1 {
    animation: fadeInOut1 6s ease-in-out infinite;
  }

  .fade-hero-2 {
    animation: fadeInOut2 6s ease-in-out infinite;
  }
`;

const vrProducts = [
  { id: 1, name: "Car", price: 120000000, model: "bag.glb", icon: Box },
  { id: 2, name: "Royal Chair", price: 75000, model: "chair.glb", icon: Package },
  { id: 3, name: "Coffee Table", price: 8000, model: "coffee.glb", icon: Table },
  { id: 4, name: "Ferrari", price: 15000, model: "shirt.glb", icon: ShoppingBag },
];


// Background images for animation
const backgroundImages = [
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_Ab3p61z7HJSiiKlKi4A3DX53fR1IesmrhQ&s",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkUSWWIlkXoOp-G5JEeGfQvgq1eaWMLImO_A&s",
  "https://www.datocms-assets.com/153181/1744286611-hero_the-esg-playbook-for-shipping.jpg?dpr=0.75&fm=webp",
  "https://www.tebadul.com/storage/posts/76066a44d9251d871fd76a930c0d8587Cs2_529Ldg.jpg"
];

export default function VRPage() {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {/* Background Animation */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-gray-100">
        {backgroundImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={img}
              alt="Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
          </div>
        ))}
      </div>
      <main className="p-10 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#0058a3] to-blue-600 rounded-2xl p-12 mb-12 text-white text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 p-6 rounded-full relative w-36 h-36 flex items-center justify-center">
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSudTE4lCVSUu9P6rp4R5EYLZFBnkHMZVwlXw&s"
                alt="VR Showroom"
                className="w-24 h-24 fade-hero-1 absolute"
              />
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXUTWNEkA-cGbLMPXRTpPbBviK52aeXqy-cA&s"
                alt="VR Image 1"
                className="w-24 h-24 fade-hero-2 absolute"
              />
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3_BUwnbK3-RrvrYEC5dUBoCAP3IUpOWvWqw&s"
                alt="VR Image 2"
                className="w-24 h-24 fade-hero-1 absolute"
                style={{ animationDelay: '3s' }}
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">VR Showroom Experience</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-6">
            Step into our immersive virtual reality showroom. Explore products in life-like 3D environments 
            and experience shopping like never before.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => document.getElementById('explore-products')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-[#0058a3] px-8 py-3 rounded-lg font-semibold hover:scale-105 transition"
            >
              Enter VR Mode
            </button>
            <Link href="/products">
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#0058a3] transition">
                View Products
              </button>
            </Link>
          </div>
        </section>

        {/* VR Instructions */}
        <section className="bg-white rounded-2xl p-8 mb-12 shadow-lg">
          <h2 className="text-3xl font-bold text-[#0058a3] mb-8 text-center">How to Use VR Showroom</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/products">
              <div className="relative text-center p-6 bg-[#f5f7fa] rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-shadow flex flex-col justify-center min-h-96">
                {/* Animated background images */}
                <div className="background-images-container">
                  <img 
                    src="https://www.cometowestafrica.com/wp-content/uploads/2022/05/screenshot-1580370829g4kn8.jpg"
                    alt="VR Experience 1"
                    className="animated-bg-image-1"
                  />
                  <img 
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3C8lY8oDJIZQK_6gdEB9xHlMP5wnKcpOFVg&s"
                    alt="VR Experience 2"
                    className="animated-bg-image-2"
                    style={{ animationDelay: '2s' }}
                  />
                </div>
                {/* Content */}
                <div className="instruction-card-content">
                  <div className="bg-[#0058a3] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0058a3] mb-3">Select a Product</h3>
                  <p className="text-gray-700">Choose from our collection of 3D products</p>
                </div>
              </div>
            </Link>
            <div 
              className="text-center p-6 bg-[#f5f7fa] rounded-xl cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => document.getElementById('explore-products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <div className="bg-[#0058a3] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-[#0058a3] mb-4">Enter VR Mode</h3>
              {/* YouTube Video */}
              <div className="w-full h-64 rounded-lg overflow-hidden">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/1SofVCn4ucE?autoplay=0&controls=1&fs=1&modestbranding=1"
                  title="VR Showroom Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            <div className="relative text-center p-6 bg-[#f5f7fa] rounded-xl flex flex-col items-center justify-center min-h-96 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
              {/* Animated background images */}
              <div className="background-images-container">
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUJw38mG2Ne73I9ToTxZRmZUdlc7az3kYYIA&s"
                  alt="VR Experience 1"
                  className="animated-bg-image-1"
                />
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzDcz_-MQTj9xRO6tcv9iCf0VL3q5RaS6jKg&s"
                  alt="VR Experience 2"
                  className="animated-bg-image-2"
                  style={{ animationDelay: '2s' }}
                />
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUNYDjeYaTpeA90H5MPkU3xNG0_SXUowEnVg&s"
                  alt="VR Experience 3"
                  className="animated-bg-image-3"
                  style={{ animationDelay: '4s' }}
                />
              </div>
              {/* Content */}
              <div className="instruction-card-content">
                <div className="bg-[#0058a3] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-bold text-[#0058a3] mb-3">Explore & Interact</h3>
                <p className="text-gray-700">Use your VR headset or mouse to navigate and explore</p>
              </div>
            </div>
          </div>
        </section>

        {/* Product Selection */}
        <section id="explore-products">
          <h2 
            className="text-3xl font-bold text-white bg-gradient-to-r from-[#0058a3] to-blue-600 px-8 py-4 rounded-xl mb-8 inline-block cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Products in VR
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" id="product-grid">
            {vrProducts.map((product) => {
              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product.id)}
                  className={`bg-white group transition-all hover:shadow-xl flex flex-col cursor-pointer ${
                    selectedProduct === product.id
                      ? 'ring-4 ring-[#0058a3]'
                      : ''
                  }`}
                >
                        <div className="h-[300px] bg-[#f5f5f5] relative">
                          {
                            (() => {
                              const p = products.find(pr => pr.id === product.id);
                              const src = p?.images?.[0] || '/models/.keep';
                              return <Image src={src} alt={product.name} fill className="object-cover" />;
                            })()
                          }
                        </div>
                  
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-xl text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">3D Model</p>
                    <p className="text-2xl font-bold text-black flex items-start mb-4">
                      <span className="text-xs font-normal mt-1 mr-1">FCFA</span>
                      {product.price.toLocaleString()}
                    </p>

                    <Link href={`/product/${product.id}`} className="mt-auto" onClick={(e) => e.stopPropagation()}>
                      <button className="w-full bg-[#0058a3] text-white py-3 rounded-full font-bold hover:bg-blue-800 transition flex items-center justify-center">
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* VR Experience Preview */}
        {selectedProduct && (
          <section className="bg-gray-900 rounded-2xl p-4 md:p-10 mb-12 text-white">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-1/2 h-96 relative rounded-lg overflow-hidden">
                {(() => {
                  const p = products.find(pr => pr.id === selectedProduct);
                  const src = p?.images?.[0] || '/models/.keep';
                  return <Image src={src} alt={p?.name || 'Preview'} fill className="object-cover" />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold">{vrProducts.find(p => p.id === selectedProduct)?.name} - VR Preview</h2>
                  <button onClick={() => setSelectedProduct(null)} className="text-gray-300 hover:text-white text-2xl">✕</button>
                </div>
                <p className="mt-4 text-gray-200">This is a mock VR preview. 3D previews are available when the 3D assets are loaded — for now this shows a high-quality product image and an entry point for the VR experience.</p>
                <div className="mt-6">
                  <button className="bg-[#0058a3] text-white px-6 py-3 rounded-lg font-semibold">Enter VR Mode (placeholder)</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* VR Requirements */}
        <section className="bg-gradient-to-r from-[#0058a3] to-blue-600 rounded-2xl p-8 shadow-lg text-white">
          <h2 className="text-3xl font-bold mb-8 text-center">VR Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4 text-white">Supported VR Headsets</h3>
              <ul className="text-white space-y-3">
                <li className="flex items-start"><span className="mr-3">✓</span> Oculus Quest 2/3</li>
                <li className="flex items-start"><span className="mr-3">✓</span> HTC Vive</li>
                <li className="flex items-start"><span className="mr-3">✓</span> Valve Index</li>
                <li className="flex items-start"><span className="mr-3">✓</span> PlayStation VR</li>
                <li className="flex items-start"><span className="mr-3">✓</span> WebXR compatible devices</li>
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4 text-white">Browser Requirements</h3>
              <ul className="text-white space-y-3">
                <li className="flex items-start"><span className="mr-3">✓</span> Chrome 90+ (recommended)</li>
                <li className="flex items-start"><span className="mr-3">✓</span> Firefox 88+</li>
                <li className="flex items-start"><span className="mr-3">✓</span> Edge 90+</li>
                <li className="flex items-start"><span className="mr-3">✓</span> WebXR enabled</li>
                <li className="flex items-start"><span className="mr-3">✓</span> Modern GPU recommended</li>
                <li className="flex items-start"><span className="mr-3">✓</span> Secure Connection (HTTPS) required</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
