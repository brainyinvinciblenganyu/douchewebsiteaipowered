'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';

const locations = [
  {
    id: 1,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStcWNQrmtOWNzFdsqTJ6Z7eYaQInvd8ghvng&s',
    title: 'Douala Headquarters',
    description: 'Our main office in the heart of Douala.',
  },
  {
    id: 2,
    image: 'https://c8.alamy.com/comp/CWGP40/douala-cameroon-akwa-CWGP40.jpg',
    title: 'Akwa Branch',
    description: 'Conveniently located in the Akwa district.',
  },
  {
    id: 3,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1YMcxIxw8JTAvj1B8ZwV5e5ZDgOd4SGuhfg&s',
    title: 'Customer Service',
    description: 'Visit us for all your support needs.',
  },
  {
    id: 4,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZu-leo6E2pBslwY7p_byIi_lw69P-Y9QWHQ&s',
    title: 'Buea Branch',
    description: 'Experience our services in the Buea city.located at UB junction,MITACUL building',
  },
  {
    id: 5,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQc2n17kXOdeQpyp5t47qXB26hy1MhLL7TGIg&s',
    title: 'Buea Regional Office',
    description: 'Serving the  city with excellence.',
  },
  {
    id: 6,
    image: 'https://mitaccul.org/wp-content/uploads/2025/05/Buea-memba-scaled.jpg',
    title: 'Buea Branch',
    description: 'Located at the foot of Mount Cameroon.',
  },
];

export default function VisitUsOnsite() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % locations.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    
    <section className="py-20 bg-gray-50">
      <div className="w-full">
        <motion.h2 
          className="text-center text-4xl font-bold mb-16 text-[#0058a3]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Visit Us Onsite
        </motion.h2>
        
        <div className="relative h-[600px] w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-white">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={locations[currentIndex].id}
              className="absolute inset-0 w-full h-full"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ 
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
            >
              <div className="relative w-full h-full group cursor-pointer">
                <motion.img 
                  src={locations[currentIndex].image} 
                  alt={locations[currentIndex].title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 w-full p-10 text-white">
                  <motion.h3 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-bold mb-3"
                  >
                    {locations[currentIndex].title}
                  </motion.h3>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-200 text-xl"
                  >
                    {locations[currentIndex].description}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-3 mt-8">
            {locations.map((_, idx) => (
                <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-3 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-[#0058a3]' : 'w-3 bg-gray-300 hover:bg-gray-400'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                />
            ))}
        </div>
      </div>
    </section>
  );
}