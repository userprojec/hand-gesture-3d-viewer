import * as THREE from 'three';
console.log('PolarGridHelper:', typeof THREE.PolarGridHelper);
console.log('Keys with polar:', Object.keys(THREE).filter(k => k.toLowerCase().includes('polar')));
console.log('Revision:', THREE.REVISION);