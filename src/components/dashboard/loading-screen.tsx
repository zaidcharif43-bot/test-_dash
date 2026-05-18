"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#021021] via-[#041025] to-[#061633]">
      <div className="flex flex-col items-center justify-center w-full h-full px-6 py-12">
        <div className="w-full max-w-[1400px] flex items-center justify-center">
          <div className="relative w-full">
            <div className="mx-auto relative w-[80vw] max-w-[1100px] h-auto drop-shadow-2xl" style={{height: 'auto', aspectRatio: '3 / 1'}}>
              <Image
                src="/logo.png"
                alt="Site logo"
                fill
                sizes="(max-width: 1100px) 80vw, 1100px"
                style={{ objectFit: "contain" }}
                priority
                quality={90}
              />
            </div>
            {/* Overlay caption removed as requested */}
          </div>
        </div>
      </div>
    </div>
  );
}
