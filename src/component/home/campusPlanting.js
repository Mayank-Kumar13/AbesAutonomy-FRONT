import * as THREE from 'three';
import { seededRandom } from './campusSurfaces';

function palmCrownGeometry() {
  const positions = [], colors = [];
  const random = seededRandom(814);
  const shade = new THREE.Color();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const triangle = (p, q, r, color) => {
    positions.push(...p, ...q, ...r);
    for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b);
  };
  for (let frond = 0; frond < 15; frond++) {
    const angle = frond * 2.39996;
    const length = 1.8 + random() * 0.9;
    const lift = frond < 5 ? 1.8 : 0.65 + random() * 0.8;
    const bend = 0.65 + random() * 0.65;
    const point = (t, lateral = 0, drop = 0) => [
      Math.cos(angle) * t * length - Math.sin(angle) * lateral,
      Math.sin(t * Math.PI * 0.8) * lift - t * t * bend - drop,
      Math.sin(angle) * t * length + Math.cos(angle) * lateral,
    ];
    shade.setHSL(0.22 + random() * 0.06, 0.31 + random() * 0.2, 0.18 + random() * 0.12);
    for (let segment = 0; segment < 20; segment++) {
      const t = segment / 20, next = (segment + 1) / 20;
      // A fine central rachis supports pairs of tapering, drooping leaflets.
      const p = point(t, 0.012), q = point(t, -0.012), r = point(next);
      triangle(p, q, r, shade);
      if (segment < 2) continue;
      for (const side of [-1, 1]) {
        const reach = Math.sin(t * Math.PI) * (0.38 + random() * 0.16);
        a.fromArray(point(t));
        b.fromArray(point(Math.min(1, t + 0.14), side * reach, reach * 0.38));
        c.fromArray(point(t + 0.045));
        triangle(a.toArray(), b.toArray(), c.toArray(), shade);
        // Slight fold down the blade catches daylight instead of a flat silhouette.
        const mid = a.clone().lerp(b, 0.55); mid.y += 0.035;
        triangle(a.toArray(), mid.toArray(), b.toArray(), shade.clone().multiplyScalar(1.08));
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function addCampusPlanting(campus, materials, lowPower) {
  const random = seededRandom(3086);
  const crownGeometry = palmCrownGeometry();
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0xe0e8cc, vertexColors: true, roughness: 0.86, side: THREE.DoubleSide, envMapIntensity: 0.4 });
  const trunkGeometry = new THREE.CylinderGeometry(0.12, 0.21, 4.4, 12, 14);
  // Keep the four palms at their existing locations and height.
  for (const side of [-1, 1]) {
    for (const x of [side * 10.4, side * 25.2]) {
      const trunk = new THREE.Mesh(trunkGeometry, materials.trunk);
      trunk.position.set(x, 2.3, 5.7);
      trunk.castShadow = trunk.receiveShadow = true;
      campus.add(trunk);
      const crown = new THREE.Mesh(crownGeometry, leafMaterial);
      crown.position.set(x, 4.6, 5.7);
      crown.rotation.y = x * 1.7;
      crown.castShadow = crown.receiveShadow = true;
      campus.add(crown);
    }
  }

  // Leaf clusters soften the existing hedge edges, without adding planting beds.
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -0.5);
  leafShape.quadraticCurveTo(-0.45, 0, 0, 0.5);
  leafShape.quadraticCurveTo(0.45, 0, 0, -0.5);
  const leafGeometry = new THREE.ShapeGeometry(leafShape, 3);
  const hedgeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.95, envMapIntensity: 0.25 });
  const count = lowPower ? 1100 : 2200;
  const foliage = new THREE.InstancedMesh(leafGeometry, hedgeMaterial, count);
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? -1 : 1;
    const planter = i % 7 === 0;
    if (planter) {
      const pot = Math.floor(random() * 5);
      const radius = Math.sqrt(random()) * 0.4, angle = random() * Math.PI * 2;
      dummy.position.set(side * (4.5 + pot * 1.6) + Math.cos(angle) * radius, 0.62 + random() * 0.42, 9 + Math.sin(angle) * radius);
    } else {
      dummy.position.set(side * 19 + (random() - 0.5) * 23.4, 0.47 + random() * 0.33, 6.8 + (random() - 0.5) * 1.65);
    }
    dummy.rotation.set(random() * Math.PI, random() * Math.PI * 2, random() * Math.PI);
    const scale = 0.12 + random() * 0.21;
    dummy.scale.set(scale, scale * 1.8, scale);
    dummy.updateMatrix(); foliage.setMatrixAt(i, dummy.matrix);
    color.setHSL(0.21 + random() * 0.09, 0.32 + random() * 0.23, 0.13 + random() * 0.2);
    foliage.setColorAt(i, color);
  }
  foliage.castShadow = !lowPower;
  foliage.receiveShadow = true;
  campus.add(foliage);
}
