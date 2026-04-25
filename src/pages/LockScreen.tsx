import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Sparkles } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { PinDot } from "@/components/ui/pin-dot";
import { Numpad } from "@/components/ui/numpad";
import { cn } from "@/lib/utils";

const PIN_LENGTH = 4;
const DEFAULT_PIN = "1234";

export default function LockScreen() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus hidden input on mount for keyboard typing
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-submit when PIN reaches required length
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      const t = setTimeout(() => attemptUnlock(pin), 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const attemptUnlock = (candidate: string) => {
    const stored = localStorage.getItem("tsa_pin") || DEFAULT_PIN;
    if (candidate === stored) {
      setSuccess(true);
      localStorage.setItem("tsa_locked", "false");
      setTimeout(() => navigate("/", { replace: true }), 600);
    } else {
      setError(true);
      setShake((s) => s + 1);
      setTimeout(() => {
        setPin("");
        setError(false);
        inputRef.current?.focus();
      }, 500);
    }
  };

  const handleDigit = (d: string) => {
    if (success) return;
    setPin((p) => (p.length < PIN_LENGTH ? p + d : p));
  };
  const handleBackspace = () => {
    if (success) return;
    setPin((p) => p.slice(0, -1));
  };

  return (
    <AuroraBackground className="h-screen">
      {/* Ambient particles */}
      {Array.from({ length: 7 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 4 + (i % 3) * 3,
            height: 4 + (i % 3) * 3,
            background: i % 2 === 0 ? "rgba(56,189,248,0.3)" : "rgba(167,139,250,0.25)",
            left: `${10 + i * 12}%`,
            top: `${15 + ((i * 17) % 70)}%`,
          }}
          animate={{
            y: [0, -20 - i * 4, 0],
            x: [0, (i % 2 === 0 ? 1 : -1) * 12, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 8 + i * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <AnimatePresence>
        {!success && (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <motion.div
              key={shake}
              animate={shake > 0 ? { x: [0, -12, 12, -12, 12, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div
                className={cn(
                  "animate-float relative w-[440px] max-w-[92vw] rounded-3xl p-12",
                  "bg-white/15 border border-white/30 backdrop-blur-2xl",
                  "shadow-[0_8px_32px_rgba(56,189,248,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]"
                )}
              >
                {/* Scanline overlay */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
                  }}
                />

                {/* Logo orb */}
                <div className="flex justify-center mb-6">
                  <div className="relative h-16 w-16">
                    <div
                      className="absolute inset-0 rounded-full animate-spin"
                      style={{
                        background:
                          "conic-gradient(from 0deg, #38BDF8, #6366F1, #8B5CF6, #38BDF8)",
                        animationDuration: "20s",
                        boxShadow: "0 0 24px rgba(56,189,248,0.6)",
                      }}
                    />
                    <div className="absolute inset-[3px] rounded-full bg-slate-950 flex items-center justify-center">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-center font-bold text-[26px] tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-violet-400">
                  Teacher Smart Assistant
                </h1>
                <p className="text-center text-[13px] text-white/60 mt-2">
                  Enter your access PIN to continue
                  <span className="inline-block w-[2px] h-3 ml-1 align-middle bg-sky-400 animate-blink" />
                </p>

                {/* PIN dots */}
                <div className="relative flex justify-center gap-5 mt-8 mb-7">
                  {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                    <PinDot key={i} filled={i < pin.length} error={error} />
                  ))}
                  {/* Hidden input — invisible but captures keyboard */}
                  <input
                    ref={inputRef}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={PIN_LENGTH}
                    value={pin}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
                      setPin(v);
                    }}
                    className="absolute inset-0 opacity-0 cursor-default"
                    autoFocus
                    aria-label="PIN"
                  />
                </div>

                {/* Numpad */}
                <Numpad onDigit={handleDigit} onBackspace={handleBackspace} disabled={success} />

                {/* Unlock button */}
                <motion.button
                  type="button"
                  onClick={() => attemptUnlock(pin)}
                  disabled={pin.length !== PIN_LENGTH}
                  whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "relative mt-5 w-full h-[52px] rounded-2xl overflow-hidden",
                    "bg-gradient-to-r from-sky-400 to-violet-500 text-white font-bold text-[15px] tracking-wide",
                    "shadow-[0_8px_24px_rgba(124,58,237,0.35)] disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {/* Shimmer */}
                  <span
                    className="absolute inset-0 animate-shimmer pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
                      backgroundSize: "200% 100%",
                    }}
                  />
                  <AnimatePresence mode="wait">
                    {pin.length === PIN_LENGTH ? (
                      <motion.span
                        key="unlock"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        className="relative z-10"
                      >
                        <Unlock className="h-4 w-4" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="lock"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        className="relative z-10"
                      >
                        <Lock className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span className="relative z-10">Unlock</span>
                </motion.button>

                {/* Helper text */}
                <p className="text-center text-[11px] text-white/40 mt-5">
                  Default PIN is{" "}
                  <span className="font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                    1234
                  </span>{" "}
                  — change it in Settings
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuroraBackground>
  );
}
