'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { Sparkles, Globe, Users, Target } from 'lucide-react';

const backgroundImages = [
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_Ab3p61z7HJSiiKlKi4A3DX53fR1IesmrhQ&s",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkUSWWIlkXoOp-G5JEeGfQvgq1eaWMLImO_A&s",
  "https://www.datocms-assets.com/153181/1744286611-hero_the-esg-playbook-for-shipping.jpg?dpr=0.75&fm=webp",
  "https://www.tebadul.com/storage/posts/76066a44d9251d871fd76a930c0d8587Cs2_529Ldg.jpg"
];

export default function AboutPage() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
            <img
              src={img}
              alt="Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
          </div>
        ))}
      </div>

      

      <main className="p-10 max-w-6xl mx-auto relative z-10">
        {/* Hero Section */}
        <section className="text-center mb-16 rounded-[32px] bg-[#0058a3] text-white p-12 shadow-lg shadow-slate-900/10">
          <h1 className="text-5xl font-bold mb-4">
            About Douche
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed">
            Revolutionizing African e-commerce through immersive 3D visualization and virtual reality experiences.
          </p>
        </section>

        {/* Mission Section */}
        <section className="bg-white/90 backdrop-blur-sm rounded-2xl p-10 mb-12 shadow-lg">
          <div className="flex items-start gap-6">
            <div className="bg-[#0058a3] p-4 rounded-xl">
              <Target className="text-white" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#0058a3] mb-4">Our Mission</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                To bring African products to the global marketplace through cutting-edge technology. 
                We combine AI-powered 3D modeling, virtual reality, and traditional e-commerce to create 
                an unparalleled shopping experience that showcases the beauty and quality of African craftsmanship.
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0058a3] mb-8 text-center">Why Choose Douche?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-[#0058a3] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#0058a3] mb-2">3D Visualization</h3>
              <p className="text-gray-600">
                Explore products in stunning 3D detail. Rotate, zoom, and interact with every item before you buy.
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-[#0058a3] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Globe className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#0058a3] mb-2">VR Showroom</h3>
              <p className="text-gray-600">
                Step into our virtual reality showroom and experience products as if they were right in front of you.
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-[#0058a3] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#0058a3] mb-2">African Heritage</h3>
              <p className="text-gray-600">
                Supporting African artisans and businesses by bringing their products to a global audience.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="bg-white/90 backdrop-blur-sm rounded-2xl p-10 mb-12 shadow-lg">
          <h2 className="text-3xl font-bold text-[#0058a3] mb-6">Our Story</h2>
          <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
            <p>
              Douche was born from a vision to bridge the gap between African artisans and global consumers. 
              We recognized that traditional e-commerce platforms couldn't fully capture the beauty and craftsmanship 
              of African products.
            </p>
            <p>
              By leveraging advanced 3D modeling and VR technology, we've created a platform where customers can 
              truly experience products before purchasing. Whether it's handcrafted furniture, traditional textiles, 
              or contemporary African fashion, every product is presented in its full glory.
            </p>
            <p>
              Today, Douche stands as a testament to innovation in e-commerce, combining technology with tradition 
              to create something truly special.
            </p>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-16 bg-white/90 backdrop-blur-sm rounded-2xl p-10 shadow-lg">
          <h2 className="text-3xl font-bold text-[#0058a3] mb-8 text-center">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "ENGR.KAH KISSINGER", role: "CEO, Innovative Tech, project Manager", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyoAGem8obilgKKonsw89hAZR32iCbNDSv8R1MAnzWVRvINtxwa0C6_ps&s=10" },
              { name: "NGANYU BRANDON", role: "Software Engineering Student & Web Developer", img: "https://scontent-los4-1.xx.fbcdn.net/v/t39.30808-6/449388383_1641209413337625_4800909064096925221_n.jpg?stp=dst-jpg_tt6&cstp=mx320x326&ctp=s320x326&_nc_cat=110&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=xg9e2bWcz_oQ7kNvwHvT2u8&_nc_oc=AdpAba_b9SIyvfS0JLEZqyXHYrVcqnoeGUrBNs-vWgqmm0-pVrqZsg8rwwlQDJChpPLqknLlpAjqTUKbib5T1d5j&_nc_zt=23&_nc_ht=scontent-los4-1.xx&_nc_gid=4bR91Wsv0zCB9VnzUuHLRQ&_nc_ss=7b289&oh=00_Af8GDvpWdL5FGFpiWPDaRiO4zflTQoBY8RSCZglKqAH0Bw&oe=6A4729E6", position: "object-top" },
              { name: "Dr. Nde Nguti", role: "Project Supervisor, Faculty Member (VICE DEAN) at FET,UB", img: "https://media.licdn.com/dms/image/v2/C5603AQERR8Zt2l4Dvw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1552562848958?e=2147483647&v=beta&t=bq90-C2riNOw87yK4uOQaioxPiGDCecAcdaV_mUd5Qw" },
              { name: "BESHE JACKSON", role: "Contractor and Roofing Specialist, Project Sponsor", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyoAGem8obilgKKonsw89hAZR32iCbNDSv8R1MAnzWVRvINtxwa0C6_ps&s=10" }
            ].map((member, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition text-center group border border-gray-100">
                <div className="h-64 overflow-hidden">
                  <img 
                    src={member.img} 
                    alt={member.name} 
                    className={`w-full h-full object-cover group-hover:scale-110 transition duration-500 ${member.position || 'object-center'}`}
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl text-[#0058a3] mb-1">{member.name}</h3>
                  <p className="text-gray-600">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/careers" className="btn-primary">
              Join Our Team
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-[#0058a3] text-white rounded-2xl p-10">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-lg mb-6 opacity-90">
            Discover our collection of African products in 3D and VR
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/products">
              <button className="bg-white text-[#0058a3] px-8 py-3 rounded-lg font-semibold hover:scale-105 transition">
                Browse Products
              </button>
            </Link>
            <Link href="/vr">
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#0058a3] transition">
                Enter VR Showroom
              </button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
