"use client";

import React, { useRef, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Sparkles } from "lucide-react";

export const WovenLightHero = () => {
  const textControls = useAnimation();
  const buttonControls = useAnimation();
  const navigate = useNavigate();

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    textControls.start((i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1 + 1.2,
        duration: 1.1,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    }));
    buttonControls.start({
      opacity: 1,
      transition: { delay: 2.3, duration: 1 },
    });

    return () => {
      if (link.parentNode) document.head.removeChild(link);
    };
  }, [textControls, buttonControls]);

  const headline = "Smart Assistant";

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      <WovenCanvas />
      <HeroNav />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1
          className="flex flex-wrap justify-center text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {headline.split(" ").map((word, i) => (
            <span key={i} className="inline-flex overflow-hidden">
              {word.split("").map((char, j) => (
                <motion.span
                  key={j}
                  custom={i * 10 + j}
                  initial={{ opacity: 0, y: 60 }}
                  animate={textControls}
                  className="inline-block bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent"
                >
                  {char}
                </motion.span>
              ))}
              {i < headline.split(" ").length - 1 && (
                <span className="inline-block w-3 md:w-5" />
              )}
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="mt-6 max-w-xl text-base md:text-lg text-muted-foreground"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          An interactive tapestry of light and motion — your teaching companion,
          crafted with code and creativity.
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={buttonControls} className="mt-10">
          <button
            onClick={() => navigate("/")}
            className="group relative inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-8 py-3 text-sm font-medium tracking-wide backdrop-blur-md transition-all hover:bg-card/70 hover:scale-[1.03]"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Enter the Weave</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const HeroNav = () => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
      <div className="flex items-center gap-2 text-foreground/90">
        <span className="text-2xl leading-none">⎎</span>
        <span
          className="text-base font-semibold tracking-wide"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Woven
        </span>
      </div>
    </nav>
  );
};

const WovenCanvas = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();
    const isDarkMode = resolvedTheme === "dark";

    const particleCount = 25000;
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    const geometry = new THREE.BufferGeometry();
    const torusKnot = new THREE.TorusKnotGeometry(1.5, 0.5, 200, 32);
    const posAttr = torusKnot.attributes.position;

    for (let i = 0; i < particleCount; i++) {
      const vertexIndex = i % posAttr.count;
      const x = posAttr.getX(vertexIndex);
      const y = posAttr.getY(vertexIndex);
      const z = posAttr.getZ(vertexIndex);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      const color = new THREE.Color();
      // Sky/violet palette
      const hue = 0.55 + Math.random() * 0.2;
      color.setHSL(hue, 0.7, isDarkMode ? 0.55 : 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: isDarkMode ? 0.9 : 0.75,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let frameId = 0;
    const tmpPos = new THREE.Vector3();
    const tmpOrig = new THREE.Vector3();
    const tmpVel = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const mouseWorld = new THREE.Vector3();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      mouseWorld.set(mouse.x * 3, mouse.y * 3, 0);

      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3;
        const iy = ix + 1;
        const iz = ix + 2;
        tmpPos.set(positions[ix], positions[iy], positions[iz]);
        tmpOrig.set(originalPositions[ix], originalPositions[iy], originalPositions[iz]);
        tmpVel.set(velocities[ix], velocities[iy], velocities[iz]);

        const dist = tmpPos.distanceTo(mouseWorld);
        if (dist < 1.5) {
          const force = (1.5 - dist) * 0.01;
          dir.subVectors(tmpPos, mouseWorld).normalize().multiplyScalar(force);
          tmpVel.add(dir);
        }
        dir.subVectors(tmpOrig, tmpPos).multiplyScalar(0.001);
        tmpVel.add(dir);
        tmpVel.multiplyScalar(0.95);

        positions[ix] += tmpVel.x;
        positions[iy] += tmpVel.y;
        positions[iz] += tmpVel.z;
        velocities[ix] = tmpVel.x;
        velocities[iy] = tmpVel.y;
        velocities[iz] = tmpVel.z;
      }
      geometry.attributes.position.needsUpdate = true;
      points.rotation.y = elapsed * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      torusKnot.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [resolvedTheme]);

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
};
