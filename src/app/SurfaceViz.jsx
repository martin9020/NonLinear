import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Marching Cubes ─────────────────────────────────────────────────────────
// Generates a mesh from an implicit surface f(x,y,z) = 0

const EDGE_TABLE = new Uint16Array([
  0x0,0x109,0x203,0x30a,0x406,0x50f,0x605,0x70c,0x80c,0x905,0xa0f,0xb06,0xc0a,0xd03,0xe09,0xf00,
  0x190,0x99,0x393,0x29a,0x596,0x49f,0x795,0x69c,0x99c,0x895,0xb9f,0xa96,0xd9a,0xc93,0xf99,0xe90,
  0x230,0x339,0x33,0x13a,0x636,0x73f,0x435,0x53c,0xa3c,0xb35,0x83f,0x936,0xe3a,0xf33,0xc39,0xd30,
  0x3a0,0x2a9,0x1a3,0xaa,0x7a6,0x6af,0x5a5,0x4ac,0xbac,0xaa5,0x9af,0x8a6,0xfaa,0xea3,0xda9,0xca0,
  0x460,0x569,0x663,0x76a,0x66,0x16f,0x265,0x36c,0xc6c,0xd65,0xe6f,0xf66,0x86a,0x963,0xa69,0xb60,
  0x5f0,0x4f9,0x7f3,0x6fa,0x1f6,0xff,0x3f5,0x2fc,0xdfc,0xcf5,0xfff,0xef6,0x9fa,0x8f3,0xbf9,0xaf0,
  0x650,0x759,0x453,0x55a,0x256,0x35f,0x55,0x15c,0xe5c,0xf55,0xc5f,0xd56,0xa5a,0xb53,0x859,0x950,
  0x7c0,0x6c9,0x5c3,0x4ca,0x3c6,0x2cf,0x1c5,0xcc,0xfcc,0xec5,0xdcf,0xcc6,0xbca,0xac3,0x9c9,0x8c0,
  0x8c0,0x9c9,0xac3,0xbca,0xcc6,0xdcf,0xec5,0xfcc,0xcc,0x1c5,0x2cf,0x3c6,0x4ca,0x5c3,0x6c9,0x7c0,
  0x950,0x859,0xb53,0xa5a,0xd56,0xc5f,0xf55,0xe5c,0x15c,0x55,0x35f,0x256,0x55a,0x453,0x759,0x650,
  0xaf0,0xbf9,0x8f3,0x9fa,0xef6,0xfff,0xcf5,0xdfc,0x2fc,0x3f5,0xff,0x1f6,0x6fa,0x7f3,0x4f9,0x5f0,
  0xb60,0xa69,0x963,0x86a,0xf66,0xe6f,0xd65,0xc6c,0x36c,0x265,0x16f,0x66,0x76a,0x663,0x569,0x460,
  0xca0,0xda9,0xea3,0xfaa,0x8a6,0x9af,0xaa5,0xbac,0x4ac,0x5a5,0x6af,0x7a6,0xaa,0x1a3,0x2a9,0x3a0,
  0xd30,0xc39,0xf33,0xe3a,0x936,0x83f,0xb35,0xa3c,0x53c,0x435,0x73f,0x636,0x13a,0x33,0x339,0x230,
  0xe90,0xf99,0xc93,0xd9a,0xa96,0xb9f,0x895,0x99c,0x69c,0x795,0x49f,0x596,0x29a,0x393,0x99,0x190,
  0xf00,0xe09,0xd03,0xc0a,0xb06,0xa0f,0x905,0x80c,0x70c,0x605,0x50f,0x406,0x30a,0x203,0x109,0x0
]);

const TRI_TABLE = [
  [-1],
  [0,8,3],  [0,1,9],  [1,8,3,9,8,1],  [1,2,10],  [0,8,3,1,2,10],  [9,2,10,0,2,9],
  [2,8,3,2,10,8,10,9,8],  [3,11,2],  [0,11,2,8,11,0],  [1,9,0,2,3,11],
  [1,11,2,1,9,11,9,8,11],  [3,10,1,11,10,3],  [0,10,1,0,8,10,8,11,10],
  [3,9,0,3,11,9,11,10,9],  [9,8,10,10,8,11],  [4,7,8],  [4,3,0,7,3,4],
  [0,1,9,8,4,7],  [4,1,9,4,7,1,7,3,1],  [1,2,10,8,4,7],  [3,4,7,3,0,4,1,2,10],
  [9,2,10,9,0,2,8,4,7],  [2,10,9,2,9,7,2,7,3,7,9,4],  [8,4,7,3,11,2],
  [11,4,7,11,2,4,2,0,4],  [9,0,1,8,4,7,2,3,11],  [4,7,11,9,4,11,9,11,2,9,2,1],
  [3,10,1,3,11,10,7,8,4],  [1,11,10,1,4,11,1,0,4,7,11,4],  [4,7,8,9,0,11,9,11,10,11,0,3],
  [4,7,11,4,11,9,9,11,10],  [9,5,4],  [9,5,4,0,8,3],  [0,5,4,1,5,0],
  [8,5,4,8,3,5,3,1,5],  [1,2,10,9,5,4],  [3,0,8,1,2,10,4,9,5],
  [5,2,10,5,4,2,4,0,2],  [2,10,5,3,2,5,3,5,4,3,4,8],  [9,5,4,2,3,11],
  [0,11,2,0,8,11,4,9,5],  [0,5,4,0,1,5,2,3,11],  [2,1,5,2,5,8,2,8,11,4,8,5],
  [10,3,11,10,1,3,9,5,4],  [4,9,5,0,8,1,8,10,1,8,11,10],  [5,4,0,5,0,11,5,11,10,11,0,3],
  [5,4,8,5,8,10,10,8,11],  [9,7,8,5,7,9],  [9,3,0,9,5,3,5,7,3],
  [0,7,8,0,1,7,1,5,7],  [1,5,3,3,5,7],  [9,7,8,9,5,7,10,1,2],
  [10,1,2,9,5,0,5,3,0,5,7,3],  [8,0,2,8,2,5,8,5,7,10,5,2],  [2,10,5,2,5,3,3,5,7],
  [7,9,5,7,8,9,3,11,2],  [9,5,7,9,7,2,9,2,0,2,7,11],  [2,3,11,0,1,8,1,7,8,1,5,7],
  [11,2,1,11,1,7,7,1,5],  [9,5,8,8,5,7,10,1,3,10,3,11],  [5,7,0,5,0,9,7,11,0,1,0,10,11,10,0],
  [11,10,0,11,0,3,10,5,0,8,0,7,5,7,0],  [11,10,5,7,11,5],  [10,6,5],
  [0,8,3,5,10,6],  [9,0,1,5,10,6],  [1,8,3,1,9,8,5,10,6],  [1,6,5,2,6,1],
  [1,6,5,1,2,6,3,0,8],  [9,6,5,9,0,6,0,2,6],  [5,9,8,5,8,2,5,2,6,3,2,8],
  [2,3,11,10,6,5],  [11,0,8,11,2,0,10,6,5],  [0,1,9,2,3,11,5,10,6],
  [5,10,6,1,9,2,9,11,2,9,8,11],  [6,3,11,6,5,3,5,1,3],  [0,8,11,0,11,5,0,5,1,5,11,6],
  [3,11,6,0,3,6,0,6,5,0,5,9],  [6,5,9,6,9,11,11,9,8],  [5,10,6,4,7,8],
  [4,3,0,4,7,3,6,5,10],  [1,9,0,5,10,6,8,4,7],  [10,6,5,1,9,7,1,7,3,7,9,4],
  [6,1,2,6,5,1,4,7,8],  [1,2,5,5,2,6,3,0,4,3,4,7],  [8,4,7,9,0,5,0,6,5,0,2,6],
  [7,3,9,7,9,4,3,2,9,5,9,6,2,6,9],  [3,11,2,7,8,4,10,6,5],
  [5,10,6,4,7,2,4,2,0,2,7,11],  [0,1,9,4,7,8,2,3,11,5,10,6],
  [9,2,1,9,11,2,9,4,11,7,11,4,5,10,6],  [8,4,7,3,11,5,3,5,1,5,11,6],
  [5,1,11,5,11,6,1,0,11,7,11,4,0,4,11],  [0,5,9,0,6,5,0,3,6,11,6,3,8,4,7],
  [6,5,9,6,9,11,4,7,9,7,11,9],  [10,4,9,6,4,10],  [4,10,6,4,9,10,0,8,3],
  [10,0,1,10,6,0,6,4,0],  [8,3,1,8,1,6,8,6,4,6,1,10],  [1,4,9,1,2,4,2,6,4],
  [3,0,8,1,2,9,2,4,9,2,6,4],  [0,2,4,4,2,6],  [8,3,2,8,2,4,4,2,6],
  [10,4,9,10,6,4,11,2,3],  [0,8,2,2,8,11,4,9,10,4,10,6],
  [3,11,2,0,1,6,0,6,4,6,1,10],  [6,4,1,6,1,10,4,8,1,2,1,11,8,11,1],
  [9,6,4,9,3,6,9,1,3,11,6,3],  [8,11,1,8,1,0,11,6,1,9,1,4,6,4,1],
  [3,11,6,3,6,0,0,6,4],  [6,4,8,11,6,8],  [7,10,6,7,8,10,8,9,10],
  [0,7,3,0,10,7,0,9,10,6,7,10],  [10,6,7,1,10,7,1,7,8,1,8,0],  [10,6,7,10,7,1,1,7,3],
  [1,2,6,1,6,8,1,8,9,8,6,7],  [2,6,9,2,9,1,6,7,9,0,9,3,7,3,9],  [7,8,0,7,0,6,6,0,2],
  [7,3,2,6,7,2],  [2,3,11,10,6,8,10,8,9,8,6,7],  [2,0,7,2,7,11,0,9,7,6,7,10,9,10,7],
  [1,8,0,1,7,8,1,10,7,6,7,10,2,3,11],  [11,2,1,11,1,7,10,6,1,6,7,1],
  [8,9,6,8,6,7,9,1,6,11,6,3,1,3,6],  [0,9,1,11,6,7],  [7,8,0,7,0,6,3,11,0,11,6,0],
  [7,11,6],  [7,6,11],  [3,0,8,11,7,6],  [0,1,9,11,7,6],  [8,1,9,8,3,1,11,7,6],
  [10,1,2,6,11,7],  [1,2,10,3,0,8,6,11,7],  [2,9,0,2,10,9,6,11,7],
  [6,11,7,2,10,3,10,8,3,10,9,8],  [7,2,3,6,2,7],  [7,0,8,7,6,0,6,2,0],
  [2,7,6,2,3,7,0,1,9],  [1,6,2,1,8,6,1,9,8,8,7,6],  [10,7,6,10,1,7,1,3,7],
  [10,7,6,1,7,10,1,8,7,1,0,8],  [0,3,7,0,7,10,0,10,9,6,10,7],  [7,6,10,7,10,8,8,10,9],
  [6,8,4,11,8,6],  [3,6,11,3,0,6,0,4,6],  [8,6,11,8,4,6,9,0,1],
  [9,4,6,9,6,3,9,3,1,11,3,6],  [6,8,4,6,11,8,2,10,1],  [1,2,10,3,0,11,0,6,11,0,4,6],
  [4,11,8,4,6,11,0,2,9,2,10,9],  [10,9,3,10,3,2,9,4,3,11,3,6,4,6,3],
  [8,2,3,8,4,2,4,6,2],  [0,4,2,4,6,2],  [1,9,0,2,3,4,2,4,6,4,3,8],
  [1,9,4,1,4,2,2,4,6],  [8,1,3,8,6,1,8,4,6,6,10,1],  [10,1,0,10,0,6,6,0,4],
  [4,6,3,4,3,8,6,10,3,0,3,9,10,9,3],  [10,9,4,6,10,4],  [4,9,5,7,6,11],
  [0,8,3,4,9,5,11,7,6],  [5,0,1,5,4,0,7,6,11],  [11,7,6,8,3,4,3,5,4,3,1,5],
  [9,5,4,10,1,2,7,6,11],  [6,11,7,1,2,10,0,8,3,4,9,5],
  [7,6,11,5,4,10,4,2,10,4,0,2],  [3,4,8,3,5,4,3,2,5,10,5,2,11,7,6],
  [7,2,3,7,6,2,5,4,9],  [9,5,4,0,8,6,0,6,2,6,8,7],  [3,6,2,3,7,6,1,5,0,5,4,0],
  [6,2,8,6,8,7,2,1,8,4,8,5,1,5,8],  [9,5,4,10,1,6,1,7,6,1,3,7],
  [1,6,10,1,7,6,1,0,7,8,7,0,9,5,4],  [4,0,10,4,10,5,0,3,10,6,10,7,3,7,10],
  [7,6,10,7,10,8,5,4,10,4,8,10],  [6,9,5,6,11,9,11,8,9],
  [3,6,11,0,6,3,0,5,6,0,9,5],  [0,11,8,0,5,11,0,1,5,5,6,11],  [6,11,3,6,3,5,5,3,1],
  [1,2,10,9,5,11,9,11,8,11,5,6],  [0,11,3,0,6,11,0,9,6,5,6,9,1,2,10],
  [11,8,5,11,5,6,8,0,5,10,5,2,0,2,5],  [6,11,3,6,3,5,2,10,3,10,5,3],
  [5,8,9,5,2,8,5,6,2,3,8,2],  [9,5,6,9,6,0,0,6,2],  [1,5,8,1,8,0,5,6,8,3,8,2,6,2,8],
  [1,5,6,2,1,6],  [1,3,6,1,6,10,3,8,6,5,6,9,8,9,6],  [10,1,0,10,0,6,9,5,0,5,6,0],
  [0,3,8,5,6,10],  [10,5,6],  [11,5,10,7,5,11],  [11,5,10,11,7,5,8,3,0],
  [5,11,7,5,10,11,1,9,0],  [10,7,5,10,11,7,9,8,1,8,3,1],  [11,1,2,11,7,1,7,5,1],
  [0,8,3,1,2,7,1,7,5,7,2,11],  [9,7,5,9,2,7,9,0,2,2,11,7],
  [7,5,2,7,2,11,5,9,2,3,2,8,9,8,2],  [2,5,10,2,3,5,3,7,5],  [8,2,0,8,5,2,8,7,5,10,2,5],
  [9,0,1,5,10,3,5,3,7,3,10,2],  [9,8,2,9,2,1,8,7,2,10,2,5,7,5,2],
  [1,3,5,3,7,5],  [0,8,7,0,7,1,1,7,5],  [9,0,3,9,3,5,5,3,7],  [9,8,7,5,9,7],
  [5,8,4,5,10,8,10,11,8],  [5,0,4,5,11,0,5,10,11,11,3,0],
  [0,1,9,8,4,10,8,10,11,10,4,5],  [10,11,4,10,4,5,11,3,4,9,4,1,3,1,4],
  [2,5,1,2,8,5,2,11,8,4,5,8],  [0,4,11,0,11,3,4,5,11,2,11,1,5,1,11],
  [0,2,5,0,5,9,2,11,5,4,5,8,11,8,5],  [9,4,5,2,11,3],  [2,5,10,3,5,2,3,4,5,3,8,4],
  [5,10,2,5,2,4,4,2,0],  [3,10,2,3,5,10,3,8,5,4,5,8,0,1,9],  [5,10,2,5,2,4,1,9,2,9,4,2],
  [8,4,5,8,5,3,3,5,1],  [0,4,5,1,0,5],  [8,4,5,8,5,3,9,0,5,0,3,5],  [9,4,5],
  [4,11,7,4,9,11,9,10,11],  [0,8,3,4,9,7,9,11,7,9,10,11],
  [1,10,11,1,11,4,1,4,0,7,4,11],  [3,1,4,3,4,8,1,10,4,7,4,11,10,11,4],
  [4,11,7,9,11,4,9,2,11,9,1,2],  [9,7,4,9,11,7,9,1,11,2,11,1,0,8,3],
  [11,7,4,11,4,2,2,4,0],  [11,7,4,11,4,2,8,3,4,3,2,4],
  [2,9,10,2,7,9,2,3,7,7,4,9],  [9,10,7,9,7,4,10,2,7,8,7,0,2,0,7],
  [3,7,10,3,10,2,7,4,10,1,10,0,4,0,10],  [1,10,2,8,7,4],  [4,9,1,4,1,7,7,1,3],
  [4,9,1,4,1,7,0,8,1,8,7,1],  [4,0,3,7,4,3],  [4,8,7],
  [9,10,8,10,11,8],  [3,0,9,3,9,11,11,9,10],  [0,1,10,0,10,8,8,10,11],
  [3,1,10,11,3,10],  [1,2,11,1,11,9,9,11,8],  [3,0,9,3,9,11,1,2,9,2,11,9],
  [0,2,11,8,0,11],  [3,2,11],  [2,3,8,2,8,10,10,8,9],  [9,10,2,0,9,2],
  [2,3,8,2,8,10,0,1,8,1,10,8],  [1,10,2],  [1,3,8,9,1,8],  [0,9,1],  [0,3,8],  [-1]
];

function marchingCubes(fn, bounds, resolution) {
  const [xMin, xMax] = bounds.x;
  const [yMin, yMax] = bounds.y;
  const [zMin, zMax] = bounds.z;
  const nx = resolution, ny = resolution, nz = resolution;
  const dx = (xMax - xMin) / nx;
  const dy = (yMax - yMin) / ny;
  const dz = (zMax - zMin) / nz;

  // Sample the field
  const field = new Float32Array((nx + 1) * (ny + 1) * (nz + 1));
  const idx = (ix, iy, iz) => ix + (nx + 1) * (iy + (ny + 1) * iz);
  for (let iz = 0; iz <= nz; iz++) {
    for (let iy = 0; iy <= ny; iy++) {
      for (let ix = 0; ix <= nx; ix++) {
        const x = xMin + ix * dx;
        const y = yMin + iy * dy;
        const z = zMin + iz * dz;
        field[idx(ix, iy, iz)] = fn(x, y, z);
      }
    }
  }

  const vertices = [];
  const vertexNormals = [];

  function interp(p1, p2, v1, v2) {
    if (Math.abs(v1) < 1e-6) return p1;
    if (Math.abs(v2) < 1e-6) return p2;
    if (Math.abs(v1 - v2) < 1e-6) return p1;
    const t = -v1 / (v2 - v1);
    return [
      p1[0] + t * (p2[0] - p1[0]),
      p1[1] + t * (p2[1] - p1[1]),
      p1[2] + t * (p2[2] - p1[2]),
    ];
  }

  function gradient(x, y, z) {
    const e = 0.001;
    return [
      fn(x + e, y, z) - fn(x - e, y, z),
      fn(x, y + e, z) - fn(x, y - e, z),
      fn(x, y, z + e) - fn(x, y, z - e),
    ];
  }

  for (let iz = 0; iz < nz; iz++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        const x = xMin + ix * dx;
        const y = yMin + iy * dy;
        const z = zMin + iz * dz;

        const vals = [
          field[idx(ix, iy, iz)],
          field[idx(ix + 1, iy, iz)],
          field[idx(ix + 1, iy, iz + 1)],
          field[idx(ix, iy, iz + 1)],
          field[idx(ix, iy + 1, iz)],
          field[idx(ix + 1, iy + 1, iz)],
          field[idx(ix + 1, iy + 1, iz + 1)],
          field[idx(ix, iy + 1, iz + 1)],
        ];

        let cubeIndex = 0;
        for (let i = 0; i < 8; i++) {
          if (vals[i] < 0) cubeIndex |= (1 << i);
        }

        if (EDGE_TABLE[cubeIndex] === 0) continue;

        const corners = [
          [x, y, z],
          [x + dx, y, z],
          [x + dx, y, z + dz],
          [x, y, z + dz],
          [x, y + dy, z],
          [x + dx, y + dy, z],
          [x + dx, y + dy, z + dz],
          [x, y + dy, z + dz],
        ];

        const edgeVerts = new Array(12);
        const edges = EDGE_TABLE[cubeIndex];
        const edgePairs = [
          [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]
        ];
        for (let e = 0; e < 12; e++) {
          if (edges & (1 << e)) {
            const [a, b] = edgePairs[e];
            edgeVerts[e] = interp(corners[a], corners[b], vals[a], vals[b]);
          }
        }

        const tris = TRI_TABLE[cubeIndex];
        for (let i = 0; i < tris.length && tris[i] !== -1; i += 3) {
          for (let j = 0; j < 3; j++) {
            const v = edgeVerts[tris[i + j]];
            vertices.push(v[0], v[1], v[2]);
            const n = gradient(v[0], v[1], v[2]);
            const len = Math.sqrt(n[0]*n[0] + n[1]*n[1] + n[2]*n[2]) || 1;
            vertexNormals.push(-n[0]/len, -n[1]/len, -n[2]/len);
          }
        }
      }
    }
  }

  return { vertices: new Float32Array(vertices), normals: new Float32Array(vertexNormals) };
}

// ─── 3D Implicit Surface Visualization ──────────────────────────────────────

export default function SurfaceViz({ preset, params, isPlaying, timeRef }) {
  const mountRef = useRef(null);
  const internals = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    // ── Scene ──────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 1.5, 3.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.5;
    controls.maxDistance = 20;

    // ── Lighting ───────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x332233, 0.8));

    const dirLight1 = new THREE.DirectionalLight(0xff6688, 1.2);
    dirLight1.position.set(3, 5, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x4466ff, 0.6);
    dirLight2.position.set(-3, -2, -4);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xff2255, 2, 10);
    pointLight.position.set(0, 0, 2);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xff88aa, 1.5, 8);
    pointLight2.position.set(0, 1, -1);
    scene.add(pointLight2);

    // ── 3-Plane Grid System ──────────────────────────────────────────────
    const gridSize = 4;
    const gridDivs = 16;

    // XZ grid (floor — Y=0)
    const gridXZ = new THREE.GridHelper(gridSize, gridDivs, 0x440022, 0x1a0011);
    gridXZ.position.y = -gridSize / 2;
    gridXZ.material.opacity = 0.25;
    gridXZ.material.transparent = true;
    scene.add(gridXZ);

    // XY grid (back wall — Z=0)
    const gridXY = new THREE.GridHelper(gridSize, gridDivs, 0x002244, 0x001122);
    gridXY.rotation.x = Math.PI / 2;
    gridXY.position.z = -gridSize / 2;
    gridXY.material.opacity = 0.15;
    gridXY.material.transparent = true;
    scene.add(gridXY);

    // YZ grid (side wall — X=0)
    const gridYZ = new THREE.GridHelper(gridSize, gridDivs, 0x224400, 0x112200);
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.position.x = -gridSize / 2;
    gridYZ.material.opacity = 0.15;
    gridYZ.material.transparent = true;
    scene.add(gridYZ);

    // ── XYZ Axis Lines (through origin) ──────────────────────────────────
    const axisLen = gridSize / 2 + 0.3;
    function makeAxisLine(from, to, color) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...from), new THREE.Vector3(...to)
      ]);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
      return new THREE.Line(geo, mat);
    }
    scene.add(makeAxisLine([-axisLen,0,0], [axisLen,0,0], 0xff3333)); // X red
    scene.add(makeAxisLine([0,-axisLen,0], [0,axisLen,0], 0x33ff33)); // Y green
    scene.add(makeAxisLine([0,0,-axisLen], [0,0,axisLen], 0x3366ff)); // Z blue

    // ── Axis Label Sprites ───────────────────────────────────────────────
    function makeLabel(text, position, color) {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.font = 'bold 48px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.fillText(text, 32, 32);
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(...position);
      sprite.scale.set(0.35, 0.35, 1);
      return sprite;
    }
    scene.add(makeLabel('X', [axisLen + 0.2, 0, 0], '#ff3333'));
    scene.add(makeLabel('Y', [0, axisLen + 0.2, 0], '#33ff33'));
    scene.add(makeLabel('Z', [0, 0, axisLen + 0.2], '#3366ff'));

    // ── Heart Surface Mesh ─────────────────────────────────────────────
    const heartMat = new THREE.MeshPhysicalMaterial({
      color: 0xff1744,
      metalness: 0.15,
      roughness: 0.35,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      emissive: new THREE.Color(0x440011),
      side: THREE.DoubleSide,
    });

    let heartMesh = new THREE.Mesh(new THREE.BufferGeometry(), heartMat);
    scene.add(heartMesh);

    // ── Glow mesh ──────────────────────────────────────────────────────
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff2255,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    let glowMesh = new THREE.Mesh(new THREE.BufferGeometry(), glowMat);
    scene.add(glowMesh);

    // ── Particles ──────────────────────────────────────────────────────
    const particleCount = 500;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pCol = new Float32Array(particleCount * 3);
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Build surface function ─────────────────────────────────────────
    function buildSurface(p) {
      const surfFn = preset.surfaceFn(p);
      const bounds = preset.bounds || { x: [-1.5, 1.5], y: [-1.5, 1.5], z: [-1.5, 1.5] };
      const res = p.resolution || 80;
      return marchingCubes(surfFn, bounds, res);
    }

    function updateMesh(p) {
      const { vertices, normals } = buildSurface(p);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

      heartMesh.geometry.dispose();
      heartMesh.geometry = geo;

      // Glow — slightly scaled version
      const glowGeo = new THREE.BufferGeometry();
      const glowVerts = new Float32Array(vertices.length);
      for (let i = 0; i < vertices.length; i += 3) {
        const nx = normals[i], ny = normals[i+1], nz = normals[i+2];
        glowVerts[i]     = vertices[i]     + nx * 0.03;
        glowVerts[i + 1] = vertices[i + 1] + ny * 0.03;
        glowVerts[i + 2] = vertices[i + 2] + nz * 0.03;
      }
      glowGeo.setAttribute('position', new THREE.BufferAttribute(glowVerts, 3));
      glowGeo.setAttribute('normal', new THREE.BufferAttribute(normals.slice(), 3));
      glowMesh.geometry.dispose();
      glowMesh.geometry = glowGeo;

      // Scatter particles near surface
      const vCount = vertices.length / 3;
      for (let i = 0; i < particleCount; i++) {
        if (vCount > 0) {
          const vi = Math.floor(Math.random() * vCount) * 3;
          pPos[i * 3]     = vertices[vi]     + (Math.random() - 0.5) * 0.08;
          pPos[i * 3 + 1] = vertices[vi + 1] + (Math.random() - 0.5) * 0.08;
          pPos[i * 3 + 2] = vertices[vi + 2] + (Math.random() - 0.5) * 0.08;
          const bright = 0.5 + Math.random() * 0.5;
          pCol[i * 3]     = bright;
          pCol[i * 3 + 1] = bright * 0.2;
          pCol[i * 3 + 2] = bright * 0.3;
        }
      }
      pGeo.attributes.position.needsUpdate = true;
      pGeo.attributes.color.needsUpdate = true;
    }

    // Initial build
    const paramsRef = { current: params };
    const isPlayingRef = { current: isPlaying };
    internals.current = { paramsRef, isPlayingRef };
    updateMesh(params);

    let lastParams = JSON.stringify(params);

    // ── Animation Loop ─────────────────────────────────────────────────
    let animId;
    let lastTime = performance.now();

    function animate(now) {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (isPlayingRef.current) {
        timeRef.current += dt;
      }
      const t = timeRef.current;
      const p = paramsRef.current;

      // Rebuild mesh when params change
      const paramsStr = JSON.stringify(p);
      if (paramsStr !== lastParams) {
        lastParams = paramsStr;
        updateMesh(p);
      }

      // Heart beat pulsation
      const beat = p.beat || 0;
      if (beat > 0) {
        const beatPhase = t * beat * Math.PI * 2;
        const pulse = 1 + 0.06 * Math.pow(Math.max(Math.sin(beatPhase), 0), 4);
        heartMesh.scale.setScalar(pulse);
        glowMesh.scale.setScalar(pulse * 1.02);
        glowMat.opacity = 0.04 + 0.06 * Math.pow(Math.max(Math.sin(beatPhase), 0), 4);
      } else {
        heartMesh.scale.setScalar(1);
        glowMesh.scale.setScalar(1.02);
      }

      // Slow auto-rotation around Z axis (vertical through the heart)
      const rotSpeed = p.rotSpeed || 0;
      if (rotSpeed > 0) {
        heartMesh.rotation.z = t * rotSpeed;
        glowMesh.rotation.z = t * rotSpeed;
        particles.rotation.z = t * rotSpeed;
      }

      // Animate point light
      pointLight.position.x = Math.sin(t * 0.5) * 2;
      pointLight.position.z = Math.cos(t * 0.5) * 2;

      controls.update();
      renderer.render(scene, camera);
    }

    animId = requestAnimationFrame(animate);

    // ── Resize ─────────────────────────────────────────────────────────
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
      heartMesh.geometry.dispose();
      glowMesh.geometry.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      internals.current = null;
    };
  }, []);

  // ── Sync props into refs ─────────────────────────────────────────────
  useEffect(() => {
    if (internals.current) internals.current.isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (internals.current) internals.current.paramsRef.current = params;
  }, [params]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
