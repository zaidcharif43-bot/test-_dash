"use client";

import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls, Sphere, TorusKnot } from "@react-three/drei";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

function LoadingScene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 3]} intensity={1.5} />
      <pointLight position={[-2, 1, 2]} intensity={0.8} color="#0f6dff" />

      <Float speed={2} floatIntensity={2.5} rotationIntensity={1.4}>
        <TorusKnot args={[0.7, 0.25, 180, 20]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#0f6dff" metalness={0.7} roughness={0.15} emissive="#0f6dff" emissiveIntensity={0.2} />
        </TorusKnot>
      </Float>

      <Float speed={1.4} floatIntensity={1.8} rotationIntensity={0.7}>
        <Sphere args={[0.35, 128, 128]} position={[-1.2, 0.8, -0.6]}>
          <meshStandardMaterial color="#20a04d" metalness={0.5} roughness={0.2} emissive="#20a04d" emissiveIntensity={0.15} />
        </Sphere>
      </Float>

      <Float speed={1.6} floatIntensity={2.2} rotationIntensity={0.9}>
        <Sphere args={[0.28, 128, 128]} position={[1.4, -0.6, -0.7]}>
          <meshStandardMaterial color="#ff8f1f" metalness={0.4} roughness={0.25} emissive="#ff8f1f" emissiveIntensity={0.1} />
        </Sphere>
      </Float>

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.8} />
    </>
  );
}

interface LoadingScreenProps {
  duration?: number;
  onComplete?: () => void;
}

export function LoadingScreen({ duration = 2.8, onComplete }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
    >
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }}>
          <LoadingScene />
        </Canvas>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          <h1 className="mb-2 bg-gradient-to-r from-blue-300 via-green-300 to-orange-300 bg-clip-text text-4xl font-bold text-transparent">
            Intelligent Dashboard
          </h1>
          <p className="text-sm text-slate-300">Agency Control Center Loading...</p>
        </motion.div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 1.6, ease: "easeInOut" }}
          className="h-1 w-48 origin-left rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-orange-500"
        />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="text-xs text-slate-400"
        >
          Initializing ecosystem...
        </motion.p>
      </div>
    </motion.div>
  );
}
