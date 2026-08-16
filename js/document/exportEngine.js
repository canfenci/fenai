// ============================================================
// EXPORTENGINE.JS – Word (.docx, .doc) ve HTML Dışa Aktarma Katmanı
// ============================================================

window.FenAI = window.FenAI || {};

window.FenAI.ExportEngine = (() => {
  function toast(msg, type) {
    if (window.FenAI.UIEngine) {
      window.FenAI.UIEngine.showToast(msg, type);
    } else if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  }

  function markdownToHtml(markdown) {
    return typeof marked !== 'undefined' ? marked.parse(markdown) : markdown;
  }

  function parseMarkdownToDocx(markdownText, docxLib) {
    if (!docxLib) {
      return { isHtml: true, content: markdownToHtml(markdownText) };
    }
    const { Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = docxLib;
    const lines = markdownText.split('\n');
    const docElements = [];
    
    function parseInlineStyles(text) {
      const runs = [];
      const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const matchIndex = match.index;
        if (matchIndex > lastIndex) {
          runs.push(new TextRun({ text: text.substring(lastIndex, matchIndex) }));
        }
        if (match[2]) {
          runs.push(new TextRun({ text: match[2], bold: true }));
        } else if (match[4]) {
          runs.push(new TextRun({ text: match[4], italic: true }));
        }
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < text.length) {
        runs.push(new TextRun({ text: text.substring(lastIndex) }));
      }
      return runs.length > 0 ? runs : [new TextRun({ text: text })];
    }

    try {
      let inTable = false;
      let tableRows = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|')) {
          inTable = true;
          const cols = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
          if (cols.every(c => c.match(/^:+|-+:*$/) || c === '')) continue;
          if (cols.length > 0) {
            const cells = cols.map(col => new TableCell({
              children: [new Paragraph({ children: parseInlineStyles(col) })],
              margins: { top: 100, bottom: 100, left: 100, right: 100 }
            }));
            tableRows.push(new TableRow({ children: cells }));
          }
          continue;
        } else if (inTable) {
          if (tableRows.length > 0) {
            docElements.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            docElements.push(new Paragraph({ text: "" }));
          }
          inTable = false;
          tableRows = [];
        }
        if (line === '') { docElements.push(new Paragraph({ text: "" })); continue; }
        if (line.startsWith('# ')) {
          docElements.push(new Paragraph({ children: [new TextRun({ text: line.slice(2), bold: true, color: "6c63ff", size: 28 })], spacing: { before: 240, after: 120 } }));
        } else if (line.startsWith('## ')) {
          docElements.push(new Paragraph({ children: [new TextRun({ text: line.slice(3), bold: true, color: "00c9a7", size: 22 })], spacing: { before: 200, after: 100 } }));
        } else if (line.startsWith('### ')) {
          docElements.push(new Paragraph({ children: [new TextRun({ text: line.slice(4), bold: true, color: "ffb347", size: 18 })], spacing: { before: 160, after: 80 } }));
        } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
          docElements.push(new Paragraph({ children: parseInlineStyles(line.slice(2)), bullet: { level: 0 }, spacing: { before: 60, after: 60 } }));
        } else if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.*)/);
          if (match) {
            const num = match[1]; const content = match[2];
            docElements.push(new Paragraph({ children: [ new TextRun({ text: num + ". ", bold: true }), ...parseInlineStyles(content) ], spacing: { before: 60, after: 60 } }));
          } else {
            docElements.push(new Paragraph({ children: parseInlineStyles(line), spacing: { before: 120, after: 120 } }));
          }
        } else {
          docElements.push(new Paragraph({ children: parseInlineStyles(line), spacing: { before: 120, after: 120 } }));
        }
      }
      if (inTable && tableRows.length > 0) {
        docElements.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      }
    } catch (parseError) {
      console.warn("Docx parser failed, degrading to plain paragraphs fallback:", parseError);
      docElements.length = 0;
      lines.forEach(l => {
        docElements.push(new Paragraph({ children: [new TextRun({ text: l })] }));
      });
    }
    return { isHtml: false, elements: docElements };
  }

  async function fetchImageAsBuffer(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Image download failed status=" + response.status);
    return await response.arrayBuffer();
  }

  let workspaceDirHandle = null;

  async function getWorkspaceDirectory() {
    if (workspaceDirHandle) {
      const options = { mode: 'readwrite' };
      try {
        if ((await workspaceDirHandle.queryPermission(options)) === 'granted') {
          return workspaceDirHandle;
        }
        if ((await workspaceDirHandle.requestPermission(options)) === 'granted') {
          return workspaceDirHandle;
        }
      } catch (e) {
        workspaceDirHandle = null;
      }
    }
    try {
      if (typeof window.showDirectoryPicker === 'function') {
        toast('Belgelerinizi assets/belgeler klasörüne kaydetmek için lütfen bilgisayarınızdaki "FenAI" ana klasörünü seçin.', 'info');
        const handle = await window.showDirectoryPicker();
        const options = { mode: 'readwrite' };
        if ((await handle.requestPermission(options)) === 'granted') {
          workspaceDirHandle = handle;
          return workspaceDirHandle;
        }
      }
    } catch (err) {
      console.warn("Klasör seçici reddedildi veya desteklenmiyor:", err);
    }
    return null;
  }

  async function saveBlobToLocalWorkspace(blob, filename, extension) {
    try {
      const dirHandle = await getWorkspaceDirectory();
      if (dirHandle) {
        const assetsHandle = await dirHandle.getDirectoryHandle('assets', { create: true });
        const belgelerHandle = await assetsHandle.getDirectoryHandle('belgeler', { create: true });
        const finalFilename = `${filename}_tymm.${extension}`;
        const fileHandle = await belgelerHandle.getFileHandle(finalFilename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      }
    } catch (err) {
      console.error("Yerel dizine dosya yazılamadı:", err);
    }
    return false;
  }

  return {
    markdownToHtml,
    parseMarkdownToDocx,
    fetchImageAsBuffer,
    getWorkspaceDirectory,
    saveBlobToLocalWorkspace,

    async downloadWord(outputId, filename) {
      const mod = outputId.replace('output-', '');
      const rawOutputs = window.FenAI.AppState.get('rawOutputs') || {};
      const markdownText = rawOutputs[mod];
      
      if (!markdownText) {
        toast('İndirilecek içerik bulunamadı. Lütfen önce içerik üretin!', 'error');
        return;
      }

      let docxLib = window.docx || window.Docx || (typeof docx !== 'undefined' ? docx : null);
      let deneme = 0;
      while (!docxLib && deneme < 5) {
        await new Promise(resolve => setTimeout(resolve, 500));
        docxLib = window.docx || window.Docx || (typeof docx !== 'undefined' ? docx : null);
        deneme++;
      }

      if (!docxLib) {
        toast('Docx kütüphanesi yüklenemedi, HTML tabanlı .doc dosyası indiriliyor...', 'info');
        try {
          const htmlContent = markdownToHtml(markdownText);
          const fullHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset="utf-8"><title>${filename}</title></head>
            <body>${htmlContent}</body>
            </html>`;
          const blob = new Blob([fullHtml], { type: 'application/msword' });
          
          const saved = await saveBlobToLocalWorkspace(blob, filename, 'doc');
          if (saved) {
            toast(`Belge başarıyla assets/belgeler/${filename}_tymm.doc konumuna kaydedildi!`, 'success');
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}_tymm.doc`;
            a.click();
            URL.revokeObjectURL(url);
            toast('Yedek .doc dosyası indirildi! (Word ile açabilirsiniz)', 'success');
          }
          return;
        } catch (e) {
          toast('Yedek indirme de başarısız: ' + e.message, 'error');
          return;
        }
      }

      // Normal docx oluştur
      try {
        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, AlignmentType, BorderStyle } = docxLib;
        
        let headerElements = [];
        try {
          let buffer;
          if (window.CanFenciLogoBase64) {
            const binaryString = atob(window.CanFenciLogoBase64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            buffer = bytes.buffer;
          } else {
            buffer = await fetchImageAsBuffer('assets/icons/icon.png');
          }
          
          const logoImage = new ImageRun({
            data: buffer,
            transformation: {
              width: 48,
              height: 48
            }
          });
          
          // Test kitabı stilinde tablo banner
          const headerTable = new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [logoImage], alignment: AlignmentType.CENTER })],
                    width: { size: 15, type: docxLib.WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.SINGLE, size: 12, color: "6c63ff" },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE }
                    }
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "CANFENCI TEACHER STUDIO", bold: true, color: "6c63ff", size: 24 }),
                          new TextRun({ text: "\n" + filename.toUpperCase().replace(/_/g, ' ') + " · ÖZEL PEDAGOJİK SERİSİ", size: 16, color: "8888aa" })
                        ],
                        alignment: AlignmentType.LEFT
                      })
                    ],
                    width: { size: 85, type: docxLib.WidthType.PERCENTAGE },
                    margins: { left: 150 },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.SINGLE, size: 12, color: "6c63ff" },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE }
                    }
                  })
                ]
              })
            ],
            width: { size: 100, type: docxLib.WidthType.PERCENTAGE }
          });
          
          headerElements.push(headerTable);
          headerElements.push(new Paragraph({ text: "" })); // Spacing
        } catch (imgError) {
          console.warn("Logo loading failed for docx export, using text banner fallback:", imgError);
          headerElements.push(new Paragraph({
            children: [
              new TextRun({ text: "CANFENCI TEACHER STUDIO\n", bold: true, color: "6c63ff", size: 24 }),
              new TextRun({ text: filename.toUpperCase().replace(/_/g, ' '), size: 16, color: "8888aa" })
            ]
          }));
        }

        const result = parseMarkdownToDocx(markdownText, docxLib);
        if (result.isHtml) {
          const blob = new Blob([result.content], { type: 'application/msword' });
          const saved = await saveBlobToLocalWorkspace(blob, filename, 'doc');
          if (saved) {
            toast(`Belge başarıyla assets/belgeler/${filename}_tymm.doc konumuna kaydedildi!`, 'success');
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}_tymm.doc`;
            a.click();
            URL.revokeObjectURL(url);
            toast('Yedek .doc dosyası indirildi!', 'success');
          }
          return;
        }

        const doc = new Document({
          sections: [{
            headers: {
              default: new docxLib.Header({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "CanFenci Teacher Studio · Pedagojik Yayıncılık", size: 14, color: "8888aa" })
                    ],
                    alignment: AlignmentType.RIGHT
                  })
                ]
              })
            },
            footers: {
              default: new docxLib.Footer({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "CanFenci © 2026 · Türkiye Yüzyılı Maarif Modeline Uygundur", size: 14, color: "8888aa" })
                    ],
                    alignment: AlignmentType.CENTER
                  })
                ]
              })
            },
            children: [...headerElements, ...result.elements]
          }]
        });

        const blob = await Packer.toBlob(doc);
        const saved = await saveBlobToLocalWorkspace(blob, filename, 'docx');
        if (saved) {
          toast(`Belge başarıyla assets/belgeler/${filename}_tymm.docx konumuna kaydedildi!`, 'success');
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}_tymm.docx`;
          a.click();
          URL.revokeObjectURL(url);
          toast('Word (.docx) belgesi başarıyla indirildi!', 'success');
        }
      } catch(e) {
        console.error(e);
        toast('Word dönüştürme hatası: ' + e.message, 'error');
      }
    },

    async downloadPDF(outputId, filename) {
      const outputElem = document.getElementById(outputId);
      if (!outputElem || !outputElem.innerText.trim()) {
        toast('İndirilecek içerik bulunamadı. Lütfen önce içerik üretin!', 'error');
        return;
      }
      toast('PDF baskı / kaydetme ekranı hazırlanıyor...', 'info');
      window.print();
    },

    async downloadHTML(outputId, filename) {
      const outputElem = document.getElementById(outputId);
      if (!outputElem || !outputElem.innerText.trim()) {
        toast('İndirilecek içerik bulunamadı. Lütfen önce içerik üretin!', 'error');
        return;
      }

      const contentHtml = outputElem.innerHTML;
      const fullHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${filename} – CanFenci Teacher Studio</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f0f1a; color: #e0e0f0; padding: 40px; line-height: 1.6; }
    .card { background: #1a1a2e; border: 1px solid #2a2a4a; padding: 24px; border-radius: 12px; margin-bottom: 20px; }
    h1, h2, h3 { color: #6c63ff; }
    .hero-title { border-bottom: 2px solid #6c63ff; padding-bottom: 12px; }
    .badge { background: #00c9a7; color: #000; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h1 class="hero-title">🧬 CanFenci Pedagojik Yayıncılık</h1>
      <span class="badge">TYMM Uyumlu</span>
    </div>
    ${contentHtml}
    <hr style="border-color:#2a2a4a; margin-top:30px;">
    <p style="text-align:center; color:#8888aa; font-size:0.8rem;">CanFenci © 2026 · Türkiye Yüzyılı Maarif Modeline Uygundur</p>
  </div>
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: 'text/html' });
      const savedLocally = await saveBlobToLocalWorkspace(blob, filename, 'html');
      if (savedLocally) {
        toast(`HTML belgesi assets/belgeler/${filename}_tymm.html konumuna kaydedildi!`, 'success');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_tymm.html`;
        a.click();
        URL.revokeObjectURL(url);
        toast('İnteraktif HTML belgesi başarıyla indirildi!', 'success');
      }
    },

    async downloadPowerPoint(outputId, filename) {
      const mod = outputId.replace('output-', '');
      const rawOutputs = window.FenAI.AppState.get('rawOutputs') || {};
      const markdownText = rawOutputs[mod];
      
      if (!markdownText) {
        toast('İndirilecek içerik bulunamadı. Lütfen önce içerik üretin!', 'error');
        return;
      }

      let pptxLib = window.PptxGenJS || window.pptxgen || (typeof PptxGenJS !== 'undefined' ? PptxGenJS : null);
      if (!pptxLib) {
        toast('PowerPoint (.pptx) kütüphanesi yüklenemedi. Lütfen internet bağlantınızı kontrol edin.', 'error');
        return;
      }

      try {
        const pptx = new pptxLib();
        pptx.layout = 'LAYOUT_16x9';

        const components = window.CanFenci.ComponentEngine ? window.CanFenci.ComponentEngine.parseMarkdownToComponents(markdownText) : [];
        const slides = window.FenAI.LayoutEngine ? window.FenAI.LayoutEngine.applySlideLayout(components, { title: filename.toUpperCase() }) : [];

        slides.forEach(s => {
          const slide = pptx.addSlide();
          slide.background = { color: s.bg || "1A1A2E" };

          if (s.type === 'title') {
            slide.addText(s.title, { x: 0.8, y: 2.0, w: '80%', h: 1.5, fontSize: 32, bold: true, color: '6C63FF', align: 'center' });
            slide.addText(s.subtitle, { x: 0.8, y: 3.6, w: '80%', h: 1.0, fontSize: 18, color: '8888AA', align: 'center' });
            slide.addText("CanFenci Teacher Studio · Türkiye Yüzyılı Maarif Modeli", { x: 0.8, y: 6.2, w: '80%', h: 0.5, fontSize: 12, color: '00C9A7', align: 'center' });
          } else {
            slide.addText(`CANFENCI DERS SUNUMU - SLAYT ${s.slideNumber}`, { x: 0.5, y: 0.4, w: '90%', h: 0.5, fontSize: 14, bold: true, color: '6C63FF' });
            
            let currentY = 1.2;
            s.components.forEach(comp => {
              const compTitle = comp.data.title || comp.type;
              const compBody = comp.data.body || comp.data.text || comp.data.question || "";
              
              slide.addText(compTitle, { x: 0.6, y: currentY, w: '88%', h: 0.5, fontSize: 18, bold: true, color: '00C9A7' });
              currentY += 0.5;
              if (compBody) {
                slide.addText(compBody.substring(0, 300), { x: 0.6, y: currentY, w: '88%', h: 1.2, fontSize: 14, color: 'E0E0F0' });
                currentY += 1.3;
              }
            });

            slide.addText("CanFenci © 2026 · Pedagojik Yayıncılık", { x: 0.5, y: 6.8, w: '90%', h: 0.4, fontSize: 10, color: '8888AA', align: 'right' });
          }
        });

        const finalFilename = `${filename}_tymm.pptx`;
        const blob = await pptx.write({ outputType: 'blob' });
        const saved = await saveBlobToLocalWorkspace(blob, filename, 'pptx');
        if (saved) {
          toast(`PowerPoint sunumu assets/belgeler/${finalFilename} konumuna kaydedildi!`, 'success');
        } else {
          await pptx.writeFile({ fileName: finalFilename });
          toast('PowerPoint (.pptx) sunumu başarıyla indirildi!', 'success');
        }
      } catch(err) {
        console.error("PowerPoint oluşturma hatası:", err);
        toast("PowerPoint üretimi başarısız: " + err.message, 'error');
      }
    }
  };
})();
