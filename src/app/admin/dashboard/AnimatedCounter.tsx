"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  target: number;
  duration?: number;
}

export default function AnimatedCounter({ target, duration = 1400 }: AnimatedCounterProps) {
  const [count, setCount] = useState(target); // start at target so SSR shows correct value
  const frameId = useRef<number>(0);

  useEffect(() => {
    // Reset and animate from 0 → target on mount or when target changes
    setCount(0);
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * target));
      if (progress < 1) {
        frameId.current = requestAnimationFrame(animate);
      } else {
        setCount(target); // ensure exact value at end
      }
    };

    if (target > 0) {
      frameId.current = requestAnimationFrame(animate);
    } else {
      setCount(0);
    }

    return () => cancelAnimationFrame(frameId.current);
  }, [target, duration]);

  return <>{count.toLocaleString()}</>;
}
