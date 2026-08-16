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
    // GEMINI 2.5 FLASH
    // ============================================================
    async callGemini(prompt, systemInstruction) {
      const key = window.FenAI.AppState.getApiKey('gemini');
      if (!key) {
        toast('Gemini API anahtarı ayarlarda tanımlı değil!', 'error');
        throw new Error('Gemini anahtarı eksik');
      }
      const model = window.FenAI.AppState.getApiModel('gemini');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      };
      let delay = 1000;
      for (let attempt = 0; attempt < 5; attempt++) {
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
            throw new Error("Boş yanıt alındı.");
          }
          const errText = await res.text();
          throw new Error(`API hatası (${res.status}): ${errText}`);
        } catch (e) {
          if (attempt === 4) {
            toast(`Gemini bağlantı hatası: ${e.message}`, 'error');
            throw new Error(e);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
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
