// ============================================================
// UI.JS – Geriye Dönük Uyumluluk Köprüsü
// ============================================================

// Global rawOutputs referansı
const rawOutputs = new Proxy({}, {
  get(target, prop) {
    const raw = window.FenAI.AppState.get('rawOutputs');
    return raw ? raw[prop] : '';
  },
  set(target, prop, value) {
    const raw = window.FenAI.AppState.get('rawOutputs');
    raw[prop] = value;
    window.FenAI.AppState.set('rawOutputs', raw);
    return true;
  }
});

function showToast(msg, type = 'info') {
  window.FenAI.UIEngine.showToast(msg, type);
}

function setLoading(mod, state) {
  window.FenAI.UIEngine.setLoading(mod, state);
}

function processAndRenderOutput(elementId, rawText) {
  window.FenAI.UIEngine.renderMarkdown(elementId, rawText);
}

function copyOutput(id) {
  window.FenAI.UIEngine.copyOutput(id);
}