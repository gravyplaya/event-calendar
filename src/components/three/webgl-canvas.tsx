'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Pure Three.js WebGL canvas — no R3F reconciler needed.
 * This avoids the React 18.3.1 + @react-three/fiber compatibility issue.
 *
 * Renders the rotating rainbow nest: six torus rings in pride colours,
 * sparkle particles, lighting rig, and cursor-following rotation.
 */
export function WebGLCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Scene setup ──
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Lighting rig ──
    const ambient = new THREE.AmbientLight(0x404060, 0.4);
    scene.add(ambient);

    const spotLight = new THREE.SpotLight(0x8a7aff, 2.5, 0, 0.3, 0.5, 1);
    spotLight.position.set(5, 8, 5);
    scene.add(spotLight);

    const pointLight1 = new THREE.PointLight(0xff6a4a, 1.5, 20);
    pointLight1.position.set(-5, -3, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x4a9aff, 1, 20);
    pointLight2.position.set(0, 0, 6);
    scene.add(pointLight2);

    // ── Pride colours ──
    const PRIDE_COLORS = [
      0xe40303, // red
      0xff8c00, // orange
      0xffed00, // yellow
      0x008026, // green
      0x004dff, // blue
      0x732982, // purple
    ];

    // ── Nest rings ──
    const rings: THREE.Mesh[] = [];
    PRIDE_COLORS.forEach((color, index) => {
      const total = PRIDE_COLORS.length;
      const yOffset = (index - (total - 1) / 2) * 0.12;
      const rotationOffset = (index / total) * Math.PI * 0.35;
      const tubeRadius = 0.08 + (index % 2) * 0.015;
      const ringRadius = 1.5 - index * 0.06;

      const geometry = new THREE.TorusGeometry(ringRadius, tubeRadius, 16, 80);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.25,
        metalness: 0.6,
        emissive: color,
        emissiveIntensity: 0.15,
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.position.y = yOffset;
      ring.rotation.x = rotationOffset;
      ring.userData = { index, rotationOffset, baseY: yOffset };
      rings.push(ring);
      scene.add(ring);
    });

    // ── Inner glow sphere ──
    const innerSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        emissive: 0x4a3a8a,
        emissiveIntensity: 0.3,
        roughness: 1,
      }),
    );
    scene.add(innerSphere);

    // ── Sparkle particles ──
    const sparkleCount = 80;
    const sparklePositions = new Float32Array(sparkleCount * 3);
    for (let i = 0; i < sparkleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 1.5;
      sparklePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      sparklePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      sparklePositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const sparkleGeometry = new THREE.BufferGeometry();
    sparkleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(sparklePositions, 3),
    );
    const sparkleMaterial = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x6080ff,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
    scene.add(sparkles);

    // ── Mouse tracking ──
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ── Resize handling ──
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // ── Animation loop ──
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Group rotation: slow spin + cursor-following tilt
      const targetRotX = mouseY * 0.25;
      const targetRotZ = mouseX * 0.1;
      rings.forEach((ring) => {
        ring.rotation.y = t * 0.15;
        ring.rotation.x = THREE.MathUtils.lerp(
          ring.rotation.x,
          ring.userData.rotationOffset + targetRotX,
          0.05,
        );
        ring.rotation.z = THREE.MathUtils.lerp(
          ring.rotation.z,
          targetRotZ,
          0.05,
        );
        // Gentle wobble
        ring.position.y =
          ring.userData.baseY + Math.sin(t * 0.4 + ring.userData.index) * 0.02;
      });

      innerSphere.rotation.y = t * 0.15;

      // Sparkle drift
      sparkles.rotation.y = t * 0.05;
      sparkles.rotation.x = Math.sin(t * 0.15) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      rings.forEach((r) => {
        r.geometry.dispose();
        (r.material as THREE.Material).dispose();
      });
      innerSphere.geometry.dispose();
      (innerSphere.material as THREE.Material).dispose();
      sparkleGeometry.dispose();
      sparkleMaterial.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" />;
}
