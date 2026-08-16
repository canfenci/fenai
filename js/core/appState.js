// ============================================================
// APPSTATE.JS – Merkezi Durum ve Konfigürasyon Yöneticisi
// ============================================================

window.FenAI = window.FenAI || {};

window.FenAI.AppState = (() => {
  // Özel durum değişkenleri
  const state = {
    currentEngine: localStorage.getItem('currentEngine') || 'smart',
    rawOutputs: {
      konu: '',
      test: '',
      bag: '',
      ck: '',
      yaz: '',
      deneme: ''
    },
    tempWebSources: []
  };

  const subscribers = {};

  // Durum değişikliğini dinleyicilere bildir
  function notify(key, value) {
    if (subscribers[key]) {
      subscribers[key].forEach(callback => callback(value));
    }
  }

  return {
    get(key) {
      if (key in state) {
        return state[key];
      }
      // localStorage fallback
      return localStorage.getItem(key);
    },

    set(key, value) {
      if (key in state) {
        state[key] = value;
        if (key === 'currentEngine') {
          localStorage.setItem('currentEngine', value);
        }
      } else {
        localStorage.setItem(key, value);
      }
      notify(key, value);
    },

    subscribe(key, callback) {
      if (!subscribers[key]) {
        subscribers[key] = [];
      }
      subscribers[key].push(callback);
    },

    // API Anahtarı Getir/Kaydet
    getApiKey(provider) {
      return localStorage.getItem(`${provider}_key`) || '';
    },

    setApiKey(provider, key) {
      if (!key) {
        localStorage.removeItem(`${provider}_key`);
      } else {
        localStorage.setItem(`${provider}_key`, key);
      }
      notify(`${provider}_key`, key);
    },

    // API Modeli Getir/Kaydet
    getApiModel(provider) {
      const defaultModels = {
        gemini: 'gemini-2.0-flash',
        deepseek: 'deepseek-chat',
        openai: 'gpt-4o',
        openrouter: 'deepseek/deepseek-r1',
        claude: 'claude-3-5-sonnet-20241022',
        perplexity: 'sonar',
        nvidia: 'meta/llama-3.3-70b-instruct'
      };
      return localStorage.getItem(`${provider}_model`) || defaultModels[provider] || '';
    },

    setApiModel(provider, model) {
      localStorage.setItem(`${provider}_model`, model);
      notify(`${provider}_model`, model);
    }
  };
})();
