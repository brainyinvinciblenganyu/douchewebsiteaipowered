'use client';

import { Canvas } from '@react-three/fiber';
import { VRButton, XR, Controllers, Hands } from '@react-three/xr';
import { OrbitControls, useGLTF, Html, useProgress } from '@react-three/drei';
import { Suspense } from 'react';

function Product({
  modelPath,
  position,
}: {
  modelPath: string;
  position: [number, number, number];
}) {
  const { scene } = useGLTF(modelPath);
  return <primitive object={scene} position={position} scale={1} />;
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center bg-black/70 p-4 rounded-xl backdrop-blur-sm text-white min-w-[120px]">
        <div className="w-8 h-8 border-4 border-[#0058a3] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm font-bold">{progress.toFixed(0)}% loaded</p>
      </div>
    </Html>
  );
}

export default function VRShowroom({ modelUrl }: { modelUrl?: string }) {
  return (
    <div className="relative w-full h-[600px] bg-gray-900 rounded-xl overflow-hidden">
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <VRButton className="bg-white text-black px-4 py-2 rounded-full font-bold" />
      </div>

      <Canvas camera={{ position: [0, 1.5, 4], fov: 60 }}>
        <XR>
          <Controllers />
          <Hands />

          {/* Slightly richer lighting for better 3D depth */}
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={1.2} />
          <pointLight position={[-5, 3, 2]} intensity={0.6} />

          {/* Ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#333" />
          </mesh>

          <Suspense fallback={<Loader />}>
            {modelUrl ? (
              <Product modelPath={modelUrl} position={[0, -1.5, -2]} />
            ) : (
              <>
                <Product modelPath="/models/chair.glb" position={[-2, -1.5, -2]} />
                <Product modelPath="/models/coffee.glb" position={[2, -1.5, -2]} />
                <Product modelPath="/models/bag.glb" position={[0, -1, 1]} />
              </>
            )}
          </Suspense>

          {/* Orbit controls for non‑VR users */}
          <OrbitControls />
        </XR>
      </Canvas>
    </div>
  );
}