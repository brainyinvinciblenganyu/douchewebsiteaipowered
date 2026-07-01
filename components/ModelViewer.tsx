'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Bounds } from '@react-three/drei';
import { Suspense } from 'react';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function ModelViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden rounded-xl bg-slate-100">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 2]}
        className="h-full w-full"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-5, -5, -5]} intensity={0.5} />

        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.2}>
            <Center>
              <Model url={modelUrl} />
            </Center>
          </Bounds>
        </Suspense>

        <OrbitControls
          enableZoom={true}
          autoRotate={false}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
