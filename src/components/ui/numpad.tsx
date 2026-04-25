import { motion } from "framer-motion";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumpadProps {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function Numpad({ onDigit, onBackspace, disabled }: NumpadProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {KEYS.map((k) => (
        <KeyButton key={k} onClick={() => onDigit(k)} disabled={disabled}>
          {k}
        </KeyButton>
      ))}
      <div /> {/* blank */}
      <KeyButton onClick={() => onDigit("0")} disabled={disabled}>
        0
      </KeyButton>
      <KeyButton onClick={onBackspace} disabled={disabled} aria-label="Backspace">
        <Delete className="h-5 w-5" />
      </KeyButton>
    </div>
  );
}

function KeyButton({
  children,
  onClick,
  disabled,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.04 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      className={cn(
        "h-14 rounded-2xl flex items-center justify-center text-[22px] font-bold text-white",
        "bg-white/10 border border-white/15 backdrop-blur-md",
        "hover:bg-sky-400/20 hover:border-sky-400/40",
        "active:shadow-[0_0_24px_rgba(56,189,248,0.5)]",
        "transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none"
      )}
    >
      {children}
    </motion.button>
  );
}
