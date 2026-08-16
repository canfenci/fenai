// ============================================================
// COMPONENT-ENGINE.JS – CanFenci Bileşen ve Layout Motoru
// ============================================================

window.CanFenci = window.CanFenci || {};

window.CanFenci.ComponentEngine = (() => {
  
  // 1. HeroTitle Render Metodu
  function renderHeroTitle(data) {
    if (!data || !data.title) return '';
    return `
      <div class="cf-component cf-hero-title" style="margin-bottom: 24px; border-bottom: 2px solid var(--primary); padding-bottom: 12px; margin-top: 10px;">
        <h1 style="color: var(--primary); font-size: 1.8rem; font-weight: 800; margin-bottom: 4px; line-height: 1.3;">${data.title}</h1>
        ${data.subtitle ? `<p style="color: var(--text-muted); font-size: 0.95rem; font-style: italic; margin-top: 4px;">${data.subtitle}</p>` : ''}
      </div>
    `;
  }

  // 2. QuestionCard Render Metodu
  function renderQuestionCard(data) {
    if (!data || !data.question) return '';
    const choicesHtml = data.choices && Array.isArray(data.choices) ? data.choices.map((choice, i) => `
      <div style="background: var(--surface2); padding: 10px 14px; border-radius: 8px; margin-top: 8px; border: 1px solid var(--border); font-size: 0.88rem; display: flex; align-items: center; gap: 10px;">
        <strong style="color: var(--primary); font-weight: 700;">${String.fromCharCode(65 + i)})</strong> 
        <span>${choice}</span>
      </div>
    `).join('') : '';

    return `
      <div class="cf-component cf-question-card" style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span class="badge badge-primary" style="padding: 3px 8px; font-size: 0.68rem; border-radius: 6px;">SORU</span>
          ${data.points ? `<span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">${data.points} PUAN</span>` : ''}
        </div>
        <p style="font-size: 0.92rem; font-weight: 600; line-height: 1.6; color: var(--text); margin-bottom: 10px;">${data.question}</p>
        ${choicesHtml}
        ${data.solution ? `
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border); font-size: 0.82rem; color: var(--secondary); line-height: 1.5;">
            <strong style="font-weight: 700;">🔑 Çözüm / Cevap Anahtarı:</strong> ${data.solution}
          </div>
        ` : ''}
      </div>
    `;
  }

  // 3. ThinkBox Render Metodu
  function renderThinkBox(data) {
    if (!data || !data.prompt) return '';
    return `
      <div class="cf-component cf-think-box" style="background: rgba(0, 201, 167, 0.04); border-left: 4px solid var(--secondary); border-radius: 4px; padding: 18px; margin-bottom: 20px;">
        <div style="font-weight: 700; color: var(--secondary); font-size: 0.88rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
          <span>💡</span> Düşünelim & Sorgulayalım
        </div>
        <p style="font-size: 0.88rem; color: var(--text); line-height: 1.65; margin: 0;">${data.prompt}</p>
      </div>
    `;
  }

  // 4. WarningBox Render Metodu
  function renderWarningBox(data) {
    if (!data || !data.message) return '';
    return `
      <div class="cf-component cf-warning-box" style="background: rgba(255, 179, 71, 0.04); border-left: 4px solid var(--warning); border-radius: 4px; padding: 18px; margin-bottom: 20px;">
        <div style="font-weight: 700; color: var(--warning); font-size: 0.88rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
          <span>⚠️</span> Dikkat & Kavram Yanılgısı
        </div>
        <p style="font-size: 0.88rem; color: var(--text); line-height: 1.65; margin: 0;">${data.message}</p>
      </div>
    `;
  }

  // 5. InfoCard Render Metodu
  function renderInfoCard(data) {
    if (!data || !data.content) return '';
    return `
      <div class="cf-component cf-info-card" style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 18px; margin-bottom: 20px;">
        ${data.title ? `
          <div style="font-weight: 700; color: var(--primary); font-size: 0.95rem; margin-bottom: 10px; border-bottom: 1px solid var(--border); padding-bottom: 6px;">
            📘 ${data.title}
          </div>
        ` : ''}
        <p style="font-size: 0.88rem; color: var(--text); line-height: 1.7; margin: 0;">${data.content}</p>
      </div>
    `;
  }

  // 6. ExperimentCard Render Metodu
  function renderExperimentCard(data) {
    if (!data || !data.experimentName) return '';
    const materialsHtml = data.materials && Array.isArray(data.materials) ? data.materials.map(m => `
      <li style="margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
        <span style="color: var(--secondary);">🧪</span> ${m}
      </li>
    `).join('') : '';
    
    const stepsHtml = data.steps && Array.isArray(data.steps) ? data.steps.map((step, idx) => `
      <li style="margin-bottom: 8px; line-height: 1.55;">
        <strong style="color: var(--primary); font-weight: 700; margin-right: 4px;">${idx + 1}.</strong> ${step}
      </li>
    `).join('') : '';

    return `
      <div class="cf-component cf-experiment-card" style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.12);">
        <div style="font-weight: 800; color: var(--secondary); font-size: 0.98rem; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
          <span>🔬</span> Deney Tasarımı: ${data.experimentName}
        </div>
        ${materialsHtml ? `
          <div style="margin-bottom: 14px;">
            <strong style="font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Gerekli Malzemeler:</strong>
            <ul style="list-style: none; padding-left: 0; margin-top: 6px; font-size: 0.85rem;">${materialsHtml}</ul>
          </div>
        ` : ''}
        ${stepsHtml ? `
          <div style="margin-bottom: 14px;">
            <strong style="font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Deneyin Yapılışı:</strong>
            <ol style="padding-left: 0; list-style: none; margin-top: 6px; font-size: 0.85rem;">${stepsHtml}</ol>
          </div>
        ` : ''}
        ${data.observation ? `
          <div style="background: rgba(0, 201, 167, 0.02); padding: 12px; border-radius: 8px; font-size: 0.82rem; border: 1px dashed var(--border); line-height: 1.5; color: var(--text);">
            <strong style="color: var(--secondary);">🔍 Gözlem ve Değerlendirme:</strong> ${data.observation}
          </div>
        ` : ''}
      </div>
    `;
  }

  // 7. TeacherNote Render Metodu
  function renderTeacherNote(data) {
    if (!data || !data.note) return '';
    return `
      <div class="cf-component cf-teacher-note" style="background: rgba(108, 99, 255, 0.02); border: 1px dashed var(--primary); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div style="font-weight: 700; color: var(--primary); font-size: 0.82rem; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
          <span>👨‍🏫</span> Öğretmene Rehber Notu
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.55; margin: 0; font-style: italic;">${data.note}</p>
      </div>
    `;
  }

  // 8. QRActivity Render Metodu
  function renderQRActivity(data) {
    if (!data || !data.description) return '';
    return `
      <div class="cf-component cf-qr-activity" style="background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 16px;">
        <div style="font-size: 2.2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">📱</div>
        <div style="flex: 1;">
          <div style="font-weight: 700; color: var(--secondary); font-size: 0.9rem; margin-bottom: 4px;">QR Kodlu Etkinlik</div>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0; line-height: 1.45;">${data.description}</p>
          ${data.url ? `<a href="${data.url}" target="_blank" style="font-size: 0.78rem; color: var(--primary); font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; transition: color 0.2s;">Dijital Simülasyona Git →</a>` : ''}
        </div>
      </div>
    `;
  }

  // 9. Summary Render Metodu
  function renderSummary(data) {
    if (!data || !data.points) return '';
    const listHtml = Array.isArray(data.points) ? data.points.map(pt => `
      <li style="margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px; line-height: 1.6;">
        <span style="color: var(--primary); margin-top: 2px;">📌</span>
        <span>${pt}</span>
      </li>
    `).join('') : `<li style="line-height:1.6;">📌 ${data.points}</li>`;

    return `
      <div class="cf-component cf-summary" style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="font-weight: 800; color: var(--primary); font-size: 0.98rem; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
          <span>🎯</span> Kazanım ve Ünite Özeti
        </div>
        <ul style="list-style: none; padding-left: 0; font-size: 0.88rem; margin: 0;">
          ${listHtml}
        </ul>
      </div>
    `;
  }

  // Markdown Fallback (Geriye Uyumluluk İçin Markdown Metinlerini Bileşenlere Dönüştürür)
  function compileMarkdownToComponents(markdownText) {
    if (!markdownText) return '';
    
    // Eğer markdown içinde JSON benzeri bir dizi varsa temizlemeyi deneriz
    const jsonMatch = markdownText.trim().match(/^(\{[\s\S]*\}|\[[\s\S]*\])$/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return renderDocument(parsed);
      } catch (e) {
        console.warn("Markdown contains JSON structure but parsing failed. Rendering raw markdown instead.", e);
      }
    }

    // Klasik Markdown Parser Fallback
    // Ünite başlıklarını, uyarıları ve deney metinlerini regex ile yakalayıp Giydiririz.
    let parsedHtml = '';
    
    // Satır bazında analiz
    const lines = markdownText.split('\n');
    let currentBlock = [];
    let state = 'normal'; // normal, list, code

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Hızlı Uyarı/Kazanım dışı tespiti
      if (line.startsWith('⚠️') || line.toLowerCase().includes('uyarı:') || line.toLowerCase().includes('kazanım dışı:')) {
        flushCurrentBlock();
        parsedHtml += renderWarningBox({ message: line.replace(/^[⚠️\-\s*]*/, '').replace(/^uyarı:?/i, '').replace(/^kazanım dışı:?/i, '').trim() });
        continue;
      }

      // Hızlı Düşünme sorusu tespiti
      if (line.startsWith('💡') || line.toLowerCase().includes('düşünelim:') || line.toLowerCase().includes('sorgulayalım:')) {
        flushCurrentBlock();
        parsedHtml += renderThinkBox({ prompt: line.replace(/^[💡\-\s*]*/, '').replace(/^düşünelim:?/i, '').trim() });
        continue;
      }

      // Rehber Öğretmen notu tespiti
      if (line.startsWith('👨‍🏫') || line.toLowerCase().includes('öğretmen notu:')) {
        flushCurrentBlock();
        parsedHtml += renderTeacherNote({ note: line.replace(/^[👨‍🏫\-\s*]*/, '').replace(/^öğretmen notu:?/i, '').trim() });
        continue;
      }

      // Ünite / Konu Başlığı tespiti (Markdown Header # veya ##)
      if (line.startsWith('# ') || line.startsWith('## ')) {
        flushCurrentBlock();
        const cleanTitle = line.replace(/^#+\s*/, '').trim();
        parsedHtml += renderHeroTitle({ title: cleanTitle });
        continue;
      }

      // Kalan standart blok satırları biriktirilir
      currentBlock.push(line);
    }

    flushCurrentBlock();

    function flushCurrentBlock() {
      if (currentBlock.length === 0) return;
      const blockText = currentBlock.join('\n').trim();
      if (blockText) {
        // marked.js kütüphanesi kullanarak HTML'e parse edilir
        if (window.marked && typeof window.marked.parse === 'function') {
          parsedHtml += `<div class="cf-markdown-block" style="line-height:1.75; font-size:0.88rem; margin-bottom:18px;">${window.marked.parse(blockText)}</div>`;
        } else {
          parsedHtml += `<div class="cf-markdown-block" style="line-height:1.75; font-size:0.88rem; margin-bottom:18px;">${blockText.replace(/\n/g, '<br>')}</div>`;
        }
      }
      currentBlock = [];
    }

    return parsedHtml;
  }

  // 10. Ana Döküman Oluşturucu (JSON veya Markdown Parse İşlevi)
  function renderDocument(jsonData) {
    if (!jsonData) {
      return '<div class="output-placeholder">İçerik verisi boş.</div>';
    }

    // Eğer parametre doğrudan bir nesne değil de string (düz metin) ise Markdown derleyiciyi çalıştırırız
    if (typeof jsonData === 'string') {
      return compileMarkdownToComponents(jsonData);
    }

    // JSON nesnesi ise şemayı kontrol ederiz
    if (!jsonData.components || !Array.isArray(jsonData.components)) {
      // JSON benzeri nesne ama components dizisi yoksa Markdown parser'ı metne çevirip çağırırız
      return compileMarkdownToComponents(JSON.stringify(jsonData, null, 2));
    }

    let html = '';
    jsonData.components.forEach(comp => {
      const type = comp.type;
      const data = comp.data;

      switch (type) {
        case 'HeroTitle':
          html += renderHeroTitle(data);
          break;
        case 'QuestionCard':
          html += renderQuestionCard(data);
          break;
        case 'ThinkBox':
          html += renderThinkBox(data);
          break;
        case 'WarningBox':
          html += renderWarningBox(data);
          break;
        case 'InfoCard':
          html += renderInfoCard(data);
          break;
        case 'ExperimentCard':
          html += renderExperimentCard(data);
          break;
        case 'TeacherNote':
          html += renderTeacherNote(data);
          break;
        case 'QRActivity':
          html += renderQRActivity(data);
          break;
        case 'Summary':
          html += renderSummary(data);
          break;
        default:
          console.warn(`Bilinmeyen bileşen türü atlandı: ${type}`);
      }
    });

    return html;
  }

  return {
    renderDocument,
    renderHeroTitle,
    renderQuestionCard,
    renderThinkBox,
    renderWarningBox,
    renderInfoCard,
    renderExperimentCard,
    renderTeacherNote,
    renderQRActivity,
    renderSummary
  };

})();
