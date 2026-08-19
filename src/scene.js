import * as THREE from 'three';

// --- Scene State ---
let scene, camera, renderer, modelGroup, currentModel;
let wireframeMode = true;
let modelIndex = 0;
let autoRotateSpeed = 0.003;
let floatPhase = 0;

const modelNames = [
  'a380-hd', 'building-hd', 'rocket-hd', 'gpu-hd', 'tesla-hd', 'satellite-hd'
];

const wireMat = new THREE.MeshBasicMaterial({
  color: 0x00ffcc, wireframe: true, transparent: true, opacity: 0.9,
});
const accentMat = new THREE.MeshBasicMaterial({
  color: 0xff44aa, wireframe: true, transparent: true, opacity: 0.7,
});

// --- Init Scene ---
export function initScene(container) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, 0.015);

  camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(4, 2, 8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x404060, 2);
  scene.add(ambientLight);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2);
  keyLight.position.set(5, 8, 5);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x8888ff, 1);
  fillLight.position.set(-3, 2, -3);
  scene.add(fillLight);

  // No grid — pure black background

  modelGroup = new THREE.Group();
  scene.add(modelGroup);

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Panel toggle
  const panelToggle = document.getElementById('panel-toggle');
  const uiPanel = document.getElementById('ui-panel');
  if (panelToggle && uiPanel) {
    panelToggle.addEventListener('click', () => {
      uiPanel.classList.toggle('collapsed');
      document.body.classList.toggle('panel-collapsed');
      panelToggle.textContent = uiPanel.classList.contains('collapsed') ? '☰' : '✕';
    });
  }

  function render() {
    requestAnimationFrame(render);
    if (modelGroup) {
      floatPhase += 0.015;
      modelGroup.position.y = Math.sin(floatPhase) * 0.3;
      if (isAutoRotating) modelGroup.rotation.y += autoRotateSpeed;
    }
    renderer.render(scene, camera);
  }
  render();
}// ============================================================
// ORIGINAL MODELS
// ============================================================

function createA380() {
  const group = new THREE.Group();
  const fuselageGeo = new THREE.CylinderGeometry(0.28, 0.25, 4.5, 24);
  const fuselage = new THREE.Mesh(fuselageGeo, wireMat);
  fuselage.rotation.x = Math.PI / 2;
  group.add(fuselage);
  const noseGeo = new THREE.SphereGeometry(0.28, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, wireMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = 2.25;
  group.add(nose);
  const tailConeGeo = new THREE.ConeGeometry(0.25, 0.8, 24);
  const tailCone = new THREE.Mesh(tailConeGeo, wireMat);
  tailCone.position.z = -2.65;
  tailCone.rotation.x = Math.PI / 2;
  group.add(tailCone);
  const upperDeckGeo = new THREE.CylinderGeometry(0.22, 0.2, 1.5, 16);
  const upperDeck = new THREE.Mesh(upperDeckGeo, accentMat);
  upperDeck.rotation.x = Math.PI / 2;
  upperDeck.position.set(0, 0.2, 0.5);
  group.add(upperDeck);
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(3.5, -0.8);
  wingShape.lineTo(3.5, -1.2);
  wingShape.lineTo(0, -0.3);
  wingShape.closePath();
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.04, bevelEnabled: false });
  const wings = new THREE.Mesh(wingGeo, wireMat);
  wings.rotation.x = -Math.PI / 2;
  wings.position.set(0, 0, -0.3);
  group.add(wings);
  for (let side of [-1, 1]) {
    const wingletGeo = new THREE.BoxGeometry(0.04, 0.4, 0.3);
    const winglet = new THREE.Mesh(wingletGeo, accentMat);
    winglet.position.set(side * 3.4, 0.2, -0.8);
    winglet.rotation.z = side * 0.3;
    group.add(winglet);
  }
  const hStabGeo = new THREE.BoxGeometry(1.8, 0.04, 0.4);
  const hStab = new THREE.Mesh(hStabGeo, wireMat);
  hStab.position.set(0, 0, -2.2);
  group.add(hStab);
  const vStabGeo = new THREE.BoxGeometry(0.04, 0.9, 0.5);
  const vStab = new THREE.Mesh(vStabGeo, wireMat);
  vStab.position.set(0, 0.45, -2.2);
  group.add(vStab);
  const engineGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.5, 16);
  const enginePositions = [
    { x: 1.2, z: -0.5 }, { x: 2.4, z: -0.6 },
    { x: -1.2, z: -0.5 }, { x: -2.4, z: -0.6 },
  ];
  enginePositions.forEach(pos => {
    const engine = new THREE.Mesh(engineGeo, accentMat);
    engine.rotation.x = Math.PI / 2;
    engine.position.set(pos.x, -0.15, pos.z);
    group.add(engine);
  });
  const gearBayGeo = new THREE.BoxGeometry(0.15, 0.1, 0.2);
  for (let side of [-1, 1]) {
    const bay = new THREE.Mesh(gearBayGeo, accentMat);
    bay.position.set(side * 0.4, -0.25, 0.3);
    group.add(bay);
  }
  return group;
}

function createBuilding() {
  const group = new THREE.Group();
  const floors = 15;
  const floorHeight = 0.25;
  const width = 1.2;
  const depth = 0.8;
  const towerGeo = new THREE.BoxGeometry(width, floors * floorHeight, depth);
  const tower = new THREE.Mesh(towerGeo, wireMat);
  group.add(tower);
  for (let i = 0; i <= floors; i++) {
    const lineGeo = new THREE.BoxGeometry(width + 0.05, 0.02, depth + 0.05);
    const line = new THREE.Mesh(lineGeo, accentMat);
    line.position.y = (i - floors / 2) * floorHeight;
    group.add(line);
  }
  const windowCols = 6;
  const windowRows = 15;
  for (let col = 0; col < windowCols; col++) {
    const x = -width / 2 + (col + 0.5) * (width / windowCols);
    for (let row = 0; row < windowRows; row++) {
      const y = -floors * floorHeight / 2 + (row + 0.5) * floorHeight;
      const winGeo = new THREE.BoxGeometry(0.08, 0.15, 0.02);
      const win = new THREE.Mesh(winGeo, accentMat);
      win.position.set(x, y, depth / 2 + 0.01);
      group.add(win);
    }
  }
  const spireGeo = new THREE.CylinderGeometry(0.02, 0.04, 0.8, 8);
  const spire = new THREE.Mesh(spireGeo, accentMat);
  spire.position.y = floors * floorHeight / 2 + 0.4;
  group.add(spire);
  const baseGeo = new THREE.BoxGeometry(width + 0.3, 0.3, depth + 0.3);
  const base = new THREE.Mesh(baseGeo, wireMat);
  base.position.y = -floors * floorHeight / 2 - 0.15;
  group.add(base);
  return group;
}

function createRocketEngine() {
  const group = new THREE.Group();
  const nozzleGeo = new THREE.CylinderGeometry(0.6, 0.3, 1.5, 32, 1, true);
  const nozzle = new THREE.Mesh(nozzleGeo, wireMat);
  nozzle.rotation.x = Math.PI / 2;
  group.add(nozzle);
  const lipGeo = new THREE.TorusGeometry(0.6, 0.03, 8, 32);
  const lip = new THREE.Mesh(lipGeo, accentMat);
  lip.rotation.x = Math.PI / 2;
  lip.position.z = -0.75;
  group.add(lip);
  const chamberGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 24);
  const chamber = new THREE.Mesh(chamberGeo, wireMat);
  chamber.rotation.x = Math.PI / 2;
  chamber.position.z = 1.15;
  group.add(chamber);
  const injectorGeo = new THREE.SphereGeometry(0.3, 24, 12);
  const injector = new THREE.Mesh(injectorGeo, accentMat);
  injector.position.z = 1.55;
  group.add(injector);
  const pumpGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16);
  for (let angle of [Math.PI / 4, -Math.PI / 4, Math.PI * 3 / 4, -Math.PI * 3 / 4]) {
    const pump = new THREE.Mesh(pumpGeo, accentMat);
    pump.rotation.x = Math.PI / 2;
    pump.rotation.z = angle;
    pump.position.set(Math.cos(angle) * 0.35, Math.sin(angle) * 0.35, 0.8);
    group.add(pump);
  }
  for (let z of [0.6, 0.9, 1.2]) {
    const pipeGeo = new THREE.TorusGeometry(0.32, 0.02, 8, 32);
    const pipe = new THREE.Mesh(pipeGeo, accentMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.z = z;
    group.add(pipe);
  }
  const gimbalGeo = new THREE.TorusGeometry(0.35, 0.04, 8, 24);
  const gimbal = new THREE.Mesh(gimbalGeo, wireMat);
  gimbal.rotation.x = Math.PI / 2;
  gimbal.position.z = 0.3;
  group.add(gimbal);
  const plumeGeo = new THREE.ConeGeometry(0.7, 1.2, 24, 1, true);
  const plumeMat = new THREE.MeshBasicMaterial({ color: 0xff6644, wireframe: true, transparent: true, opacity: 0.4 });
  const plume = new THREE.Mesh(plumeGeo, plumeMat);
  plume.rotation.x = -Math.PI / 2;
  plume.position.z = -1.35;
  group.add(plume);
  return group;
}

function createGPUChip() {
  const group = new THREE.Group();
  const pcbGeo = new THREE.BoxGeometry(2.5, 0.08, 1.8);
  const pcb = new THREE.Mesh(pcbGeo, wireMat);
  group.add(pcb);
  const dieGeo = new THREE.BoxGeometry(0.8, 0.12, 0.8);
  const die = new THREE.Mesh(dieGeo, accentMat);
  die.position.y = 0.08;
  group.add(die);
  const vramGeo = new THREE.BoxGeometry(0.25, 0.08, 0.25);
  const vramPositions = [
    { x: -0.6, z: 0 }, { x: 0.6, z: 0 }, { x: 0, z: -0.55 }, { x: 0, z: 0.55 },
    { x: -0.6, z: -0.55 }, { x: 0.6, z: -0.55 }, { x: -0.6, z: 0.55 }, { x: 0.6, z: 0.55 },
  ];
  vramPositions.forEach(pos => {
    const vram = new THREE.Mesh(vramGeo, accentMat);
    vram.position.set(pos.x, 0.06, pos.z);
    group.add(vram);
  });
  const finCount = 12;
  for (let i = 0; i < finCount; i++) {
    const finGeo = new THREE.BoxGeometry(0.03, 0.25, 0.7);
    const fin = new THREE.Mesh(finGeo, wireMat);
    fin.position.set(-0.35 + i * 0.065, 0.2, 0);
    group.add(fin);
  }
  const pcieGeo = new THREE.BoxGeometry(0.6, 0.15, 0.08);
  const pcie = new THREE.Mesh(pcieGeo, accentMat);
  pcie.position.set(0, -0.05, -0.9);
  group.add(pcie);
  const powerGeo = new THREE.BoxGeometry(0.15, 0.12, 0.1);
  for (let i = 0; i < 2; i++) {
    const power = new THREE.Mesh(powerGeo, accentMat);
    power.position.set(0.8, 0.08, -0.5 + i * 0.15);
    group.add(power);
  }
  const ballGeo = new THREE.SphereGeometry(0.02, 6, 6);
  for (let x = -1; x <= 1; x += 0.15) {
    for (let z = -0.7; z <= 0.7; z += 0.15) {
      const ball = new THREE.Mesh(ballGeo, accentMat);
      ball.position.set(x, -0.06, z);
      group.add(ball);
    }
  }
  const capGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8);
  const capPositions = [
    { x: -1, z: 0.6 }, { x: -1, z: -0.6 }, { x: 1, z: 0.6 }, { x: 1, z: -0.6 },
  ];
  capPositions.forEach(pos => {
    const cap = new THREE.Mesh(capGeo, accentMat);
    cap.position.set(pos.x, 0.05, pos.z);
    group.add(cap);
  });
  return group;
}

function createTeslaModelX() {
  const group = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(1.0, 0.55, 2.4);
  const body = new THREE.Mesh(bodyGeo, wireMat);
  body.position.y = 0.35;
  group.add(body);
  const cabinGeo = new THREE.BoxGeometry(0.9, 0.45, 1.4);
  const cabin = new THREE.Mesh(cabinGeo, wireMat);
  cabin.position.set(0, 0.85, -0.1);
  group.add(cabin);
  const windshieldGeo = new THREE.PlaneGeometry(0.85, 0.5);
  const glassMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, wireframe: true, transparent: true, opacity: 0.5 });
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 0.85, 0.55);
  windshield.rotation.x = -0.4;
  group.add(windshield);
  const rearWindow = new THREE.Mesh(windshieldGeo, glassMat);
  rearWindow.position.set(0, 0.85, -0.75);
  rearWindow.rotation.x = 0.4;
  group.add(rearWindow);
  const doorGeo = new THREE.BoxGeometry(0.04, 0.5, 0.6);
  for (let side of [-1, 1]) {
    const door = new THREE.Mesh(doorGeo, accentMat);
    door.position.set(side * 0.47, 0.9, -0.1);
    door.rotation.z = side * 0.15;
    group.add(door);
  }
  const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 24);
  const wheelPositions = [
    { x: 0.48, z: 0.8 }, { x: -0.48, z: 0.8 }, { x: 0.48, z: -0.8 }, { x: -0.48, z: -0.8 },
  ];
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, 0.18, pos.z);
    group.add(wheel);
    const rimGeo = new THREE.TorusGeometry(0.12, 0.02, 8, 16);
    const rim = new THREE.Mesh(rimGeo, accentMat);
    rim.rotation.y = Math.PI / 2;
    rim.position.set(pos.x, 0.18, pos.z);
    group.add(rim);
  });
  const lightGeo = new THREE.BoxGeometry(0.25, 0.08, 0.05);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc, wireframe: true, emissive: 0xffffcc, emissiveIntensity: 0.3 });
  for (let side of [-1, 1]) {
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(side * 0.3, 0.4, 1.18);
    group.add(light);
  }
  const tailLightGeo = new THREE.BoxGeometry(0.9, 0.06, 0.04);
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff2222, wireframe: true, emissive: 0xff2222, emissiveIntensity: 0.3 });
  const tailLight = new THREE.Mesh(tailLightGeo, tailLightMat);
  tailLight.position.set(0, 0.5, -1.18);
  group.add(tailLight);
  const logoGeo = new THREE.CircleGeometry(0.08, 16);
  const logoMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: true });
  const logo = new THREE.Mesh(logoGeo, logoMat);
  logo.position.set(0, 0.5, 1.21);
  group.add(logo);
  const railGeo = new THREE.BoxGeometry(0.04, 0.04, 1.3);
  for (let side of [-1, 1]) {
    const rail = new THREE.Mesh(railGeo, accentMat);
    rail.position.set(side * 0.42, 1.08, -0.1);
    group.add(rail);
  }
  return group;
}// ============================================================
// HD MODELS — Extra Detailed
// ============================================================

function createA380HD() {
  const group = new THREE.Group();
  const fuselageLen = 5.0;
  const fuselageR = 0.3;
  const fuselageGeo = new THREE.CylinderGeometry(fuselageR, fuselageR, fuselageLen, 48, 8, true);
  const fuselage = new THREE.Mesh(fuselageGeo, wireMat);
  fuselage.rotation.x = Math.PI / 2;
  group.add(fuselage);
  const noseGeo = new THREE.SphereGeometry(0.32, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, wireMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = fuselageLen / 2;
  group.add(nose);
  const tailGeo = new THREE.ConeGeometry(0.28, 1.0, 48, 8);
  const tail = new THREE.Mesh(tailGeo, wireMat);
  tail.position.z = -fuselageLen / 2 - 0.5;
  tail.rotation.x = Math.PI / 2;
  group.add(tail);
  const upperDeckGeo = new THREE.CylinderGeometry(0.24, 0.22, 2.0, 32, 8);
  const upperDeck = new THREE.Mesh(upperDeckGeo, accentMat);
  upperDeck.rotation.x = Math.PI / 2;
  upperDeck.position.set(0, 0.22, 0.6);
  group.add(upperDeck);
  for (let i = 0; i < 5; i++) {
    const winGeo = new THREE.BoxGeometry(0.04, 0.06, 0.02);
    const win = new THREE.Mesh(winGeo, accentMat);
    win.position.set(-0.1 + i * 0.05, 0.28, 2.3);
    group.add(win);
  }
  for (let z = -2.0; z <= 2.0; z += 0.3) {
    const ribGeo = new THREE.TorusGeometry(fuselageR + 0.01, 0.005, 8, 48);
    const rib = new THREE.Mesh(ribGeo, accentMat);
    rib.rotation.x = Math.PI / 2;
    rib.position.z = z;
    group.add(rib);
  }
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.bezierCurveTo(1.0, -0.1, 2.5, -0.6, 4.0, -1.0);
  wingShape.lineTo(4.0, -1.4);
  wingShape.bezierCurveTo(2.5, -0.9, 1.0, -0.3, 0, -0.15);
  wingShape.closePath();
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3 });
  const wings = new THREE.Mesh(wingGeo, wireMat);
  wings.rotation.x = -Math.PI / 2;
  wings.position.set(0, 0, -0.4);
  group.add(wings);
  for (let side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const flapGeo = new THREE.BoxGeometry(0.03, 0.15, 0.8);
      const flap = new THREE.Mesh(flapGeo, accentMat);
      flap.position.set(side * (1.5 + i * 0.9), 0, -0.8 + i * 0.1);
      group.add(flap);
    }
  }
  for (let side of [-1, 1]) {
    const wingletGeo = new THREE.BoxGeometry(0.04, 0.6, 0.35);
    const winglet = new THREE.Mesh(wingletGeo, accentMat);
    winglet.position.set(side * 3.9, 0.3, -1.0);
    winglet.rotation.z = side * 0.35;
    group.add(winglet);
  }
  const hStabGeo = new THREE.BoxGeometry(2.2, 0.05, 0.5);
  const hStab = new THREE.Mesh(hStabGeo, wireMat);
  hStab.position.set(0, 0, -2.5);
  group.add(hStab);
  const vStabGeo = new THREE.BoxGeometry(0.05, 1.1, 0.6);
  const vStab = new THREE.Mesh(vStabGeo, wireMat);
  vStab.position.set(0, 0.55, -2.5);
  group.add(vStab);
  const tTailGeo = new THREE.BoxGeometry(1.0, 0.04, 0.3);
  const tTail = new THREE.Mesh(tTailGeo, accentMat);
  tTail.position.set(0, 1.1, -2.5);
  group.add(tTail);
  const enginePositions = [
    { x: 1.3, z: -0.5 }, { x: 2.6, z: -0.7 },
    { x: -1.3, z: -0.5 }, { x: -2.6, z: -0.7 },
  ];
  enginePositions.forEach(pos => {
    const nacelleGeo = new THREE.CylinderGeometry(0.14, 0.15, 0.6, 32, 8);
    const nacelle = new THREE.Mesh(nacelleGeo, wireMat);
    nacelle.rotation.x = Math.PI / 2;
    nacelle.position.set(pos.x, -0.15, pos.z);
    group.add(nacelle);
    const fanGeo = new THREE.TorusGeometry(0.12, 0.02, 8, 24);
    const fan = new THREE.Mesh(fanGeo, accentMat);
    fan.rotation.x = Math.PI / 2;
    fan.position.set(pos.x, -0.15, pos.z + 0.3);
    group.add(fan);
  });
  for (let side of [-1, 1]) {
    const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 12);
    const strut = new THREE.Mesh(strutGeo, accentMat);
    strut.position.set(side * 0.5, -0.4, 0.3);
    group.add(strut);
    const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
    const wheel = new THREE.Mesh(wheelGeo, wireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(side * 0.5, -0.6, 0.3);
    group.add(wheel);
  }
  const apuGeo = new THREE.ConeGeometry(0.06, 0.2, 12);
  const apu = new THREE.Mesh(apuGeo, accentMat);
  apu.position.set(0, 0, -3.0);
  apu.rotation.x = Math.PI / 2;
  group.add(apu);
  return group;
}

function createBuildingHD() {
  const group = new THREE.Group();
  const floors = 20;
  const floorHeight = 0.28;
  const width = 1.5;
  const depth = 1.0;
  const towerGeo = new THREE.BoxGeometry(width, floors * floorHeight, depth, 4, floors * 2, 4);
  const tower = new THREE.Mesh(towerGeo, wireMat);
  group.add(tower);
  for (let i = 0; i <= floors; i++) {
    const lineGeo = new THREE.BoxGeometry(width + 0.06, 0.015, depth + 0.06);
    const line = new THREE.Mesh(lineGeo, accentMat);
    line.position.y = (i - floors / 2) * floorHeight;
    group.add(line);
  }
  const windowCols = 8;
  const windowRows = floors;
  const faces = [
    { axis: 'z', val: depth / 2 + 0.01 },
    { axis: 'z', val: -depth / 2 - 0.01 },
    { axis: 'x', val: width / 2 + 0.01 },
    { axis: 'x', val: -width / 2 - 0.01 },
  ];
  faces.forEach(face => {
    for (let col = 0; col < windowCols; col++) {
      for (let row = 0; row < windowRows; row++) {
        const x = -width / 2 + (col + 0.5) * (width / windowCols);
        const y = -floors * floorHeight / 2 + (row + 0.5) * floorHeight;
        const winGeo = new THREE.BoxGeometry(0.06, 0.18, 0.02);
        const win = new THREE.Mesh(winGeo, accentMat);
        if (face.axis === 'z') win.position.set(x, y, face.val);
        else win.position.set(face.val, y, x);
        group.add(win);
      }
    }
  });
  const canopyGeo = new THREE.BoxGeometry(0.5, 0.08, 0.3);
  const canopy = new THREE.Mesh(canopyGeo, accentMat);
  canopy.position.set(0, -floors * floorHeight / 2 + 0.1, depth / 2 + 0.15);
  group.add(canopy);
  const spireGeo = new THREE.CylinderGeometry(0.015, 0.05, 1.2, 16);
  const spire = new THREE.Mesh(spireGeo, accentMat);
  spire.position.y = floors * floorHeight / 2 + 0.6;
  group.add(spire);
  const mechGeo = new THREE.BoxGeometry(0.6, 0.3, 0.4);
  const mech = new THREE.Mesh(mechGeo, wireMat);
  mech.position.y = floors * floorHeight / 2 + 0.15;
  group.add(mech);
  for (let i = 0; i < 3; i++) {
    const hvacGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 12);
    const hvac = new THREE.Mesh(hvacGeo, accentMat);
    hvac.position.set(-0.2 + i * 0.2, floors * floorHeight / 2 + 0.35, 0.1);
    group.add(hvac);
  }
  const baseGeo = new THREE.BoxGeometry(width + 0.5, 0.4, depth + 0.5);
  const base = new THREE.Mesh(baseGeo, wireMat);
  base.position.y = -floors * floorHeight / 2 - 0.2;
  group.add(base);
  for (let side of [-1, 1]) {
    const colGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12);
    const col = new THREE.Mesh(colGeo, accentMat);
    col.position.set(side * 0.2, -floors * floorHeight / 2 + 0.3, depth / 2 + 0.1);
    group.add(col);
  }
  return group;
}

function createRocketHD() {
  const group = new THREE.Group();
  const nozzleGeo = new THREE.CylinderGeometry(0.7, 0.35, 1.8, 48, 1, true);
  const nozzle = new THREE.Mesh(nozzleGeo, wireMat);
  nozzle.rotation.x = Math.PI / 2;
  group.add(nozzle);
  const lipGeo = new THREE.TorusGeometry(0.7, 0.04, 8, 48);
  const lip = new THREE.Mesh(lipGeo, accentMat);
  lip.rotation.x = Math.PI / 2;
  lip.position.z = -0.9;
  group.add(lip);
  const chamberGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.0, 32, 8);
  const chamber = new THREE.Mesh(chamberGeo, wireMat);
  chamber.rotation.x = Math.PI / 2;
  chamber.position.z = 1.4;
  group.add(chamber);
  const injectorGeo = new THREE.SphereGeometry(0.38, 32, 16);
  const injector = new THREE.Mesh(injectorGeo, accentMat);
  injector.position.z = 1.9;
  group.add(injector);
  const pumpGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.7, 16);
  for (let angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const pump = new THREE.Mesh(pumpGeo, accentMat);
    pump.rotation.x = Math.PI / 2;
    pump.rotation.z = angle;
    pump.position.set(Math.cos(angle) * 0.42, Math.sin(angle) * 0.42, 1.0);
    group.add(pump);
  }
  for (let z of [0.7, 1.0, 1.3, 1.6]) {
    const pipeGeo = new THREE.TorusGeometry(0.38, 0.025, 8, 48);
    const pipe = new THREE.Mesh(pipeGeo, accentMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.z = z;
    group.add(pipe);
  }
  const gimbalGeo = new THREE.TorusGeometry(0.4, 0.05, 8, 32);
  const gimbal = new THREE.Mesh(gimbalGeo, wireMat);
  gimbal.rotation.x = Math.PI / 2;
  gimbal.position.z = 0.4;
  group.add(gimbal);
  // Cooling channels (vertical lines on nozzle)
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const channelGeo = new THREE.CylinderGeometry(0.01, 0.01, 1.5, 6);
    const channel = new THREE.Mesh(channelGeo, accentMat);
    channel.position.set(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5, -0.1);
    channel.rotation.x = Math.PI / 2;
    group.add(channel);
  }
  const plumeGeo = new THREE.ConeGeometry(0.8, 1.5, 32, 1, true);
  const plumeMat = new THREE.MeshBasicMaterial({ color: 0xff6644, wireframe: true, transparent: true, opacity: 0.4 });
  const plume = new THREE.Mesh(plumeGeo, plumeMat);
  plume.rotation.x = -Math.PI / 2;
  plume.position.z = -1.65;
  group.add(plume);
  return group;
}

function createGPUHD() {
  const group = new THREE.Group();
  const pcbGeo = new THREE.BoxGeometry(2.8, 0.08, 2.0);
  const pcb = new THREE.Mesh(pcbGeo, wireMat);
  group.add(pcb);
  // PCB trace lines
  for (let i = 0; i < 20; i++) {
    const traceGeo = new THREE.BoxGeometry(0.01, 0.005, 1.8);
    const trace = new THREE.Mesh(traceGeo, accentMat);
    trace.position.set(-1.3 + i * 0.14, 0.04, 0);
    group.add(trace);
  }
  const dieGeo = new THREE.BoxGeometry(0.9, 0.12, 0.9);
  const die = new THREE.Mesh(dieGeo, accentMat);
  die.position.y = 0.08;
  group.add(die);
  // Sub-die sections
  for (let x = -0.3; x <= 0.3; x += 0.3) {
    for (let z = -0.3; z <= 0.3; z += 0.3) {
      const subGeo = new THREE.BoxGeometry(0.25, 0.06, 0.25);
      const sub = new THREE.Mesh(subGeo, wireMat);
      sub.position.set(x, 0.14, z);
      group.add(sub);
    }
  }
  const vramGeo = new THREE.BoxGeometry(0.22, 0.08, 0.22);
  const vramPositions = [
    { x: -0.7, z: 0 }, { x: 0.7, z: 0 }, { x: 0, z: -0.65 }, { x: 0, z: 0.65 },
    { x: -0.7, z: -0.65 }, { x: 0.7, z: -0.65 }, { x: -0.7, z: 0.65 }, { x: 0.7, z: 0.65 },
    { x: -0.7, z: -0.35 }, { x: -0.7, z: 0.35 }, { x: 0.7, z: -0.35 }, { x: 0.7, z: 0.35 },
  ];
  vramPositions.forEach(pos => {
    const vram = new THREE.Mesh(vramGeo, accentMat);
    vram.position.set(pos.x, 0.06, pos.z);
    group.add(vram);
  });
  const finCount = 16;
  for (let i = 0; i < finCount; i++) {
    const finGeo = new THREE.BoxGeometry(0.02, 0.3, 0.8);
    const fin = new THREE.Mesh(finGeo, wireMat);
    fin.position.set(-0.4 + i * 0.055, 0.22, 0);
    group.add(fin);
  }
  // Heat pipes
  for (let i = 0; i < 4; i++) {
    const pipeGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.5, 12);
    const pipe = new THREE.Mesh(pipeGeo, accentMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(0, 0.35, -0.5 + i * 0.33);
    group.add(pipe);
  }
  const pcieGeo = new THREE.BoxGeometry(0.8, 0.15, 0.08);
  const pcie = new THREE.Mesh(pcieGeo, accentMat);
  pcie.position.set(0, -0.05, -1.0);
  group.add(pcie);
  // PCIe pins
  for (let i = 0; i < 20; i++) {
    const pinGeo = new THREE.BoxGeometry(0.03, 0.02, 0.02);
    const pin = new THREE.Mesh(pinGeo, wireMat);
    pin.position.set(-0.35 + i * 0.037, -0.04, -1.04);
    group.add(pin);
  }
  const powerGeo = new THREE.BoxGeometry(0.18, 0.12, 0.1);
  for (let i = 0; i < 3; i++) {
    const power = new THREE.Mesh(powerGeo, accentMat);
    power.position.set(1.0, 0.08, -0.4 + i * 0.2);
    group.add(power);
  }
  const ballGeo = new THREE.SphereGeometry(0.02, 6, 6);
  for (let x = -1.2; x <= 1.2; x += 0.12) {
    for (let z = -0.8; z <= 0.8; z += 0.12) {
      const ball = new THREE.Mesh(ballGeo, accentMat);
      ball.position.set(x, -0.06, z);
      group.add(ball);
    }
  }
  const capGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8);
  const capPositions = [
    { x: -1.1, z: 0.7 }, { x: -1.1, z: -0.7 }, { x: 1.1, z: 0.7 }, { x: 1.1, z: -0.7 },
    { x: -0.5, z: 0.85 }, { x: 0.5, z: 0.85 }, { x: -0.5, z: -0.85 }, { x: 0.5, z: -0.85 },
  ];
  capPositions.forEach(pos => {
    const cap = new THREE.Mesh(capGeo, accentMat);
    cap.position.set(pos.x, 0.05, pos.z);
    group.add(cap);
  });
  return group;
}

function createTeslaHD() {
  const group = new THREE.Group();
  // Body — more detailed with curves
  const bodyGeo = new THREE.BoxGeometry(1.1, 0.6, 2.6, 4, 4, 4);
  const body = new THREE.Mesh(bodyGeo, wireMat);
  body.position.y = 0.35;
  group.add(body);
  // Front bumper
  const bumperGeo = new THREE.BoxGeometry(1.0, 0.2, 0.08);
  const bumper = new THREE.Mesh(bumperGeo, accentMat);
  bumper.position.set(0, 0.2, 1.28);
  group.add(bumper);
  // Rear bumper
  const rearBumperGeo = new THREE.BoxGeometry(1.0, 0.2, 0.08);
  const rearBumper = new THREE.Mesh(rearBumperGeo, accentMat);
  rearBumper.position.set(0, 0.2, -1.28);
  group.add(rearBumper);
  const cabinGeo = new THREE.BoxGeometry(1.0, 0.5, 1.5, 4, 4, 4);
  const cabin = new THREE.Mesh(cabinGeo, wireMat);
  cabin.position.set(0, 0.9, -0.1);
  group.add(cabin);
  const windshieldGeo = new THREE.PlaneGeometry(0.9, 0.55, 4, 4);
  const glassMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, wireframe: true, transparent: true, opacity: 0.5 });
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 0.9, 0.6);
  windshield.rotation.x = -0.4;
  group.add(windshield);
  const rearWindow = new THREE.Mesh(windshieldGeo, glassMat);
  rearWindow.position.set(0, 0.9, -0.8);
  rearWindow.rotation.x = 0.4;
  group.add(rearWindow);
  // Side windows
  for (let side of [-1, 1]) {
    const sideWinGeo = new THREE.PlaneGeometry(0.4, 0.3);
    const sideWin = new THREE.Mesh(sideWinGeo, glassMat);
    sideWin.position.set(side * 0.51, 0.9, -0.1);
    sideWin.rotation.y = side * Math.PI / 2;
    group.add(sideWin);
  }
  const doorGeo = new THREE.BoxGeometry(0.04, 0.55, 0.7);
  for (let side of [-1, 1]) {
    const door = new THREE.Mesh(doorGeo, accentMat);
    door.position.set(side * 0.52, 0.95, -0.1);
    door.rotation.z = side * 0.15;
    group.add(door);
  }
  // Wheels — detailed
  const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.14, 32);
  const wheelPositions = [
    { x: 0.52, z: 0.85 }, { x: -0.52, z: 0.85 },
    { x: 0.52, z: -0.85 }, { x: -0.52, z: -0.85 },
  ];
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, 0.2, pos.z);
    group.add(wheel);
    // Rim spokes
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spokeGeo = new THREE.BoxGeometry(0.02, 0.02, 0.15);
      const spoke = new THREE.Mesh(spokeGeo, accentMat);
      spoke.position.set(pos.x, 0.2, pos.z);
      spoke.rotation.z = Math.PI / 2;
      spoke.rotation.y = angle;
      group.add(spoke);
    }
    const rimGeo = new THREE.TorusGeometry(0.14, 0.02, 8, 24);
    const rim = new THREE.Mesh(rimGeo, accentMat);
    rim.rotation.y = Math.PI / 2;
    rim.position.set(pos.x, 0.2, pos.z);
    group.add(rim);
  });
  // Headlights
  const lightGeo = new THREE.BoxGeometry(0.3, 0.1, 0.06);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc, wireframe: true, emissive: 0xffffcc, emissiveIntensity: 0.3 });
  for (let side of [-1, 1]) {
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(side * 0.35, 0.42, 1.28);
    group.add(light);
  }
  // Taillights
  const tailLightGeo = new THREE.BoxGeometry(1.0, 0.07, 0.04);
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff2222, wireframe: true, emissive: 0xff2222, emissiveIntensity: 0.3 });
  const tailLight = new THREE.Mesh(tailLightGeo, tailLightMat);
  tailLight.position.set(0, 0.55, -1.28);
  group.add(tailLight);
  // Logo
  const logoGeo = new THREE.CircleGeometry(0.1, 16);
  const logoMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: true });
  const logo = new THREE.Mesh(logoGeo, logoMat);
  logo.position.set(0, 0.55, 1.31);
  group.add(logo);
  // Roof rails
  const railGeo = new THREE.BoxGeometry(0.04, 0.04, 1.4);
  for (let side of [-1, 1]) {
    const rail = new THREE.Mesh(railGeo, accentMat);
    rail.position.set(side * 0.47, 1.14, -0.1);
    group.add(rail);
  }
  // Side mirrors
  for (let side of [-1, 1]) {
    const mirrorGeo = new THREE.BoxGeometry(0.06, 0.08, 0.1);
    const mirror = new THREE.Mesh(mirrorGeo, accentMat);
    mirror.position.set(side * 0.58, 0.85, 0.55);
    group.add(mirror);
  }
  // Door handles
  for (let side of [-1, 1]) {
    for (let z of [-0.3, 0.3]) {
      const handleGeo = new THREE.BoxGeometry(0.03, 0.02, 0.08);
      const handle = new THREE.Mesh(handleGeo, accentMat);
      handle.position.set(side * 0.53, 0.7, z);
      group.add(handle);
    }
  }
  return group;
}

function createSatelliteHD() {
  const group = new THREE.Group();
  // Main body — octagonal cylinder
  const bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 8);
  const body = new THREE.Mesh(bodyGeo, wireMat);
  body.rotation.x = Math.PI / 2;
  group.add(body);
  // Body rings
  for (let z of [-0.4, 0, 0.4]) {
    const ringGeo = new THREE.TorusGeometry(0.28, 0.015, 8, 16);
    const ring = new THREE.Mesh(ringGeo, accentMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.z = z;
    group.add(ring);
  }
  // Solar panels — left and right
  for (let side of [-1, 1]) {
    const panelGeo = new THREE.BoxGeometry(0.04, 0.8, 2.0, 2, 4, 2);
    const panel = new THREE.Mesh(panelGeo, wireMat);
    panel.position.set(side * 0.8, 0, 0);
    group.add(panel);
    // Panel grid lines
    for (let gy = -0.35; gy <= 0.35; gy += 0.15) {
      const gridLineGeo = new THREE.BoxGeometry(0.01, 0.01, 1.9);
      const gridLine = new THREE.Mesh(gridLineGeo, accentMat);
      gridLine.position.set(side * 0.82, gy, 0);
      group.add(gridLine);
    }
    for (let gz = -0.85; gz <= 0.85; gz += 0.2) {
      const gridLineGeo = new THREE.BoxGeometry(0.01, 0.75, 0.01);
      const gridLine = new THREE.Mesh(gridLineGeo, accentMat);
      gridLine.position.set(side * 0.82, 0, gz);
      group.add(gridLine);
    }
    // Panel arms
    const armGeo = new THREE.BoxGeometry(0.5, 0.04, 0.04);
    const arm = new THREE.Mesh(armGeo, accentMat);
    arm.position.set(side * 0.35, 0, 0);
    group.add(arm);
  }
  // Antenna dish
  const dishGeo = new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const dish = new THREE.Mesh(dishGeo, wireMat);
  dish.rotation.x = Math.PI;
  dish.position.set(0, 0.3, -0.6);
  group.add(dish);
  const dishRimGeo = new THREE.TorusGeometry(0.2, 0.015, 8, 24);
  const dishRim = new THREE.Mesh(dishRimGeo, accentMat);
  dishRim.position.set(0, 0.3, -0.6);
  group.add(dishRim);
  // Feed horn
  const feedGeo = new THREE.CylinderGeometry(0.02, 0.04, 0.2, 8);
  const feed = new THREE.Mesh(feedGeo, accentMat);
  feed.position.set(0, 0.5, -0.6);
  group.add(feed);
  // Antenna mast
  const mastGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
  const mast = new THREE.Mesh(mastGeo, accentMat);
  mast.position.set(0, 0.5, -0.6);
  group.add(mast);
  // Top antenna
  const topAntGeo = new THREE.CylinderGeometry(0.01, 0.02, 0.5, 8);
  const topAnt = new THREE.Mesh(topAntGeo, accentMat);
  topAnt.position.set(0, 0.6, 0.3);
  group.add(topAnt);
  // Bottom thruster
  const thrusterGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.3, 12);
  const thruster = new THREE.Mesh(thrusterGeo, wireMat);
  thruster.position.set(0, -0.15, -0.3);
  group.add(thruster);
  // Thruster nozzle
  const nozzleGeo = new THREE.TorusGeometry(0.1, 0.015, 8, 16);
  const nozzle = new THREE.Mesh(nozzleGeo, accentMat);
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.set(0, -0.3, -0.3);
  group.add(nozzle);
  // Star trackers (small spheres)
  for (let angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const trackerGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const tracker = new THREE.Mesh(trackerGeo, accentMat);
    tracker.position.set(Math.cos(angle) * 0.28, 0, Math.sin(angle) * 0.28);
    group.add(tracker);
  }
  return group;
}

// --- Model Registry ---
const modelBuilders = {
  'a380-hd': createA380HD,
  'building-hd': createBuildingHD,
  'rocket-hd': createRocketHD,
  'gpu-hd': createGPUHD,
  'tesla-hd': createTeslaHD,
  'satellite-hd': createSatelliteHD,
};

// --- Load Model ---
export async function loadModel(name) {
  const loading = document.getElementById('loading-overlay');
  loading.classList.remove('hidden');
  while (modelGroup.children.length > 0) {
    modelGroup.remove(modelGroup.children[0]);
  }
  await new Promise(resolve => setTimeout(resolve, 200));
  if (modelBuilders[name]) {
    currentModel = modelBuilders[name]();
    modelGroup.add(currentModel);
    modelIndex = modelNames.indexOf(name);
    modelGroup.rotation.set(0, 0, 0);
    modelGroup.position.set(0, 0, 0);
    floatPhase = 0;
  }
  loading.classList.add('hidden');
}

export async function loadCustomModel(object) {
  const loading = document.getElementById('loading-overlay');
  loading.classList.remove('hidden');
  while (modelGroup.children.length > 0) {
    modelGroup.remove(modelGroup.children[0]);
  }
  await new Promise(resolve => setTimeout(resolve, 200));
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.5 / maxDim;
  object.position.sub(center);
  object.scale.setScalar(scale);
  object.traverse(child => {
    if (child.isMesh) {
      child.material = new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true, transparent: true, opacity: 0.9 });
    }
  });
  currentModel = object;
  modelGroup.add(object);
  floatPhase = 0;
  loading.classList.add('hidden');
}

// --- Transform ---
export function updateModelTransform({ rotateX, rotateY, zoom, panX, panY }) {
  if (!modelGroup) return;
  if (rotateX !== undefined) modelGroup.rotation.x += rotateX;
  if (rotateY !== undefined) modelGroup.rotation.y += rotateY;
  if (zoom !== undefined) {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    camera.position.addScaledVector(direction, -zoom * 2);
    const dist = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    if (dist < 2) camera.position.setLength(2);
    if (dist > 20) camera.position.setLength(20);
  }
  if (panX !== undefined || panY !== undefined) {
    const right = new THREE.Vector3();
    camera.getWorldDirection(new THREE.Vector3());
    right.crossVectors(camera.up, new THREE.Vector3(0, 1, 0)).normalize();
    if (panX !== undefined) camera.position.addScaledVector(right, panX * 3);
    if (panY !== undefined) camera.position.addScaledVector(camera.up, panY * 3);
  }
}

export function resetView() {
  camera.position.set(4, 2, 8);
  camera.lookAt(0, 0, 0);
  modelGroup.rotation.set(0, 0, 0);
  modelGroup.position.set(0, 0, 0);
  floatPhase = 0;
}

export function toggleWireframe() {
  wireframeMode = true;
}

export function cycleModel() {
  modelIndex = (modelIndex + 1) % modelNames.length;
  loadModel(modelNames[modelIndex]);
  document.querySelectorAll('.model-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.model === modelNames[modelIndex]);
  });
}

let isAutoRotating = true;

export function toggleAutoRotate() {
  isAutoRotating = !isAutoRotating;
}

export function getAutoRotate() {
  return isAutoRotating;
}

export function speedUpRotation() {
  autoRotateSpeed = 0.02;
  setTimeout(() => { autoRotateSpeed = 0.003; }, 1500);
}

const colorPresets = [
  { wire: 0x00ffcc, accent: 0xff44aa },
  { wire: 0xff8800, accent: 0xffcc00 },
  { wire: 0x4488ff, accent: 0x00ffcc },
  { wire: 0xff4444, accent: 0xff8800 },
  { wire: 0xffffff, accent: 0x888888 },
  { wire: 0x88ff00, accent: 0x00ff44 },
  { wire: 0xff00ff, accent: 0x8800ff },
];
let colorIndex = 0;

export function cycleWireframeColor() {
  colorIndex = (colorIndex + 1) % colorPresets.length;
  const preset = colorPresets[colorIndex];
  wireMat.color.set(preset.wire);
  accentMat.color.set(preset.accent);
}

export function resetCamera() {
  camera.position.set(4, 2, 8);
  camera.lookAt(0, 0, 0);
  modelGroup.rotation.set(0, 0, 0);
  modelGroup.position.set(0, 0, 0);
  floatPhase = 0;
  autoRotateSpeed = 0.003;
  isAutoRotating = true;
}

export { modelNames, modelGroup, camera, wireframeMode, autoRotateSpeed };