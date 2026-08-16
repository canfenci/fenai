// ============================================================
// API.JS – Geriye Dönük Uyumluluk Köprüsü
// ============================================================

async function unifiedAiGenerate(prompt, systemPrompt, targetModule, sinif, unite) {
  return await window.FenAI.AIEngine.generate(prompt, systemPrompt, targetModule, sinif, unite);
}

function updateRoutedBadge(module, text, className) {
  const badge = document.getElementById(`routed-badge-${module}`);
  if (badge) {
    badge.textContent = text;
    badge.className = `badge ${className}`;
  }
}

async function getFinalPrompt(prompt, moduleName) {
  return await window.FenAI.PromptEngine.getFinalPrompt(prompt, moduleName);
}

// Bireysel sağlayıcıların geriye uyumluluk fonksiyonları
async function callGemini(prompt, systemInstruction) {
  return await window.FenAI.Providers.callGemini(prompt, systemInstruction);
}

async function callDeepSeekDirect(prompt, systemPrompt) {
  return await window.FenAI.Providers.callDeepSeekDirect(prompt, systemPrompt);
}

async function callOpenRouterDirect(prompt, model, systemPrompt) {
  return await window.FenAI.Providers.callOpenRouterDirect(prompt, model, systemPrompt);
}

async function callClaudeDirect(prompt, systemPrompt) {
  return await window.FenAI.Providers.callClaudeDirect(prompt, systemPrompt);
}

async function callNvidiaNimDirect(prompt, systemPrompt) {
  return await window.FenAI.Providers.callNvidiaNimDirect(prompt, systemPrompt);
}

async function callOpenAiDirect(prompt, systemPrompt) {
  return await window.FenAI.Providers.callOpenAiDirect(prompt, systemPrompt);
}

async function callPerplexityDirect(prompt, systemPrompt) {
  return await window.FenAI.Providers.callPerplexityDirect(prompt, systemPrompt);
}