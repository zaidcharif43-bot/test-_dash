"use client";

import { Float, MeshDistortMaterial, OrbitControls, Sphere, TorusKnot } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

function FloatingOrbs() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 2]} intensity={1.2} />
      <pointLight position={[-3, -1, 1]} intensity={0.8} color="#20a04d" />

      <Float speed={1.6} floatIntensity={2.2} rotationIntensity={1.2}>
        <TorusKnot args={[0.8, 0.28, 220, 24]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#0f6dff" metalness={0.6} roughness={0.18} />
        </TorusKnot>
      </Float>

      <Float speed={1.2} floatIntensity={1.8} rotationIntensity={0.8}>
        <Sphere args={[0.35, 64, 64]} position={[-1.8, 0.9, -0.5]}>
          <MeshDistortMaterial color="#20a04d" speed={2.8} distort={0.3} roughness={0.15} />
        </Sphere>
      </Float>

      <Float speed={1.3} floatIntensity={1.4} rotationIntensity={0.9}>
        <Sphere args={[0.3, 64, 64]} position={[1.6, -0.7, -0.8]}>
          <MeshDistortMaterial color="#ff8f1f" speed={3.2} distort={0.24} roughness={0.2} />
        </Sphere>
      </Float>

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={1.2} />
    </>
  );
}

export function Scene3D() {
  return (
    <div className="h-60 w-full overflow-hidden rounded-2xl border border-[color:var(--border)] bg-gradient-to-br from-white to-slate-100">
      <Canvas camera={{ position: [0, 0, 4.6], fov: 40 }}>
        <FloatingOrbs />
      </Canvas>
    </div>
  );
}
