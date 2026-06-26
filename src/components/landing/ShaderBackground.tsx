"use client";

import React, { useEffect, useRef } from "react";

export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    
    // Slow, breathing radial gradient for "premium lighting"
    float dist = distance(uv, vec2(0.5, 0.5 + sin(u_time * 0.5) * 0.1));
    float pulse = 0.1 + 0.05 * sin(u_time * 0.3);
    
    // Deep black base with a very subtle gold/amber glow
    vec3 backgroundColor = vec3(0.039, 0.039, 0.039); // #0a0a0a
    vec3 glowColor = vec3(0.83, 0.68, 0.21) * 0.15; // Muted gold
    
    float mask = smoothstep(0.8, 0.2, dist);
    vec3 finalColor = mix(backgroundColor, backgroundColor + glowColor, mask * pulse);
    
    // Add a very faint noise for texture
    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    finalColor += noise * 0.01;

    gl_FragColor = vec4(finalColor, 1.0);
}`;

    function compileShader(type: number, source: string): WebGLShader | null {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    // ResizeObserver setup
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        syncSize();
      });
      resizeObserver.observe(canvas);
    }
    syncSize();

    let animationFrameId: number;
    function render(t: number) {
      if (!canvas || !gl) return;
      if (!resizeObserver) syncSize();
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      cancelAnimationFrame(animationFrameId);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
    />
  );
}
