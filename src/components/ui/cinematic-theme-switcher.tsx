"use client";

import { Sun, Moon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  delay: number;
  duration: number;
}

interface CinematicThemeSwitcherProps {
  className?: string;
}

export default function CinematicThemeSwitcher({ className }: CinematicThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const isDark = mounted && (theme === "dark" || resolvedTheme === "dark");

  useEffect(() => {
    setMounted(true);
  }, []);

  const generateParticles = () => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 3; i++) {
      newParticles.push({
        id: Date.now() + i,
        delay: i * 0.1,
        duration: 0.6 + i * 0.1,
      });
    }
    setParticles(newParticles);
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setParticles([]);
    }, 1000);
  };

  const handleToggle = () => {
    generateParticles();
    setTheme(isDark ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-9 w-[68px] rounded-full bg-muted/60 border border-border",
          className
        )}
      />
    );
  }

  return (
    <button
      ref={toggleRef}
      onClick={handleToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative h-9 w-[68px] rounded-full overflow-hidden",
        "border border-border/70",
        "transition-colors duration-500",
        isDark
          ? "bg-gradient-to-br from-slate-800 to-slate-950"
          : "bg-gradient-to-br from-sky-200 to-amber-100",
        "shadow-[inset_0_2px_6px_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.1)]",
        className
      )}
    >
      {/* Inner groove highlight */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.15) 100%)",
        }}
      />

      {/* Background icons */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
        <Sun
          className={cn(
            "h-3.5 w-3.5 transition-opacity duration-300",
            isDark ? "opacity-30 text-amber-300" : "opacity-0 text-amber-500"
          )}
        />
        <Moon
          className={cn(
            "h-3.5 w-3.5 transition-opacity duration-300",
            isDark ? "opacity-0 text-slate-300" : "opacity-40 text-slate-600"
          )}
        />
      </span>

      {/* Thumb */}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.8 }}
        className={cn(
          "absolute top-1 h-7 w-7 rounded-full flex items-center justify-center",
          "shadow-[0_2px_6px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.5)]",
          isDark
            ? "bg-gradient-to-br from-slate-200 to-slate-400"
            : "bg-gradient-to-br from-amber-300 to-amber-500"
        )}
        style={{
          left: isDark ? "calc(100% - 32px)" : "4px",
        }}
      >
        {/* Glossy shine */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.85), rgba(255,255,255,0) 55%)",
          }}
        />

        {/* Particle layer */}
        {isAnimating &&
          particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ scale: 0, opacity: 0.7 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ delay: p.delay, duration: p.duration, ease: "easeOut" }}
              className={cn(
                "absolute inset-0 rounded-full pointer-events-none",
                isDark ? "bg-slate-200/40" : "bg-amber-300/50"
              )}
            />
          ))}

        {/* Icon */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25 }}
            className="relative z-10"
          >
            {isDark ? (
              <Moon className="h-4 w-4 text-slate-700" strokeWidth={2.25} />
            ) : (
              <Sun className="h-4 w-4 text-amber-700" strokeWidth={2.25} />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
