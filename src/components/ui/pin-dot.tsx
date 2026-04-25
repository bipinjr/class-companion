import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PinDotProps {
  filled: boolean;
  error?: boolean;
}

export function PinDot({ filled, error }: PinDotProps) {
  return (
    <motion.div
      initial={false}
      animate={{
        scale: filled ? 1.15 : 1,
        backgroundColor: error
          ? "#EF4444"
          : filled
          ? "#38BDF8"
          : "rgba(255,255,255,0)",
        borderColor: error
          ? "#EF4444"
          : filled
          ? "#38BDF8"
          : "rgba(148,163,184,0.5)",
        boxShadow: filled && !error ? "0 0 12px #38BDF8" : "0 0 0px transparent",
      }}
      transition={{ type: "spring", stiffness: 380, damping: 18 }}
      className={cn("h-[18px] w-[18px] rounded-full border-2")}
    />
  );
}
