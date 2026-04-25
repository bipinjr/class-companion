import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

/**
 * Animated aurora background — soft sky/indigo/violet gradients drift slowly.
 * Used on the LockScreen for a premium, futuristic feel.
 */
export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col h-screen w-full items-center justify-center bg-slate-950 text-slate-50 overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            `pointer-events-none absolute -inset-[10px] opacity-60 blur-[10px] will-change-transform`,
            `[--white-gradient:repeating-linear-gradient(100deg,rgba(255,255,255,0.6)_0%,rgba(255,255,255,0.6)_7%,transparent_10%,transparent_12%,rgba(255,255,255,0.6)_16%)]`,
            `[--dark-gradient:repeating-linear-gradient(100deg,rgba(2,6,23,0.6)_0%,rgba(2,6,23,0.6)_7%,transparent_10%,transparent_12%,rgba(2,6,23,0.6)_16%)]`,
            `[--aurora:repeating-linear-gradient(100deg,#38BDF8_10%,#818CF8_15%,#7C3AED_20%,#22D3EE_25%,#A78BFA_30%)]`,
            `[background-image:var(--dark-gradient),var(--aurora)]`,
            `[background-size:300%,_200%] [background-position:50%_50%,50%_50%]`,
            `after:content-[""] after:absolute after:inset-0`,
            `after:[background-image:var(--dark-gradient),var(--aurora)]`,
            `after:[background-size:200%,_100%] after:[background-attachment:fixed] after:mix-blend-difference`,
            `animate-aurora`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
          )}
        />
      </div>
      {children}
    </div>
  );
};
