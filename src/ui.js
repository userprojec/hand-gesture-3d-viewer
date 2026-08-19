import { loadModel } from './scene.js';

export function setupUI() {
  document.querySelectorAll('.model-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modelName = btn.dataset.model;
      if (modelName) {
        loadModel(modelName);
        document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });
}