import React, { useEffect, useRef, useState } from 'react';
import { Building2, Route, Sparkles } from 'lucide-react';
import { InteractiveHero3D } from './InteractiveHero3D';

type RGB = [number, number, number];

function parseCssColor(value: string, fallback: RGB): RGB {
  const input = value.trim();

  if (input.startsWith('#')) {
    const hex = input.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16) / 255,
        parseInt(hex[1] + hex[1], 16) / 255,
        parseInt(hex[2] + hex[2], 16) / 255,
      ];
    }
    if (hex.length >= 6) {
      return [
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255,
      ];
    }
  }

  const rgbMatch = input.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const parts = rgbMatch[1]
      .split(',')
      .map((part) => Number.parseFloat(part.trim()))
      .filter((part) => Number.isFinite(part));
    if (parts.length >= 3) {
      return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
    }
  }

  return fallback;
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) {
    if (vertexShader) {
      gl.deleteShader(vertexShader);
    }
    if (fragmentShader) {
      gl.deleteShader(fragmentShader);
    }
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

const vertexShaderSource = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  uniform vec2 u_drift;
  uniform float u_time;
  uniform float u_energy;
  uniform float u_motion;
  uniform vec3 u_colorA;
  uniform vec3 u_colorB;
  uniform vec3 u_colorC;
  uniform vec3 u_background;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float ribbon(vec2 uv, float offset, float frequency, float thickness, float timeShift) {
    float wave = sin((uv.x + offset) * frequency + u_time * timeShift + u_drift.x * 8.0);
    float band = abs(uv.y - wave * 0.22 - u_drift.y * 0.2);
    return smoothstep(thickness, 0.0, band);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec2 pointer = u_pointer * 2.0 - 1.0;
    pointer.x *= u_resolution.x / u_resolution.y;

    float t = u_time * mix(0.12, 0.46, u_motion);
    vec2 drift = u_drift * (0.14 + u_energy * 0.18);

    vec2 warped = uv;
    warped += drift * 0.45;
    warped.y += sin(warped.x * 2.6 + t) * 0.03;

    float radial = length(warped);
    float coreGlow = 0.22 / (length(warped - pointer * 0.22) + 0.18);
    float echoGlow = 0.18 / (length(warped + pointer * 0.14 + vec2(sin(t * 0.9), cos(t * 0.7)) * 0.18) + 0.24);
    float halo = smoothstep(1.18, 0.14, radial);

    float ribbons = 0.0;
    ribbons += ribbon(warped, -0.6, 4.8, 0.06, 0.9);
    ribbons += ribbon(warped, 0.2, 6.4, 0.05, 1.2);
    ribbons += ribbon(warped, 0.9, 7.3, 0.04, 1.5);
    ribbons *= 0.18 + u_energy * 0.62;

    float rings = 0.0;
    for (float i = 0.0; i < 3.0; i += 1.0) {
      float orbit = 0.28 + i * 0.16;
      float circle = abs(length(warped + drift * 0.25) - orbit);
      rings += smoothstep(0.018, 0.0, circle) * (0.26 - i * 0.05);
    }

    float gridX = smoothstep(0.98, 1.0, sin((warped.x + drift.x * 0.8) * 22.0));
    float gridY = smoothstep(0.98, 1.0, sin((warped.y + drift.y * 0.8) * 22.0));
    float grid = (gridX + gridY) * 0.05 * halo;

    float grain = noise(warped * 4.8 + t * 0.4) * 0.08;
    float stars = smoothstep(0.985, 1.0, noise(warped * 16.0 + 12.0)) * 0.16;

    vec3 color = u_background;
    color += u_colorA * (coreGlow * 0.9 + ribbons * 0.46);
    color += u_colorB * (echoGlow * 0.84 + rings * 0.54);
    color += u_colorC * (halo * 0.16 + grid + stars + grain);

    float vignette = smoothstep(1.55, 0.24, radial);
    color *= vignette;
    color += u_background * 0.18;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function WebGLHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const pointerTargetRef = useRef({ x: 0.52, y: 0.44 });
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setFallback(true);
      return;
    }

    const gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setFallback(true);
      return;
    }

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) {
      setFallback(true);
      return;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      setFallback(true);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
      ]),
      gl.STATIC_DRAW,
    );

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const pointerLocation = gl.getUniformLocation(program, 'u_pointer');
    const driftLocation = gl.getUniformLocation(program, 'u_drift');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const energyLocation = gl.getUniformLocation(program, 'u_energy');
    const motionLocation = gl.getUniformLocation(program, 'u_motion');
    const colorALocation = gl.getUniformLocation(program, 'u_colorA');
    const colorBLocation = gl.getUniformLocation(program, 'u_colorB');
    const colorCLocation = gl.getUniformLocation(program, 'u_colorC');
    const backgroundLocation = gl.getUniformLocation(program, 'u_background');

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    let disposed = false;
    const startTime = performance.now();
    let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: 0.52, y: 0.44 };
    const drift = { x: 0, y: 0 };
    const previous = { x: pointer.x, y: pointer.y };
    const colors = {
      a: [0.133, 0.827, 0.933] as RGB,
      b: [0.655, 0.545, 0.98] as RGB,
      c: [1, 0.714, 0.388] as RGB,
      bg: [0.02, 0.04, 0.08] as RGB,
    };

    const updatePalette = () => {
      const root = getComputedStyle(document.documentElement);
      colors.a = parseCssColor(root.getPropertyValue('--accent-primary'), colors.a);
      colors.b = parseCssColor(root.getPropertyValue('--accent-secondary'), colors.b);
      colors.c = parseCssColor('#ffb663', colors.c);
      colors.bg = parseCssColor(root.getPropertyValue('--bg-main'), colors.bg);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setFallback(true);
    };

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotion = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
    };

    const rootObserver = new MutationObserver(() => {
      updatePalette();
    });

    updatePalette();
    resize();

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    mediaQuery.addEventListener('change', handleReducedMotion);
    rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', resize);

    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible && disposed === false && frameRef.current === null) {
          frameRef.current = window.requestAnimationFrame(animate);
        } else if (!isVisible && frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(canvas);

    const animate = (timestamp: number) => {
      if (disposed || !isVisible) {
        frameRef.current = null;
        return;
      }

      const elapsed = (timestamp - startTime) / 1000;
      const easing = reducedMotion ? 0.025 : 0.075;
      pointer.x += (pointerTargetRef.current.x - pointer.x) * easing;
      pointer.y += (pointerTargetRef.current.y - pointer.y) * easing;

      drift.x += ((pointer.x - previous.x) * 10 - drift.x) * 0.1;
      drift.y += ((pointer.y - previous.y) * 10 - drift.y) * 0.1;
      previous.x = pointer.x;
      previous.y = pointer.y;

      const motionEnergy = Math.min(1, Math.hypot(drift.x, drift.y) * 3.6);
      const motionBlend = reducedMotion ? 0.24 : 1;

      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(pointerLocation, pointer.x, pointer.y);
      gl.uniform2f(driftLocation, drift.x, drift.y);
      gl.uniform1f(timeLocation, elapsed);
      gl.uniform1f(energyLocation, motionEnergy);
      gl.uniform1f(motionLocation, motionBlend);
      gl.uniform3fv(colorALocation, colors.a);
      gl.uniform3fv(colorBLocation, colors.b);
      gl.uniform3fv(colorCLocation, colors.c);
      gl.uniform3fv(backgroundLocation, colors.bg);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      observer.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('resize', resize);
      mediaQuery.removeEventListener('change', handleReducedMotion);
      rootObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerTargetRef.current = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  };

  if (fallback) {
    return <InteractiveHero3D />;
  }

  return (
    <div
      ref={wrapperRef}
      className="webgl-hero"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        pointerTargetRef.current = { x: 0.52, y: 0.44 };
      }}
    >
      <canvas ref={canvasRef} className="webgl-hero__canvas" aria-hidden="true" />

      <div className="webgl-hero__overlay">
        <div className="webgl-hero__status webgl-hero__status--top">
          <Sparkles size={14} />
          <div>
            <span className="webgl-hero__status-label">Institution engine</span>
            <span className="webgl-hero__status-value">Admissions, academics, billing, and AI guidance stay in the same operational rhythm.</span>
          </div>
        </div>

        <div className="webgl-hero__status webgl-hero__status--bottom">
          <Route size={14} />
          <div>
            <span className="webgl-hero__status-label">Live movement layer</span>
            <span className="webgl-hero__status-value">Routes, notices, transport teams, parents, and alerts move together instead of across separate tools.</span>
          </div>
        </div>

        <div className="webgl-hero__status webgl-hero__status--center">
          <Building2 size={14} />
          <div>
            <span className="webgl-hero__status-label">Shared operating picture</span>
            <span className="webgl-hero__status-value">Every role gets a context-aware surface without losing the institution-wide view.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
