// ============================================================
// PROVIDERS.JS – Doğrudan API İstekleri ve CORS Sorun Çözümleri
// ============================================================

window.FenAI = window.FenAI || {};

window.FenAI.Providers = (() => {
  function toast(msg, type) {
    if (window.FenAI.UIEngine) {
      window.FenAI.UIEngine.showToast(msg, type);
    } else if (typeof showToast === 'function') {
      showToast(msg, type);
    } else {
      console.warn(msg);
    }
  }

  return {
    // ============================================================
    // GEMINI FLASH / PRO
    // ============================================================
    async callGemini(prompt, systemInstruction) {
      const key = window.FenAI.AppState.getApiKey('gemini');
      if (!key) {
        toast('Gemini API anahtarı Ayarlar sayfasında tanımlı değil! Lütfen geçerli bir anahtar girip kaydedin.', 'error');
        throw new Error('Gemini anahtarı eksik');
      }
      const model = window.FenAI.AppState.getApiModel('gemini') || 'gemini-2.0-flash';
      
      const modelsToTry = [model];
      if (model !== 'gemini-2.0-flash') modelsToTry.push('gemini-2.0-flash');
      if (model !== 'gemini-1.5-flash') modelsToTry.push('gemini-1.5-flash');

      const payload = {
        contents: [{ parts: [{ text: prompt }] }]
      };
      if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()) {
        payload.systemInstruction = { parts: [{ text: systemInstruction.trim() }] };
      }

      let lastError = null;
      for (const currentModel of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${key}`;
        let delay = 1000;
        
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: controller.signal
            });
            clearTimeout(timeout);

            if (res.ok) {
              const data = await res.json();
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) return text;
              throw new Error("Gemini boş yanıt döndürdü.");
            }

            const errJson = await res.json().catch(() => null);
            const errMsg = errJson?.error?.message || (await res.text().catch(() => ''));

            if (res.status === 404 && modelsToTry.indexOf(currentModel) < modelsToTry.length - 1) {
              console.warn(`Model ${currentModel} bulunamadı, yedek modele geçiliyor...`);
              break; // Try next model
            }

            if (res.status === 400 && errMsg.includes('API_KEY_INVALID')) {
              toast('Girilen Gemini API anahtarı geçersiz! Lütfen Google AI Studio anahtarınızı kontrol edin.', 'error');
              throw new Error('Geçersiz Gemini API Anahtarı');
            }

            throw new Error(`Gemini API Hatası (${res.status}): ${errMsg || 'Bilinmeyen hata'}`);
          } catch (e) {
            lastError = e;
            if (e.message && (e.message.includes('Geçersiz') || e.message.includes('API_KEY_INVALID'))) {
              throw e;
            }
            if (attempt === 2) break;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
          }
        }
      }

      toast(`Gemini bağlantı hatası: ${lastError?.message || 'Bağlantı kurulamadı'}`, 'error');
      throw lastError || new Error('Gemini çağrısı başarısız.');
    },

    // ============================================================
    // DEEPSEEK
    // ============================================================
    async callDeepSeekDirect(prompt, systemPrompt) {
      const key = window.FenAI.AppState.getApiKey('deepseek');
      if (!key) {
        toast('DeepSeek API anahtarı girilmedi!', 'error');
        throw new Error('no key');
      }
      const model = window.FenAI.AppState.getApiModel('deepseek');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
          temperature: 0.6, max_tokens: 3500
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) { const e = await res.text(); throw new Error(e); }
      const data = await res.json();
      return data.choices[0].message.content;
    },

    // ============================================================
    // OPENROUTER
    // ============================================================
    async callOpenRouterDirect(prompt, model, systemPrompt = "Sen uzman bir Türk fen bilimleri öğretmenisin.") {
      const key = window.FenAI.AppState.getApiKey('openrouter');
      if (!key) {
        toast('OpenRouter API anahtarı girilmedi!', 'error');
        throw new Error('no key');
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key,
          'HTTP-Referer': 'https://canfenci.github.io/fenai',
          'X-Title': 'FenAI Panel'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7, max_tokens: 3500
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) { const e = await res.text(); throw new Error(e); }
      const data = await res.json();
      return data.choices[0].message.content;
    },

    // ============================================================
    // ANTHROPIC CLAUDE DİREKT API ÇAĞRISI
    // ============================================================
    async callClaudeDirect(prompt, systemPrompt) {
      const key = window.FenAI.AppState.getApiKey('claude');
      if (!key) {
        toast('Claude API anahtarı bulunamadı!', 'error');
        throw new Error('no key');
      }
      const model = window.FenAI.AppState.getApiModel('claude');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 3500,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const e = await res.text();
        throw new Error(`Claude API Hatası: ${e}`);
      }
      const data = await res.json();
      if (data.content && data.content[0]) {
        return data.content[0].text;
      }
      throw new Error('Claude API\'sinden geçerli bir yanıt alınamadı.');
    },

    // ============================================================
    // NVIDIA NIM DİREKT API ÇAĞRISI
    // ============================================================
    async callNvidiaNimDirect(prompt, systemPrompt) {
      const key = window.FenAI.AppState.getApiKey('nvidia');
      if (!key) {
        toast('Nvidia NIM API anahtarı bulunamadı!', 'error');
        throw new Error('no key');
      }
      const model = window.FenAI.AppState.getApiModel('nvidia');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 3500
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const e = await res.text();
        throw new Error(`Nvidia NIM API Hatası: ${e}`);
      }
      const data = await res.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      throw new Error('Nvidia NIM API\'sinden geçerli bir yanıt alınamadı.');
    },

    // ============================================================
    // OPENAI DİREKT API ÇAĞRISI
    // ============================================================
    async callOpenAiDirect(prompt, systemPrompt) {
      const key = window.FenAI.AppState.getApiKey('openai');
      if (!key) {
        toast('OpenAI API anahtarı bulunamadı!', 'error');
        throw new Error('no key');
      }
      const model = window.FenAI.AppState.getApiModel('openai');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 3500
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const e = await res.text();
        throw new Error(`OpenAI API Hatası: ${e}`);
      }
      const data = await res.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      throw new Error('OpenAI API\'sinden geçerli bir yanıt alınamadı.');
    },

    // ============================================================
    // PERPLEXITY DİREKT API ÇAĞRISI
    // ============================================================
    async callPerplexityDirect(prompt, systemPrompt) {
      const key = window.FenAI.AppState.getApiKey('perplexity');
      if (!key) {
        toast('Perplexity API anahtarı bulunamadı!', 'error');
        throw new Error('no key');
      }
      const model = window.FenAI.AppState.getApiModel('perplexity');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 3500
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const e = await res.text();
        throw new Error(`Perplexity API Hatası: ${e}`);
      }
      const data = await res.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      throw new Error('Perplexity API\'sinden geçerli bir yanıt alınamadı.');
    }
  };
})();
