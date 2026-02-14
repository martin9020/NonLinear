import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { wavePacket } from './solvers';

// ─── 3D Helix Wave Packet Visualization ──────────────────────────────────────
// Renders Ψ(x,t) as a 3D spiral tube: y=Re(Ψ), z=Im(Ψ) along x-axis
// Matching the Instagram reel aesthetic exactly.

const Y_SCALE = 3.0;
const TUBE_R = 0.1;
const GLOW_R = 0.35;

export default function WaveViz({ params, isPlaying, timeRef }) {
  const mountRef = useRef(null);
  const internals = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    // ── Scene ────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);

    // ── Camera — looking along the helix at a dramatic angle ─────────────
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 300);
    camera.position.set(6, 4, 14);
    camera.lookAt(0, 0, 0);

    // ── Renderer ─────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    container.appendChild(renderer.domElement);

    // ── Controls ─────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3;
    controls.maxDistance = 60;
    controls.target.set(0, 0, 0);

    // ── Lighting ─────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x223344, 0.6));

    const dirLight = new THREE.DirectionalLight(0x88bbff, 0.6);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Moving point light at wave packet center
    const centerLight = new THREE.PointLight(0x00ccff, 4, 20);
    centerLight.position.set(0, 0, 0);
    scene.add(centerLight);

    // Warm accent light
    const accentLight = new THREE.PointLight(0xff4422, 1.5, 15);
    accentLight.position.set(0, 0, 0);
    scene.add(accentLight);

    // ── Grid Floor ───────────────────────────────────────────────────────
    const gridY = -4;
    const grid = new THREE.GridHelper(60, 120, 0x004455, 0x001a22);
    grid.position.y = gridY;
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    scene.add(grid);

    const grid2 = new THREE.GridHelper(60, 30, 0x006677, 0x002233);
    grid2.position.y = gridY + 0.01;
    grid2.material.opacity = 0.12;
    grid2.material.transparent = true;
    scene.add(grid2);

    // ── Helix Tube (main visualization) ──────────────────────────────────
    const xCount = 600;
    const thetaCount = 16;
    const xMin = -18, xMax = 18;

    const helixGeo = new THREE.BufferGeometry();
    const hVerts = xCount * thetaCount;
    const hPos = new Float32Array(hVerts * 3);
    const hCol = new Float32Array(hVerts * 3);
    helixGeo.setAttribute('position', new THREE.BufferAttribute(hPos, 3));
    helixGeo.setAttribute('color', new THREE.BufferAttribute(hCol, 3));

    // Index buffer — connect adjacent rings
    const hIdx = [];
    for (let xi = 0; xi < xCount - 1; xi++) {
      for (let ti = 0; ti < thetaCount; ti++) {
        const a = xi * thetaCount + ti;
        const b = xi * thetaCount + (ti + 1) % thetaCount;
        const c = (xi + 1) * thetaCount + ti;
        const d = (xi + 1) * thetaCount + (ti + 1) % thetaCount;
        hIdx.push(a, c, b, b, c, d);
      }
    }
    helixGeo.setIndex(hIdx);

    const helixMat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      shininess: 80,
      specular: new THREE.Color(0x4488aa),
      emissive: new THREE.Color(0x002244),
    });
    const helixMesh = new THREE.Mesh(helixGeo, helixMat);
    scene.add(helixMesh);

    // ── Glow Tube (larger, transparent, additive) ────────────────────────
    const glowGeo = new THREE.BufferGeometry();
    const gPos = new Float32Array(hVerts * 3);
    glowGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
    glowGeo.setIndex(hIdx.slice());

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowMesh);

    // ── Propagation axis (bright cyan line) ──────────────────────────────
    const axisPoints = [
      new THREE.Vector3(xMin, 0, 0),
      new THREE.Vector3(xMax, 0, 0),
    ];
    const axisGeo = new THREE.BufferGeometry().setFromPoints(axisPoints);
    const axisMat = new THREE.LineBasicMaterial({
      color: 0x00ddff,
      transparent: true,
      opacity: 0.6,
    });
    scene.add(new THREE.Line(axisGeo, axisMat));

    // ── Envelope outline lines (Gaussian bell from the side) ─────────────
    const envCount = 400;
    const envPosTop = new Float32Array(envCount * 3);
    const envPosBot = new Float32Array(envCount * 3);
    const envGeoTop = new THREE.BufferGeometry();
    envGeoTop.setAttribute('position', new THREE.BufferAttribute(envPosTop, 3));
    const envGeoBot = new THREE.BufferGeometry();
    envGeoBot.setAttribute('position', new THREE.BufferAttribute(envPosBot, 3));

    const envMat = new THREE.LineBasicMaterial({
      color: 0x8855ff,
      transparent: true,
      opacity: 0.4,
    });
    const envLineTop = new THREE.Line(envGeoTop, envMat);
    const envLineBot = new THREE.Line(envGeoBot, envMat.clone());
    scene.add(envLineTop);
    scene.add(envLineBot);

    // ── Floor projection — Re(Ψ) on grid plane (magenta) ────────────────
    const projCount = 400;
    const projRePos = new Float32Array(projCount * 3);
    const projReGeo = new THREE.BufferGeometry();
    projReGeo.setAttribute('position', new THREE.BufferAttribute(projRePos, 3));
    const projReMat = new THREE.LineBasicMaterial({
      color: 0xff2060,
      transparent: true,
      opacity: 0.5,
    });
    const projReLine = new THREE.Line(projReGeo, projReMat);
    scene.add(projReLine);

    // ── Floor projection — Im(Ψ) on grid plane (orange) ─────────────────
    const projImPos = new Float32Array(projCount * 3);
    const projImGeo = new THREE.BufferGeometry();
    projImGeo.setAttribute('position', new THREE.BufferAttribute(projImPos, 3));
    const projImMat = new THREE.LineBasicMaterial({
      color: 0xff6622,
      transparent: true,
      opacity: 0.3,
    });
    const projImLine = new THREE.Line(projImGeo, projImMat);
    scene.add(projImLine);

    // ── Leading bright point (glowing sphere at wave center) ─────────────
    const pointGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const pointMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    const leadPoint = new THREE.Mesh(pointGeo, pointMat);
    scene.add(leadPoint);

    // Glow sphere around leading point
    const glowSphereGeo = new THREE.SphereGeometry(0.6, 12, 12);
    const glowSphereMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowSphere = new THREE.Mesh(glowSphereGeo, glowSphereMat);
    scene.add(glowSphere);

    // ── Particles ────────────────────────────────────────────────────────
    const particleCount = 300;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pCol = new Float32Array(particleCount * 3);
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Precompute theta values ──────────────────────────────────────────
    const cosTheta = new Float32Array(thetaCount);
    const sinTheta = new Float32Array(thetaCount);
    for (let ti = 0; ti < thetaCount; ti++) {
      const theta = (2 * Math.PI * ti) / thetaCount;
      cosTheta[ti] = Math.cos(theta);
      sinTheta[ti] = Math.sin(theta);
    }

    // ── Refs for animation closure ───────────────────────────────────────
    const isPlayingRef = { current: isPlaying };
    const paramsRef = { current: params };
    internals.current = { isPlayingRef, paramsRef };

    // ── Animation Loop ───────────────────────────────────────────────────
    let lastTime = performance.now();
    let animId;

    function animate(now) {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (isPlayingRef.current) {
        timeRef.current += dt;
      }
      const t = timeRef.current;
      const p = paramsRef.current;
      const waveCenter = p.v * t;

      // ── Update helix tube ──────────────────────────────────────────
      for (let xi = 0; xi < xCount; xi++) {
        const x = xMin + (xi / (xCount - 1)) * (xMax - xMin);
        const w = wavePacket(x, t, p);

        // Helix center point: (x, Re(Ψ)*scale, Im(Ψ)*scale)
        const cy = w.real * Y_SCALE;
        const cz = w.imag * Y_SCALE;
        const env = Math.sqrt(w.prob);

        // Color: deep blue → bright cyan based on envelope amplitude
        const envNorm = Math.min(env / (p.A || 1), 1);
        const r = 0.0 + 0.1 * envNorm;
        const g = 0.15 + 0.75 * envNorm;
        const b = 0.4 + 0.6 * envNorm;

        for (let ti = 0; ti < thetaCount; ti++) {
          const idx = (xi * thetaCount + ti) * 3;
          hPos[idx]     = x;
          hPos[idx + 1] = cy + TUBE_R * cosTheta[ti];
          hPos[idx + 2] = cz + TUBE_R * sinTheta[ti];

          hCol[idx]     = r;
          hCol[idx + 1] = g;
          hCol[idx + 2] = b;

          // Glow tube — larger radius
          gPos[idx]     = x;
          gPos[idx + 1] = cy + GLOW_R * cosTheta[ti];
          gPos[idx + 2] = cz + GLOW_R * sinTheta[ti];
        }
      }

      helixGeo.attributes.position.needsUpdate = true;
      helixGeo.attributes.color.needsUpdate = true;
      helixGeo.computeVertexNormals();
      glowGeo.attributes.position.needsUpdate = true;

      // ── Update envelope lines ──────────────────────────────────────
      for (let i = 0; i < envCount; i++) {
        const x = xMin + (i / (envCount - 1)) * (xMax - xMin);
        const w = wavePacket(x, t, p);
        const env = Math.sqrt(w.prob) * Y_SCALE;
        envPosTop[i * 3] = x; envPosTop[i * 3 + 1] = env;  envPosTop[i * 3 + 2] = 0;
        envPosBot[i * 3] = x; envPosBot[i * 3 + 1] = -env; envPosBot[i * 3 + 2] = 0;
      }
      envGeoTop.attributes.position.needsUpdate = true;
      envGeoBot.attributes.position.needsUpdate = true;

      // ── Update floor projections ───────────────────────────────────
      for (let i = 0; i < projCount; i++) {
        const x = xMin + (i / (projCount - 1)) * (xMax - xMin);
        const w = wavePacket(x, t, p);
        // Re(Ψ) projection on floor (y-direction on the floor plane)
        projRePos[i * 3]     = x;
        projRePos[i * 3 + 1] = gridY;
        projRePos[i * 3 + 2] = w.real * Y_SCALE;

        // Im(Ψ) projection on floor (z-direction on the floor plane)
        projImPos[i * 3]     = x;
        projImPos[i * 3 + 1] = gridY;
        projImPos[i * 3 + 2] = w.imag * Y_SCALE;
      }
      projReGeo.attributes.position.needsUpdate = true;
      projImGeo.attributes.position.needsUpdate = true;

      // ── Update leading point ───────────────────────────────────────
      const wc = wavePacket(waveCenter, t, p);
      leadPoint.position.set(waveCenter, wc.real * Y_SCALE, wc.imag * Y_SCALE);
      glowSphere.position.copy(leadPoint.position);

      // Pulse the glow
      const pulse = 0.25 + 0.15 * Math.sin(t * 4);
      glowSphereMat.opacity = pulse;

      // Move lights
      centerLight.position.set(waveCenter, 1, 0);
      accentLight.position.copy(leadPoint.position);

      // ── Update particles ───────────────────────────────────────────
      for (let i = 0; i < particleCount; i++) {
        const x = xMin + Math.random() * (xMax - xMin);
        const w = wavePacket(x, t, p);
        const prob = w.prob / ((p.A * p.A) || 1);
        if (Math.random() < prob * 5) {
          const jitter = 0.3;
          pPos[i * 3]     = x;
          pPos[i * 3 + 1] = w.real * Y_SCALE + (Math.random() - 0.5) * jitter;
          pPos[i * 3 + 2] = w.imag * Y_SCALE + (Math.random() - 0.5) * jitter;
          const bright = 0.3 + 0.7 * prob;
          pCol[i * 3]     = bright * 0.2;
          pCol[i * 3 + 1] = bright * 0.8;
          pCol[i * 3 + 2] = bright;
        }
      }
      pGeo.attributes.position.needsUpdate = true;
      pGeo.attributes.color.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);
    }

    animId = requestAnimationFrame(animate);

    // ── Resize ───────────────────────────────────────────────────────────
    const onResize = () => {
      const w2 = container.clientWidth;
      const h2 = container.clientHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      internals.current = null;
    };
  }, []);

  // ── Sync props into refs ───────────────────────────────────────────────
  useEffect(() => {
    if (internals.current) internals.current.isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (internals.current) internals.current.paramsRef.current = params;
  }, [params]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
