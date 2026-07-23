

'use client';

// Navbar and Footer provided via app/layout.tsx
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, CreditCard, X } from 'lucide-react';
import ModelViewer from '../../components/ModelViewer';
import RequireAuth from '../../components/RequireAuth';

type LiveProduct = { id: string; name: string; price: number; asset_name: string | null };


interface CartItem {
  id: string;
  name: string;
  price: number;
  model: string;
  quantity: number;
  category?: string | null;
}

const backgroundImages = [
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_Ab3p61z7HJSiiKlKi4A3DX53fR1IesmrhQ&s",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkUSWWIlkXoOp-G5JEeGfQvgq1eaWMLImO_A&s",
  "https://www.datocms-assets.com/153181/1744286611-hero_the-esg-playbook-for-shipping.jpg?dpr=0.75&fm=webp",
  "https://www.tebadul.com/storage/posts/76066a44d9251d871fd76a930c0d8587Cs2_529Ldg.jpg"
];

export default function CartPage() {
  return (
    <RequireAuth>
      <CartPageContent />
    </RequireAuth>
  );
}

function CartPageContent() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [liveProductMap, setLiveProductMap] = useState<Map<number, { price: number; model: string }>>(
    () => new Map(),
  );

  const [isLoaded, setIsLoaded] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('douche_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);

        // Normalize legacy carts to the expected CartItem shape.
        // Some legacy carts may store product_id instead of id.
        const normalized: CartItem[] = Array.isArray(parsed)
          ? (parsed as any[])
              .map((it) => {
                const id = it?.id ?? it?.product_id ?? null;
                return {
                  id: id != null ? String(id) : '',
                  name: String(it?.name ?? ''),
                  price: Number(it?.price ?? 0),
                  model: String(it?.model ?? ''),
                  quantity: Number(it?.quantity ?? 1),
                };
              })
              // Prevent empty-id duplicates in React
              .filter((x) => Boolean(x.id))
          : [];

        setCartItems(normalized);
      } catch {
        setCartItems([
          { id: '2', name: "Royal Chair", price: 75000, model: "chair.glb", quantity: 1 },
          { id: '3', name: "Coffee Table", price: 8000, model: "coffee.glb", quantity: 2 },
        ]);
      }
    } else {
      // Default demo items if cart is empty/new
      setCartItems([
        { id: '2', name: "Royal Chair", price: 75000, model: "chair.glb", quantity: 1 },
        { id: '3', name: "Coffee Table", price: 8000, model: "coffee.glb", quantity: 2 },
      ]);
    }
    setIsLoaded(true);
  }, []);


  // Load live product details (real-time) to overwrite name/price/model
  useEffect(() => {
    if (!isLoaded) return;

    const ids = cartItems.map((x) => x.id);
    if (ids.length === 0) return;

    let alive = true;

    (async () => {
      try {
        const res = await fetch('/api/cart/items', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ productIds: ids }),
        });

        if (!res.ok) return;
        const data = (await res.json()) as { items?: Array<{ id: number; name: string; price: number; category?: string | null; asset_name?: string | null; model?: string | null }> };
        const items = Array.isArray(data.items) ? data.items : [];

        if (!alive) return;

        const map = new Map<string, { name: string; price: number; model: string; category: string | null }>();
        for (const p of items) {
          const model = (p.asset_name ? String(p.asset_name) : (p.model ? String(p.model) : 'chair.glb'));
          map.set(String(p.id), {
            name: String(p.name ?? ''),
            price: Number(p.price ?? 0),
            model,
            category: typeof p.category === 'string' ? p.category : null,
          });
        }

        setCartItems((prev) =>
          prev.map((ci) => {
            const live = map.get(ci.id);
            return live
              ? {
                  ...ci,
                  name: live.name || ci.name,
                  price: Number.isFinite(live.price) ? live.price : ci.price,
                  model: live.model || ci.model,
                  category: live.category ?? ci.category ?? null,
                }
              : ci;
          }),
        );

        setLiveProductMap(map as any);
      } catch {
        // ignore - cart will still show local values
      }
    })();

    return () => {
      alive = false;
    };
  }, [isLoaded]);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('douche_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);


  const updateQuantity = (id: string, delta: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const clearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      setCartItems([]);
    }
  };

  const handleSaveOrder = async () => {
    try {
      const items = cartItems.map((it) => ({
        productId: it.id,
        quantity: it.quantity,
        unitPrice: it.price,
      }));

      const body = {
        items,
        currency: 'FCFA',
        status: 'pending',
        total,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save order failed');

      setCartItems([]);
      alert(`Order saved! Order #${data.orderId}`);
      router.push('/orders');
    } catch (e) {
      console.error(e);
      alert('Save order failed. Please try again.');
    }
  };

  const handleCheckout = async () => {
    try {
      const items = cartItems.map((it) => ({
        productId: it.id,
        quantity: it.quantity,
        unitPrice: it.price,
      }));

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          total,
          currency: 'FCFA',
          status: 'confirmed',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Checkout failed');
      }

      // Clear cart and refresh UX
      setCartItems([]);
      alert(`Checkout complete! Order #${data.orderId}`);
    } catch (e) {
      console.error(e);
      alert('Checkout failed. Please try again.');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = cartItems.length > 0 ? 5000 : 0;
  const total = subtotal + shipping;

  if (!isLoaded) {
    return (
      <main className="p-10 max-w-6xl mx-auto min-h-[60vh] flex items-center justify-center">
        <div className="text-[#0058a3] animate-pulse font-semibold text-xl">Loading your cart...</div>
      </main>
    );
  }

  return (
    <>
      {/* Background Animation */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-gray-100">
        {backgroundImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image src={img} alt="Background" fill className="object-cover" />
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
          </div>
        ))}
      </div>
      <main className="p-10 max-w-6xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[#0058a3]">Shopping Cart</h1>
          {cartItems.length > 0 && (
<button 
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 transition"
            >
              <X size={20} />
              Clear Cart
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg">
            <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start adding products to your cart!</p>
            <Link href="/products">
<button className="bg-[#0058a3] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#0058a3] transition">
                Browse Products
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
                  {cartItems.map((item, index) => (
                <div key={String(item.id ?? `cart-${index}`)} className="rounded-[28px] bg-white p-6 shadow-md border border-gray-100 flex flex-col md:flex-row gap-8">

                  {/* Product 3D Preview */}
                  <Link
                    href={`/product/${item.id}`}
                    className="w-full md:w-64 h-64 flex-shrink-0 rounded-2xl bg-[#f5f5f5] relative overflow-hidden block"
                  >
                    <ModelViewer modelUrl={item.model ? `/models/${item.model}` : '/models/chair.glb'} />
                  </Link>


                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {item.category && (
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0058a3] mb-2">
                          {item.category}
                        </p>
                      )}
                      <Link href={`/product/${item.id}`} className="block">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1 hover:text-[#0058a3] transition">{item.name}</h3>
                      </Link>
                      <p className="text-gray-500 text-sm mb-3">3D Model &middot; Interactive preview available</p>
                      <p className="text-3xl font-bold text-black flex items-start mb-4">
                        <span className="text-sm font-normal mt-1.5 mr-1.5">FCFA</span>
                        {item.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button
onClick={() => updateQuantity(item.id, -1)}
                          className="bg-[#0058a3] text-white hover:bg-[#0058a3] p-2.5 rounded-xl transition shadow-sm"
                        >
                          <Minus size={18} />
                          <span className="sr-only">Decrease quantity</span>
                        </button>
                        <span className="text-lg font-bold w-8 text-center text-[#0058a3]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="bg-[#0058a3] text-white hover:bg-blue-700 p-2.5 rounded-xl transition shadow-sm"
                        >
                          <Plus size={18} />
                          <span className="sr-only">Increase quantity</span>
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-2.5 hover:bg-red-50 rounded-xl transition"
                      >
                        <Trash2 size={20} />
                        <span className="sr-only">Remove item</span>
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right md:min-w-[140px]">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Subtotal</p>
                    <p className="text-2xl font-bold text-gray-800">
                      FCFA {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 shadow-lg sticky top-24 border border-gray-100">
                <h2 className="text-2xl font-bold text-[#0058a3] mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">FCFA {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span className="font-semibold">FCFA {shipping.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between text-xl font-bold text-[#0058a3]">
                    <span>Total</span>
                    <span>FCFA {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                <button
                  onClick={handleSaveOrder}
                  className="w-full bg-white border border-[#0058a3] text-[#0058a3] py-4 rounded-lg font-semibold text-lg hover:bg-[#0058a3]/5 transition flex items-center justify-center gap-2 shadow-sm"
                >
                  Save Order
                </button>
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-[#0058a3] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#0058a3] transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <CreditCard size={20} />
                  Proceed to Checkout
                </button>
                </div>

                <Link href="/products">
                  <button className="w-full border-2 border-[#0058a3] text-[#0058a3] py-3 rounded-lg font-semibold hover:bg-[#0058a3] hover:text-white transition">
                    Continue Shopping
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      
    </>
  );
}
