import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';

// --- State ---
let handsInstance = null;
let cameraInstance = null;
let videoEl = null;
let canvasEl = null;
let ctx = null;
let statusEl = null;

let gestureState = null;
let handLandmarks = [];

// --- Gesture Detection ---
function isFingerExtended(landmarks, tipIdx, pipIdx) {
  const wrist = landmarks[0];
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const wristToTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y, tip.z - wrist.z);
  const wristToPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y, pip.z - wrist.z);
  return wristToTip > wristToPip * 1.02;
}

function isPinchGesture(landmarks) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const dist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y, thumbTip.z - indexTip.z);
  return dist < 0.12;
}

function isFist(landmarks) {
  return !isFingerExtended(landmarks, 8, 6) &&
         !isFingerExtended(landmarks, 12, 10) &&
         !isFingerExtended(landmarks, 16, 14) &&
         !isFingerExtended(landmarks, 20, 18);
}

function isPeaceSign(landmarks) {
  return isFingerExtended(landmarks, 8, 6) &&
         isFingerExtended(landmarks, 12, 10) &&
         !isFingerExtended(landmarks, 16, 14) &&
         !isFingerExtended(landmarks, 20, 18);
}

function isOpenPalm(landmarks) {
  return isFingerExtended(landmarks, 4, 3) &&
         isFingerExtended(landmarks, 8, 6) &&
         isFingerExtended(landmarks, 12, 10) &&
         isFingerExtended(landmarks, 16, 14) &&
         isFingerExtended(landmarks, 20, 18);
}

function isRockOn(landmarks) {
  return isFingerExtended(landmarks, 8, 6) &&
         !isFingerExtended(landmarks, 12, 10) &&
         !isFingerExtended(landmarks, 16, 14) &&
         isFingerExtended(landmarks, 20, 18);
}

// --- Results Callback ---
let prevCenter = null;
let prevTwoHandDist = null;

function onResults(results) {
  if (!ctx || !canvasEl) return;

  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  if (results.image) {
    ctx.save();
    ctx.drawImage(results.image, 0, 0, canvasEl.width, canvasEl.height);
    ctx.restore();
  }

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    handLandmarks = results.multiHandLandmarks;

    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
        color: '#00FF88', lineWidth: 2,
      });
      drawLandmarks(ctx, landmarks, {
        color: '#FF4466', lineWidth: 1, radius: 3,
      });
    }

    const primaryHand = results.multiHandLandmarks[0];
    const center = { x: primaryHand[9].x, y: primaryHand[9].y };

    let gestureType = 'unknown';
    let gestureLabel = 'Hand detected';

    if (results.multiHandLandmarks.length === 2) {
      const h1 = results.multiHandLandmarks[0][9];
      const h2 = results.multiHandLandmarks[1][9];
      const dist = Math.hypot(h1.x - h2.x, h1.y - h2.y);

      if (isPinchGesture(results.multiHandLandmarks[0]) && isPinchGesture(results.multiHandLandmarks[1])) {
        gestureType = 'two-hand-pinch';
        gestureLabel = 'Two-hand Pinch — Zoom';
      }

      if (prevTwoHandDist !== null) {
        gestureState = {
          type: gestureType || 'two-hand-pinch',
          label: gestureLabel,
          zoomDelta: dist - prevTwoHandDist,
          deltaX: 0, deltaY: 0,
        };
      }
      prevTwoHandDist = dist;
      prevCenter = null;
      return;
    }

    prevTwoHandDist = null;

    if (isPinchGesture(primaryHand)) {
      gestureType = 'pinch';
      gestureLabel = 'Pinch — Rotate';
    } else if (isFist(primaryHand)) {
      gestureType = 'fist';
      gestureLabel = 'Fist — Reset (hold)';
    } else if (isPeaceSign(primaryHand)) {
      gestureType = 'peace';
      gestureLabel = 'Peace — Next Model';
    } else if (isRockOn(primaryHand)) {
      gestureType = 'rock-on';
      gestureLabel = 'Rock On — Color';
    } else if (isOpenPalm(primaryHand)) {
      gestureType = 'open-palm';
      gestureLabel = 'Open Palm — Pan';
    }

    let deltaX = 0, deltaY = 0;
    if (prevCenter) {
      deltaX = center.x - prevCenter.x;
      deltaY = center.y - prevCenter.y;
    }

    gestureState = {
      type: gestureType,
      label: gestureLabel,
      deltaX,
      deltaY,
      zoomDelta: 0,
    };

    prevCenter = center;
  } else {
    handLandmarks = [];
    gestureState = null;
    prevCenter = null;
    prevTwoHandDist = null;
  }
}

// --- Initialize ---
export async function initHandTracking(video, canvas, status) {
  videoEl = video;
  canvasEl = canvas;
  statusEl = status;
  ctx = canvas.getContext('2d');

  canvas.width = 320;
  canvas.height = 240;

  handsInstance = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
  });

  handsInstance.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.4,
  });

  handsInstance.onResults(onResults);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
    });
    video.srcObject = stream;
    await video.play();

    cameraInstance = new Camera(video, {
      onFrame: async () => {
        await handsInstance.send({ image: video });
      },
      width: 640,
      height: 480,
    });
    cameraInstance.start();

    statusEl.textContent = 'Camera ready — show your hand';
  } catch (err) {
    statusEl.textContent = 'Camera error: ' + err.message;
    console.error('Camera error:', err);
  }
}

export function getGestureState() {
  return gestureState;
}

export function getHandLandmarks() {
  return handLandmarks;
}