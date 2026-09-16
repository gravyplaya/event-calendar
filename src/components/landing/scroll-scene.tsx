'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const RAINBOW = [0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x004dff, 0x732982];
const CAMERA_JOURNEY = 60;

/**
 * Full-viewport fixed WebGL canvas behind the landing page content.
 * Camera descends through the scene as the user scrolls; rim lights
 * cycle through the Nest rainbow palette.
 */
export function ScrollScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.z = 14;

    // Big flowing torus knot — the "nest"
    const torus = new THREE.Mesh(
      new THREE.TorusKnotGeometry(6, 1.6, 220, 36),
      new THREE.MeshStandardMaterial({
        color: 0x111116,
        roughness: 0.25,
        metalness: 0.9,
      }),
    );
    scene.add(torus);

    const keyLight = new THREE.PointLight(0xffffff, 260, 90);
    keyLight.position.set(10, 8, 14);
    scene.add(keyLight);
    const rimA = new THREE.PointLight(RAINBOW[0], 200, 70);
    rimA.position.set(-12, -6, -8);
    scene.add(rimA);
    const rimB = new THREE.PointLight(RAINBOW[4], 200, 70);
    rimB.position.set(12, -6, -6);
    scene.add(rimB);

    // Confetti particles
    const COUNT = 900;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const color = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 42;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 70;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 26;
      color.setHex(RAINBOW[i % RAINBOW.length]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      sizes[i] = Math.random() * 0.22 + 0.04;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    pGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    const pMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute vec3 aColor; attribute float aSize;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * 320.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vColor, a * 0.9);
        }`,
    });
    const confetti = new THREE.Points(pGeo, pMat);
    scene.add(confetti);

    const rainbowHex = RAINBOW.map((h) => new THREE.Color(h));
    let scrollY = 0;
    let smoothScroll = 0;
    let mouseX = 0;
    let raf = 0;
    let disposed = false;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const onScroll = () => {
      scrollY = window.scrollY;
    };
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    };
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();

    const animate = () => {
      if (disposed) return;
      raf = requestAnimationFrame(animate);
      clock.getElapsedTime();
      const t = clock.elapsedTime;

      smoothScroll = lerp(smoothScroll, scrollY, 0.06);
      const scrollMax = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const p = Math.min(smoothScroll / scrollMax, 1);

      camera.position.y = lerp(4, -CAMERA_JOURNEY, p);
      camera.position.x = Math.sin(p * Math.PI * 2) * 3.5;
      camera.lookAt(0, camera.position.y - 6, 0);

      torus.rotation.x = t * 0.12 + p * Math.PI * 1.5;
      torus.rotation.y = t * 0.16;
      torus.position.y = lerp(2, -CAMERA_JOURNEY * 0.55, p);

      const idxF = p * RAINBOW.length;
      const i0 = Math.floor(idxF) % RAINBOW.length;
      const i1 = (i0 + 1) % RAINBOW.length;
      rimA.color.lerpColors(
        rainbowHex[i0],
        rainbowHex[i1],
        idxF - Math.floor(idxF),
      );
      rimB.color.copy(rimA.color).offsetHSL(0.33, 0, 0);

      confetti.rotation.y = t * 0.03 + p * 1.2;
      confetti.position.y = p * -18;

      camera.rotation.z = Math.sin(t * 0.3) * 0.02 + mouseX * 0.03;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      pGeo.dispose();
      pMat.dispose();
      torus.geometry.dispose();
      (torus.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
      />
      <ScrollProgress />
    </>
  );
}

/** Rainbow 3px progress bar at the top of the viewport. */
function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = barRef.current;
      if (el) {
        const max = Math.max(
          document.documentElement.scrollHeight - window.innerHeight,
          1,
        );
        el.style.width = `${Math.min(window.scrollY / max, 1) * 100}%`;
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return <div ref={barRef} className="scroll-progress" aria-hidden="true" />;
}
