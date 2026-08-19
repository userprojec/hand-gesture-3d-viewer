import { initScene, loadModel, updateModelTransform, resetView, cycleModel, cycleWireframeColor } from './scene.js';
import { initHandTracking, getGestureState } from './gestures.js';
import { setupImport } from './import.js';
import { setupUI } from './ui.js';

async function init() {
  initScene(document.getElementById('canvas-container'));
  await loadModel('a380-hd');
  setupUI();
  setupImport();
  await initHandTracking(
    document.getElementById('webcam-video'),
    document.getElementById('hand-canvas'),
    document.getElementById('gesture-status')
  );
  animate();
}

let lastGesture = null;
let fistTimer = 0;
let lastModelCycle = 0;
let lastRockOn = 0;

const ROTATE_SENSITIVITY = 5.0;
const ZOOM_SENSITIVITY = 10.0;
const PAN_SENSITIVITY = 6.0;

function animate() {
  requestAnimationFrame(animate);

  const gesture = getGestureState();

  if (gesture) {
    const statusEl = document.getElementById('gesture-status');
    if (gesture.type !== lastGesture?.type) {
      statusEl.textContent = gesture.label;
      statusEl.className = 'gesture-' + gesture.type;
    }

    switch (gesture.type) {
      case 'pinch':
        if (Math.abs(gesture.deltaX) > 0.0005 || Math.abs(gesture.deltaY) > 0.0005) {
          updateModelTransform({
            rotateX: gesture.deltaY * ROTATE_SENSITIVITY,
            rotateY: gesture.deltaX * ROTATE_SENSITIVITY,
          });
        }
        break;

      case 'two-hand-pinch':
        if (Math.abs(gesture.zoomDelta) > 0.0003) {
          updateModelTransform({ zoom: gesture.zoomDelta * ZOOM_SENSITIVITY });
        }
        break;

      case 'open-palm':
        if (Math.abs(gesture.deltaX) > 0.0005 || Math.abs(gesture.deltaY) > 0.0005) {
          updateModelTransform({
            panX: gesture.deltaX * PAN_SENSITIVITY,
            panY: gesture.deltaY * PAN_SENSITIVITY,
          });
        }
        break;

      case 'fist':
        fistTimer += 16;
        if (fistTimer > 800) {
          resetView();
          fistTimer = 0;
          statusEl.textContent = 'View Reset!';
          setTimeout(() => { statusEl.textContent = gesture.label; }, 800);
        }
        break;

      case 'peace':
        if (Date.now() - lastModelCycle > 1200) {
          cycleModel();
          lastModelCycle = Date.now();
          statusEl.textContent = 'Next model!';
          setTimeout(() => { statusEl.textContent = gesture.label; }, 800);
        }
        break;

      case 'rock-on':
        if (Date.now() - lastRockOn > 1200) {
          cycleWireframeColor();
          lastRockOn = Date.now();
          statusEl.textContent = 'Color changed!';
          setTimeout(() => { statusEl.textContent = gesture.label; }, 800);
        }
        break;
    }

    lastGesture = gesture;
  } else {
    document.getElementById('gesture-status').textContent = 'No hand detected';
    document.getElementById('gesture-status').className = '';
    fistTimer = 0;
    lastGesture = null;
  }
}

init().catch(err => {
  console.error('App init failed:', err);
  document.getElementById('gesture-status').textContent = 'Error: ' + err.message;
});