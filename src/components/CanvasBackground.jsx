import { useEffect, useRef } from 'react';

// ─── Fireflies ───
function initFireflies(canvas) {
  const ctx = canvas.getContext('2d');
  const particles = [];
  const COUNT = 40;

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 3 + 1.5,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.01 + 0.005,
    });
  }

  let raf;
  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.phase += p.speed;
      p.x += p.vx + Math.sin(p.phase * 3) * 0.15;
      p.y += p.vy + Math.cos(p.phase * 2) * 0.15;
      if (p.x < -20) p.x = canvas.width + 20;
      if (p.x > canvas.width + 20) p.x = -20;
      if (p.y < -20) p.y = canvas.height + 20;
      if (p.y > canvas.height + 20) p.y = -20;

      const glow = (Math.sin(p.phase) + 1) * 0.5;
      const alpha = 0.15 + glow * 0.7;
      const radius = p.r * (0.8 + glow * 0.4);

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 6);
      grad.addColorStop(0, `rgba(180, 220, 100, ${alpha})`);
      grad.addColorStop(0.3, `rgba(140, 200, 80, ${alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(140, 200, 80, 0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 6, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 240, 140, ${alpha})`;
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}

// ─── Rain ───
function initRain(canvas) {
  const ctx = canvas.getContext('2d');
  const drops = [];
  const splashes = [];
  const COUNT = 200;

  for (let i = 0; i < COUNT; i++) {
    drops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      len: Math.random() * 18 + 8,
      speed: Math.random() * 6 + 8,
      opacity: Math.random() * 0.3 + 0.1,
    });
  }

  let raf;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Drops
    for (const d of drops) {
      d.y += d.speed;
      d.x -= 1.5; // slight wind
      if (d.y > canvas.height) {
        // Splash
        splashes.push({ x: d.x, y: canvas.height - 2, life: 1, spread: Math.random() * 2 + 1 });
        d.y = -d.len;
        d.x = Math.random() * canvas.width;
      }
      if (d.x < 0) d.x = canvas.width;

      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + 1.5, d.y + d.len);
      ctx.strokeStyle = `rgba(150, 180, 220, ${d.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Splashes
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      s.life -= 0.04;
      if (s.life <= 0) { splashes.splice(i, 1); continue; }
      const r = (1 - s.life) * 8 * s.spread;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, Math.PI, 2 * Math.PI);
      ctx.strokeStyle = `rgba(150, 180, 220, ${s.life * 0.3})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}

// ─── Nebula (WebGL fragment shader) ───
const NEBULA_VERT = `attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;
const NEBULA_FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2 u_res;

// FBM noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time * 0.03;

  float n1 = fbm(uv * 3.0 + vec2(t, t * 0.7));
  float n2 = fbm(uv * 2.0 + vec2(-t * 0.5, t * 0.3) + n1 * 1.5);
  float n3 = fbm(uv * 4.0 + vec2(t * 0.2, -t * 0.6) + n2);

  vec3 c1 = vec3(0.08, 0.02, 0.15);  // deep purple
  vec3 c2 = vec3(0.02, 0.08, 0.2);   // dark teal
  vec3 c3 = vec3(0.15, 0.04, 0.08);  // dark crimson
  vec3 c4 = vec3(0.03, 0.12, 0.12);  // dark cyan

  vec3 col = mix(c1, c2, n1);
  col = mix(col, c3, n2 * 0.6);
  col = mix(col, c4, n3 * 0.4);
  col += 0.04 * n3;

  gl_FragColor = vec4(col, 1.0);
}`;

function initNebula(canvas) {
  const gl = canvas.getContext('webgl');
  if (!gl) return () => {};

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, NEBULA_VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, NEBULA_FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRes = gl.getUniformLocation(prog, 'u_res');

  let raf;
  const start = performance.now();
  function draw() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(uTime, (performance.now() - start) / 1000);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}

// ─── Waves (layered sine waves) ───
function initWaves(canvas) {
  const ctx = canvas.getContext('2d');
  const layers = [
    { y: 0.55, amp: 25, freq: 0.008, speed: 0.012, color: 'rgba(20, 60, 120, 0.3)' },
    { y: 0.60, amp: 20, freq: 0.010, speed: 0.018, color: 'rgba(30, 80, 140, 0.25)' },
    { y: 0.65, amp: 15, freq: 0.013, speed: 0.008, color: 'rgba(15, 50, 100, 0.35)' },
    { y: 0.72, amp: 12, freq: 0.015, speed: 0.022, color: 'rgba(10, 40, 90, 0.3)' },
  ];
  let t = 0;
  let raf;

  function draw() {
    t += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#050510');
    sky.addColorStop(0.5, '#0a0a20');
    sky.addColorStop(1, '#0a1525');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const l of layers) {
      ctx.beginPath();
      const baseY = canvas.height * l.y;
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x += 3) {
        const y = baseY + Math.sin(x * l.freq + t * l.speed) * l.amp
                        + Math.sin(x * l.freq * 1.8 + t * l.speed * 0.7) * l.amp * 0.4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fillStyle = l.color;
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}

// ─── Init map ───
const INIT_MAP = {
  fireflies: initFireflies,
  rain: initRain,
  nebula: initNebula,
  waves: initWaves,
};

export default function CanvasBackground({ id }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const init = INIT_MAP[id];
    if (!init) return;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    const cleanup = init(canvas);

    return () => {
      window.removeEventListener('resize', resize);
      cleanup?.();
    };
  }, [id]);

  return (
    <canvas
      ref={canvasRef}
      className="background"
      style={{ background: '#050508' }}
    />
  );
}
