import * as THREE from 'three';
import JSZip from 'jszip';
import { Archive } from 'libarchive.js';
import { loadCustomModel } from './scene.js';

// --- Initialize libarchive.js ---
let archiveReady = false;
try {
  Archive.init({ workerUrl: '/worker-bundle.js' });
  archiveReady = true;
  console.log('libarchive.js worker ready');
} catch (err) {
  console.warn('libarchive.js init failed, .rar/.7z support disabled:', err);
}

// Supported extensions
const MODEL_EXTENSIONS = ['glb', 'gltf', 'obj', 'fbx', 'stl', 'dae', '3ds', 'ply', 'usdz'];
const ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];

// --- Setup File Import ---
export function setupImport() {
  const fileInput = document.getElementById('file-input');
  const folderInput = document.getElementById('folder-input');
  const statusEl = document.getElementById('import-status');

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      await processFiles(files, statusEl);
    });
  }

  if (folderInput) {
    folderInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      showStatus(statusEl, `Processing folder: ${files.length} files...`, 'loading');
      const modelFiles = files.filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        return MODEL_EXTENSIONS.includes(ext);
      });
      if (modelFiles.length === 0) {
        showStatus(statusEl, 'No 3D model files found in folder', 'error');
        return;
      }
      await loadModelFile(modelFiles[0], statusEl);
    });
  }

  // Drag and drop
  const container = document.getElementById('canvas-container');
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    container.classList.add('drag-over');
  });
  container.addEventListener('dragleave', () => {
    container.classList.remove('drag-over');
  });
  container.addEventListener('drop', async (e) => {
    e.preventDefault();
    container.classList.remove('drag-over');
    const items = e.dataTransfer.items;
    if (!items) return;
    const files = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) {
        await traverseFileTree(item, files);
      }
    }
    if (files.length === 0) {
      files.push(...Array.from(e.dataTransfer.files));
    }
    if (files.length > 0) {
      await processFiles(files, statusEl);
    }
  });
}

function showStatus(el, text, cls) {
  if (el) {
    el.textContent = text;
    el.className = 'status-text ' + cls;
  }
}

async function traverseFileTree(entry, files) {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file) => { files.push(file); resolve(); });
    });
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    return new Promise((resolve) => {
      reader.readEntries(async (entries) => {
        for (const child of entries) {
          await traverseFileTree(child, files);
        }
        resolve();
      });
    });
  }
}

async function processFiles(files, statusEl) {
  for (const file of files) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ARCHIVE_EXTENSIONS.includes(ext)) {
      showStatus(statusEl, `Extracting: ${file.name}...`, 'loading');

      try {
        const modelFile = await extractArchive(file, statusEl);
        if (modelFile) {
          await loadModelFile(modelFile, statusEl);
          return;
        } else {
          showStatus(statusEl, 'No 3D model found in archive', 'error');
        }
      } catch (err) {
        showStatus(statusEl, `Extraction error: ${err.message}`, 'error');
        console.error('Archive extraction error:', err);
      }
    } else if (MODEL_EXTENSIONS.includes(ext)) {
      await loadModelFile(file, statusEl);
      return;
    } else {
      showStatus(statusEl, `Unsupported: .${ext}`, 'error');
    }
  }
}

async function extractArchive(file, statusEl) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'zip') {
    // JSZip for .zip — fast and reliable
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const files = Object.keys(zip.files).filter(name => {
      const e = name.split('.').pop().toLowerCase();
      return MODEL_EXTENSIONS.includes(e) && !zip.files[name].dir;
    });
    if (files.length === 0) return null;
    const modelPath = files[0];
    const modelData = await zip.files[modelPath].async('blob');
    return new File([modelData], modelPath.split('/').pop(), { type: 'application/octet-stream' });
  }

  // libarchive.js for .rar, .7z, .tar, .gz, .bz2
  if (!archiveReady) {
    throw new Error('Archive extractor not ready. For .rar/.7z files, please extract manually and import the 3D file directly.');
  }

  showStatus(statusEl, `Opening archive: ${file.name}...`, 'loading');

  // Use a timeout to prevent hanging
  const archive = await Promise.race([
    Archive.open(file),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Archive extraction timed out')), 30000))
  ]);

  const extractedFiles = await archive.getFilesArray();

  const modelEntry = extractedFiles.find(entry => {
    const e = entry.file.name.split('.').pop().toLowerCase();
    return MODEL_EXTENSIONS.includes(e);
  });

  if (!modelEntry) return null;

  const modelData = await modelEntry.file.extract();
  return new File([modelData.data], modelEntry.file.name, { type: 'application/octet-stream' });
}

async function loadModelFile(file, statusEl) {
  const ext = file.name.split('.').pop().toLowerCase();
  showStatus(statusEl, `Loading: ${file.name}...`, 'loading');

  try {
    const url = URL.createObjectURL(file);
    let object;

    switch (ext) {
      case 'glb':
      case 'gltf':
        object = await loadGLTF(url);
        break;
      case 'obj':
        object = await loadOBJ(url);
        break;
      case 'fbx':
        object = await loadFBX(url);
        break;
      case 'stl':
        object = await loadSTL(url);
        break;
      case 'dae':
        object = await loadCollada(url);
        break;
      case 'ply':
        object = await loadPLY(url);
        break;
      default:
        throw new Error(`Unsupported format: .${ext}`);
    }

    URL.revokeObjectURL(url);
    await loadCustomModel(object);
    showStatus(statusEl, `Loaded: ${file.name}`, 'success');

    document.querySelectorAll('.model-btn').forEach(btn => {
      btn.classList.remove('active');
    });

  } catch (err) {
    showStatus(statusEl, `Error: ${err.message}`, 'error');
    console.error('Import error:', err);
  }
}

async function loadGLTF(url) {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf.scene), undefined,
      (err) => reject(new Error(`GLTF load failed: ${err.message}`)));
  });
}

async function loadOBJ(url) {
  const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
  const loader = new OBJLoader();
  return new Promise((resolve, reject) => {
    loader.load(url, (obj) => resolve(obj), undefined,
      (err) => reject(new Error(`OBJ load failed: ${err.message}`)));
  });
}

async function loadFBX(url) {
  const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
  const loader = new FBXLoader();
  return new Promise((resolve, reject) => {
    loader.load(url, (fbx) => resolve(fbx), undefined,
      (err) => reject(new Error(`FBX load failed: ${err.message}`)));
  });
}

async function loadSTL(url) {
  const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
  const loader = new STLLoader();
  return new Promise((resolve, reject) => {
    loader.load(url, (geometry) => {
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ffcc, wireframe: true, transparent: true, opacity: 0.9,
      });
      resolve(new THREE.Mesh(geometry, material));
    }, undefined, (err) => reject(new Error(`STL load failed: ${err.message}`)));
  });
}

async function loadCollada(url) {
  const { ColladaLoader } = await import('three/examples/jsm/loaders/ColladaLoader.js');
  const loader = new ColladaLoader();
  return new Promise((resolve, reject) => {
    loader.load(url, (collada) => resolve(collada.scene), undefined,
      (err) => reject(new Error(`Collada load failed: ${err.message}`)));
  });
}

async function loadPLY(url) {
  const { PLYLoader } = await import('three/examples/jsm/loaders/PLYLoader.js');
  const loader = new PLYLoader();
  return new Promise((resolve, reject) => {
    loader.load(url, (geometry) => {
      geometry.computeVertexNormals();
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ffcc, wireframe: true, transparent: true, opacity: 0.9,
      });
      resolve(new THREE.Mesh(geometry, material));
    }, undefined, (err) => reject(new Error(`PLY load failed: ${err.message}`)));
  });
}