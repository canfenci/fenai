// ============================================================
// WORD.JS – Geriye Dönük Uyumluluk Köprüsü
// ============================================================

function parseMarkdownToDocx(markdownText, docxLib) {
  return window.FenAI.ExportEngine.parseMarkdownToDocx(markdownText, docxLib);
}

function markdownToHtml(markdown) {
  return window.FenAI.ExportEngine.markdownToHtml(markdown);
}

async function downloadWord(outputId, filename) {
  return await window.FenAI.ExportEngine.downloadWord(outputId, filename);
}