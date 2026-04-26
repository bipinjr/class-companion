"use client";
import { MeshGradient, DotOrbit } from "@paper-design/shaders-react";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Deep blue-black mesh gradient base */}
      <MeshGradient
        className="absolute inset-0 w-full h-full"
        colors={["#05070d", "#0b1226", "#0a1f3d", "#1a0b3d", "#05070d"]}
        speed={0.18}
        distortion={0.85}
        swirl={0.35}
      />

      {/* Subtle dot orbit layered on top */}
      <div className="absolute inset-0 opacity-[0.18] mix-blend-screen">
        <DotOrbit
          className="absolute inset-0 w-full h-full"
          colors={["#3b7feb", "#7c3aed", "#22d3ee"]}
          speed={0.4}
          dotSize={0.6}
          spacing={0.18}
        />
      </div>

      {/* Ambient glow orbs */}
      <div className="absolute top-[-10%] left-[-5%] h-[480px] w-[480px] rounded-full bg-[#3b7feb]/20 blur-[140px]" />
      <div className="absolute bottom-[-15%] right-[-10%] h-[560px] w-[560px] rounded-full bg-[#7c3aed]/20 blur-[160px]" />
      <div className="absolute top-[40%] left-[30%] h-[320px] w-[320px] rounded-full bg-[#22d3ee]/10 blur-[120px]" />

      {/* Soft vignette to keep text readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  );
}
