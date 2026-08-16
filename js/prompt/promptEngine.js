// ============================================================
// PROMPTENGINE.JS – Müfredat, Kaynak ve DNA Enjeksiyonu ile Prompt Yapılandırıcı
// ============================================================

window.FenAI = window.FenAI || {};

window.FenAI.PromptEngine = (() => {
  function sourceMetinClean(text) { 
    return text ? text.trim() : ''; 
  }

  return {
    async getFinalPrompt(prompt, moduleName) {
      let finalPrompt = prompt;

      // 1) Kaynak Odaklı Üretim (PDF kaynak metni)
      const selectEl = document.getElementById(`use-source-select-${moduleName}`);
      if (selectEl && selectEl.value !== 'none') {
        const val = selectEl.value;
        if (val.startsWith('temp-')) {
          const tempId = val.substring(5);
          const sources = (typeof tempWebSources !== 'undefined') ? tempWebSources : [];
          const source = sources.find(k => k.id === tempId);
          if (source && source.icerik) {
            finalPrompt += `\n\n⚠️ ÖNEMLİ ÖĞRETMEN TALİMATI / KAYNAK ODAKLI MOD AKTİF:\nBu içeriği üretirken SADECE ve KESİNLİKLE aşağıda verilen kaynak metni temel almalısın. Kaynakta bulunmayan hiçbir yabancı bilgiyi, teoriyi veya müfredat dışı kavramı ekleme. Kaynağa tamamen sadık kalarak, kazanımı bu kaynak metin doğrultusunda pedagojik olarak işle.\n\nKAYNAK METİN:\n"${sourceMetinClean(source.icerik)}"`;
          }
        } else {
          const sourceId = parseInt(val);
          if (!isNaN(sourceId) && window.FenAI.LocalDb) {
            try {
              const source = await window.FenAI.LocalDb.getResource(sourceId);
              if (source && source.icerik) {
                finalPrompt += `\n\n⚠️ ÖNEMLİ ÖĞRETMEN TALİMATI / KAYNAK ODAKLI MOD AKTİF:\nBu içeriği üretirken SADECE ve KESİNLİKLE aşağıda verilen kaynak metni temel almalısın. Kaynakta bulunmayan hiçbir yabancı bilgiyi, teoriyi veya müfredat dışı kavramı ekleme. Kaynağa tamamen sadık kalarak, kazanımı bu kaynak metin doğrultusunda pedagojik olarak işle.\n\nKAYNAK METİN:\n"${sourceMetinClean(source.icerik)}"`;
              }
            } catch (e) {
              console.error('Kaynak yüklenirken hata:', e);
            }
          }
        }
      }

      // 2) DNA Profil Enjeksiyonu
      const dnaSelectEl = document.getElementById(`dna-profile-select-${moduleName}`);
      if (dnaSelectEl && dnaSelectEl.value !== 'none' && window.FenAI.DnaAnalyzer) {
        try {
          const dnaInjection = await window.FenAI.DnaAnalyzer.buildDnaInjection(dnaSelectEl.value);
          if (dnaInjection) finalPrompt += dnaInjection;
        } catch (e) {
          console.error('DNA enjeksiyonu başarısız:', e);
        }
      }

      return finalPrompt;
    },

    getFinalSystemPrompt(sinif, unite, baseSystemPrompt) {
      let finalSystemPrompt = baseSystemPrompt;
      if (typeof getCerceve === 'function') {
        const cerceve = getCerceve(sinif, unite);
        if (cerceve) {
          finalSystemPrompt += `\n\n⚠️ RESMİ MÜFREDAT İÇERİK ÇERÇEVESİ VE SINIRLAR (KATI UYUM ZORUNLULUĞU):\nBu içerik üretilirken sadece ve sadece aşağıdaki Resmi İçerik Çerçevesi sınırlarına bağlı kalınmalıdır. Çerçevede belirtilmeyen veya kazanım dışı hiçbir teoriyi, kavramı, formülü veya ek bilgiyi kesinlikle ekleme. Belirtilen pedagojik köprüleri, yapılacakları ve sınırlamaları esas al:\n\n${cerceve}`;
        }
      }
      return finalSystemPrompt;
    }
  };
})();
