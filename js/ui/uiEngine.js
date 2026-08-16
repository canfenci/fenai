// ============================================================
// UIENGINE.JS – Arayüz Güncellemeleri, KaTeX ve Markdown
// ============================================================

window.FenAI = window.FenAI || {};

window.FenAI.UIEngine = (() => {
  return {
    showToast(msg, type = 'info') {
      const toast = document.getElementById('toast');
      if (!toast) return;
      toast.textContent = msg;
      toast.className = type;
      toast.classList.add('show');
      clearTimeout(toast._hideTimeout);
      toast._hideTimeout = setTimeout(() => {
        toast.classList.remove('show');
      }, 5000);
    },

    setLoading(mod, state) {
      const bar = document.getElementById('loading-' + mod);
      if (bar) bar.style.display = state ? 'block' : 'none';
      const btn = document.getElementById('btn-' + mod);
      if (btn) {
        btn.disabled = state;
        if (state) {
          if (!btn.dataset.originalText && !btn.innerHTML.includes('spinner')) {
            btn.dataset.originalText = btn.innerHTML;
          }
          btn.innerHTML = `<span class="spinner"></span> Bilgi İşleniyor...`;
        } else {
          if (btn.dataset.originalText) {
            btn.innerHTML = btn.dataset.originalText;
          }
        }
      }
    },

    renderMarkdown(elementId, rawText) {
      const el = document.getElementById(elementId);
      if (!el) return;
      if (!rawText || rawText.trim().length === 0) {
        el.innerHTML = `<span class="output-placeholder">İçerik burada görünecek...</span>`;
        return;
      }
      let html = '';
      if (window.CanFenci && window.CanFenci.ComponentEngine) {
        html = window.CanFenci.ComponentEngine.renderDocument(rawText);
      } else {
        html = marked.parse(rawText);
      }
      el.innerHTML = html;
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(el, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
          ],
          throwOnError: false
        });
      }
    },

    copyOutput(elementId) {
      const textContainer = document.getElementById(elementId);
      if (!textContainer || textContainer.innerText.includes('görünecek...')) {
        this.showToast('Önce içerik üretmelisiniz!', 'error');
        return;
      }
      const textToCopy = textContainer.innerText;
      try {
        const tempInput = document.createElement('textarea');
        tempInput.value = textToCopy;
        tempInput.setAttribute('readonly', '');
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-9999px';
        document.body.appendChild(tempInput);
        const selected = document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;
        tempInput.select();
        tempInput.setSelectionRange(0, 99999);
        const successful = document.execCommand('copy');
        document.body.removeChild(tempInput);
        if (selected) {
          document.getSelection().removeAllRanges();
          document.getSelection().addRange(selected);
        }
        if (successful) {
          this.showToast('Tüm içerik panoya kopyalandı!', 'success');
        } else {
          this.showToast('Kopyalama başarısız oldu.', 'error');
        }
      } catch (err) {
        console.error('Kopyalama hatası:', err);
        this.showToast('Kopyalama sırasında bir hata oluştu.', 'error');
      }
    }
  };
})();
