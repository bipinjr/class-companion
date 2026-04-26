import React, { useEffect, useRef } from 'react';

interface StarfieldProps {
  starColor?: string;
  bgColor?: string;
  easing?: number;
  hyperspace?: boolean;
  warpFactor?: number;
  opacity?: number;
  speed?: number;
  quantity?: number;
}

const Starfield: React.FC<StarfieldProps> = ({
  starColor = 'rgba(255,255,255,0.8)',
  bgColor = 'rgba(0,0,0,1)',
  easing = 1,
  hyperspace = false,
  warpFactor = 10,
  opacity = 0.1,
  speed = 0.8,
  quantity = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const cursor = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const sd = useRef<any>({
    w: 0,
    h: 0,
    ctx: null as CanvasRenderingContext2D | null,
    cw: 0,
    ch: 0,
    x: 0,
    y: 0,
    z: 0,
    star: { colorRatio: 0, arr: [] as number[][] },
    prevTime: 0,
  });

  const colors = { fill: hyperspace ? `rgba(0,0,0,${opacity})` : bgColor };
  const compSpeed = hyperspace ? speed * warpFactor : speed;
  const ratio = quantity / 2;

  const measureViewport = () => {
    const el = canvasRef.current?.parentElement;
    if (el) {
      sd.current.w = el.clientWidth;
      sd.current.h = el.clientHeight;
      sd.current.x = Math.round(sd.current.w / 2);
      sd.current.y = Math.round(sd.current.h / 2);
      sd.current.z = (sd.current.w + sd.current.h) / 2;
      sd.current.star.colorRatio = 1 / sd.current.z;
      if (cursor.current.x === 0 || cursor.current.y === 0) {
        cursor.current.x = sd.current.x;
        cursor.current.y = sd.current.y;
      }
      if (mouse.current.x === 0 || mouse.current.y === 0) {
        mouse.current.x = cursor.current.x - sd.current.x;
        mouse.current.y = cursor.current.y - sd.current.y;
      }
    }
  };

  const setupCanvas = () => {
    measureViewport();
    const canvas = canvasRef.current;
    if (canvas) {
      sd.current.ctx = canvas.getContext('2d');
      canvas.width = sd.current.w;
      canvas.height = sd.current.h;
      if (sd.current.ctx) {
        sd.current.ctx.fillStyle = colors.fill;
        sd.current.ctx.strokeStyle = starColor;
      }
    }
  };

  const bigBang = () => {
    if (sd.current.star.arr.length !== quantity) {
      sd.current.star.arr = new Array(quantity).fill(null).map(() => [
        Math.random() * sd.current.w * 2 - sd.current.x * 2,
        Math.random() * sd.current.h * 2 - sd.current.y * 2,
        Math.round(Math.random() * sd.current.z),
        0,
        0,
        0,
        0,
        1,
      ]);
    }
  };

  const resize = () => {
    const oldStar = { ...sd.current.star, arr: [...sd.current.star.arr] };
    measureViewport();
    if (!sd.current.ctx) return;
    sd.current.cw = sd.current.ctx.canvas.width;
    sd.current.ch = sd.current.ctx.canvas.height;
    if (sd.current.cw !== sd.current.w || sd.current.ch !== sd.current.h) {
      sd.current.x = Math.round(sd.current.w / 2);
      sd.current.y = Math.round(sd.current.h / 2);
      sd.current.z = (sd.current.w + sd.current.h) / 2;
      sd.current.star.colorRatio = 1 / sd.current.z;
      const rw = sd.current.cw ? sd.current.w / sd.current.cw : 1;
      const rh = sd.current.ch ? sd.current.h / sd.current.ch : 1;
      sd.current.ctx.canvas.width = sd.current.w;
      sd.current.ctx.canvas.height = sd.current.h;
      if (!sd.current.star.arr.length) {
        bigBang();
      } else {
        sd.current.star.arr = sd.current.star.arr.map((star: number[], i: number) => {
          const newStar = [...star];
          newStar[0] = oldStar.arr[i][0] * rw;
          newStar[1] = oldStar.arr[i][1] * rh;
          newStar[3] = sd.current.x + (newStar[0] / newStar[2]) * ratio;
          newStar[4] = sd.current.y + (newStar[1] / newStar[2]) * ratio;
          return newStar;
        });
      }
      sd.current.ctx.fillStyle = colors.fill;
      sd.current.ctx.strokeStyle = starColor;
    }
  };

  const update = () => {
    mouse.current.x = (cursor.current.x - sd.current.x) / easing;
    mouse.current.y = (cursor.current.y - sd.current.y) / easing;
    if (sd.current.star.arr.length > 0) {
      sd.current.star.arr = sd.current.star.arr.map((star: number[]) => {
        const newStar = [...star];
        newStar[7] = 1;
        newStar[5] = newStar[3];
        newStar[6] = newStar[4];
        newStar[0] += mouse.current.x >> 4;
        if (newStar[0] > sd.current.x << 1) {
          newStar[0] -= sd.current.w << 1;
          newStar[7] = 0;
        }
        if (newStar[0] < -sd.current.x << 1) {
          newStar[0] += sd.current.w << 1;
          newStar[7] = 0;
        }
        newStar[1] += mouse.current.y >> 4;
        if (newStar[1] > sd.current.y << 1) {
          newStar[1] -= sd.current.h << 1;
          newStar[7] = 0;
        }
        if (newStar[1] < -sd.current.y << 1) {
          newStar[1] += sd.current.h << 1;
          newStar[7] = 0;
        }
        newStar[2] -= compSpeed;
        if (newStar[2] > sd.current.z) {
          newStar[2] -= sd.current.z;
          newStar[7] = 0;
        }
        if (newStar[2] < 0) {
          newStar[2] += sd.current.z;
          newStar[7] = 0;
        }
        newStar[3] = sd.current.x + (newStar[0] / newStar[2]) * ratio;
        newStar[4] = sd.current.y + (newStar[1] / newStar[2]) * ratio;
        return newStar;
      });
    }
  };

  const draw = () => {
    const ctx = sd.current.ctx;
    if (!ctx) return;
    ctx.fillStyle = colors.fill;
    ctx.fillRect(0, 0, sd.current.w, sd.current.h);
    ctx.strokeStyle = starColor;
    sd.current.star.arr.forEach((star: number[]) => {
      if (
        star[5] > 0 &&
        star[5] < sd.current.w &&
        star[6] > 0 &&
        star[6] < sd.current.h &&
        star[7]
      ) {
        ctx.lineWidth = (1 - sd.current.star.colorRatio * star[2]) * 2;
        ctx.beginPath();
        ctx.moveTo(star[5], star[6]);
        ctx.lineTo(star[3], star[4]);
        ctx.stroke();
        ctx.closePath();
      }
    });
  };

  const animate = () => {
    resize();
    update();
    draw();
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    measureViewport();
    setupCanvas();
    bigBang();
    animate();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export { Starfield };
