// ============================================================
// PDFPARSER.JS – PDF.js ile PDF'den Metin Çıkarma Motoru
// ============================================================
// Kullanım: window.FenAI.PdfParser.extractText(file) → Promise<string>
// ============================================================

window.FenAI = window.FenAI || {};

window.FenAI.PdfParser = (() => {

  const PDF_JS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDF_JS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  let pdfJsLoaded = false;

  function loadPdfJs() {
    return new Promise((resolve, reject) => {
      if (pdfJsLoaded || window.pdfjsLib) {
        pdfJsLoaded = true;
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = PDF_JS_CDN;
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER;
        pdfJsLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('PDF.js yüklenemedi.'));
      document.head.appendChild(script);
    });
  }

  async function extractText(file, onProgress) {
    await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      fullText += `\n--- SAYFA ${i} ---\n${pageText}`;
      if (onProgress) onProgress(Math.round((i / totalPages) * 100));
    }

    return fullText.trim();
  }

  // Metni olası soru bloklarına ayırır
  function splitIntoQuestions(text) {
    // "1." "2." "A)" gibi kalıpları başlangıç noktası olarak kullan
    const questionPattern = /(?=\n?\d{1,3}[\.\)]\s)/g;
    const blocks = text.split(questionPattern).filter(b => b.trim().length > 20);
    return blocks.map(b => b.trim());
  }

  return { extractText, splitIntoQuestions };

})();
