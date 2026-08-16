// ============================================================
// AIENGINE.JS – Akıllı Model Yönlendirici ve Hata Tolerans Yöneticisi
// ============================================================

window.FenAI = window.FenAI || {};

window.FenAI.AIEngine = (() => {
  function updateRoutedBadge(module, text, className) {
    const badge = document.getElementById(`routed-badge-${module}`);
    if (badge) {
      badge.textContent = text;
      badge.className = `badge ${className}`;
    }
  }

  return {
    async generate(prompt, systemPrompt, targetModule, sinif, unite) {
      // 1. PromptEngine aracılığıyla prompt ve sistem talimatını hazırla
      let finalPrompt = prompt;
      if (targetModule && window.FenAI.PromptEngine) {
        finalPrompt = await window.FenAI.PromptEngine.getFinalPrompt(prompt, targetModule);
      }

      let finalSystemPrompt = systemPrompt;
      if (sinif && unite && window.FenAI.PromptEngine) {
        finalSystemPrompt = window.FenAI.PromptEngine.getFinalSystemPrompt(sinif, unite, systemPrompt);
      }

      const currentEngine = window.FenAI.AppState.get('currentEngine');
      const geminiKey = window.FenAI.AppState.getApiKey('gemini');
      const deepseekKey = window.FenAI.AppState.getApiKey('deepseek');
      const openrouterKey = window.FenAI.AppState.getApiKey('openrouter');

      // SMART ENGINE ROUTING
      if (currentEngine === 'smart' && targetModule) {
        if (targetModule === 'bag') {
          if (openrouterKey) {
            updateRoutedBadge('bag', 'DeepSeek-R1 (OpenRouter)', 'badge-warning');
            return await window.FenAI.Providers.callOpenRouterDirect(finalPrompt, 'deepseek/deepseek-r1', finalSystemPrompt);
          } else {
            updateRoutedBadge('bag', 'Gemini 2.5 Flash (Yedek)', 'badge-success');
            return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
          }
        }
        if (targetModule === 'yaz') {
          if (openrouterKey) {
            updateRoutedBadge('yaz', 'Claude 3.5 Sonnet (OpenRouter)', 'badge-warning');
            return await window.FenAI.Providers.callOpenRouterDirect(finalPrompt, 'anthropic/claude-3.5-sonnet', finalSystemPrompt);
          } else if (deepseekKey) {
            try {
              updateRoutedBadge('yaz', 'DeepSeek-V3 (Yedek)', 'badge-primary');
              return await window.FenAI.Providers.callDeepSeekDirect(finalPrompt, finalSystemPrompt);
            } catch (err) {
              console.warn("Direct DeepSeek call failed, falling back to Gemini:", err);
              updateRoutedBadge('yaz', 'Gemini 2.5 Flash (Yedek)', 'badge-success');
              return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
            }
          } else {
            updateRoutedBadge('yaz', 'Gemini 2.5 Flash (Yedek)', 'badge-success');
            return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
          }
        }
        if (targetModule === 'deneme') {
          if (openrouterKey) {
            updateRoutedBadge('deneme', 'GPT-4o (OpenRouter)', 'badge-warning');
            return await window.FenAI.Providers.callOpenRouterDirect(finalPrompt, 'openai/gpt-4o', finalSystemPrompt);
          } else {
            updateRoutedBadge('deneme', 'Gemini 2.5 Flash (Yedek)', 'badge-success');
            return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
          }
        }
        if (targetModule === 'konu') {
          if (openrouterKey) {
            updateRoutedBadge('konu', 'DeepSeek-V3 (OpenRouter)', 'badge-warning');
            return await window.FenAI.Providers.callOpenRouterDirect(finalPrompt, 'deepseek/deepseek-chat', finalSystemPrompt);
          } else if (deepseekKey) {
            try {
              updateRoutedBadge('konu', 'DeepSeek-V3 (Direct API)', 'badge-primary');
              return await window.FenAI.Providers.callDeepSeekDirect(finalPrompt, finalSystemPrompt);
            } catch (err) {
              console.warn("Direct DeepSeek call failed, falling back to Gemini:", err);
              updateRoutedBadge('konu', 'Gemini 2.5 Flash (Yedek)', 'badge-success');
              return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
            }
          } else {
            updateRoutedBadge('konu', 'Gemini 2.5 Flash (Yedek)', 'badge-success');
            return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
          }
        }
        if (targetModule === 'ck') {
          if (openrouterKey) {
            updateRoutedBadge('ck', 'DeepSeek-V3 (OpenRouter)', 'badge-warning');
            return await window.FenAI.Providers.callOpenRouterDirect(finalPrompt, 'deepseek/deepseek-chat', finalSystemPrompt);
          } else if (deepseekKey) {
            try {
              updateRoutedBadge('ck', 'DeepSeek-V3 (Direct API)', 'badge-primary');
              return await window.FenAI.Providers.callDeepSeekDirect(finalPrompt, finalSystemPrompt);
            } catch (err) {
              console.warn("Direct DeepSeek call failed, falling back to Gemini:", err);
              updateRoutedBadge('ck', 'Gemini 2.5 Flash (Yedek)', 'badge-success');
              return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
            }
          } else {
            updateRoutedBadge('ck', 'Gemini 2.5 Flash (Yedek)', 'badge-success');
            return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
          }
        }
        if (targetModule === 'test') {
          updateRoutedBadge('test', 'Gemini 2.5 Flash', 'badge-success');
          return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
        }
      }

      // SMART ENGINE: no targetModule or unknown targetModule -> default to Gemini
      if (currentEngine === 'smart') {
        if (targetModule) updateRoutedBadge(targetModule, 'Gemini 2.5 Flash (Varsayılan)', 'badge-success');
        return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
      }

      // DIRECT ENGINE SELECTIONS WITH MANUAL CONFIGS
      if (currentEngine === 'claude') {
        const model = window.FenAI.AppState.getApiModel('claude');
        if (targetModule) updateRoutedBadge(targetModule, `Claude (${model})`, 'badge-warning');
        try {
          return await window.FenAI.Providers.callClaudeDirect(finalPrompt, finalSystemPrompt);
        } catch (err) {
          console.warn("Claude Direct call failed, trying OpenRouter or Gemini fallback:", err);
          if (openrouterKey) {
            if (targetModule) updateRoutedBadge(targetModule, 'Claude (OpenRouter Yedek)', 'badge-warning');
            return await window.FenAI.Providers.callOpenRouterDirect(finalPrompt, 'anthropic/claude-3.5-sonnet', finalSystemPrompt);
          }
          if (targetModule) updateRoutedBadge(targetModule, 'Gemini (Yedek)', 'badge-success');
          return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
        }
      } else if (currentEngine === 'nvidia') {
        const model = window.FenAI.AppState.getApiModel('nvidia');
        if (targetModule) updateRoutedBadge(targetModule, `Nvidia (${model})`, 'badge-primary');
        try {
          return await window.FenAI.Providers.callNvidiaNimDirect(finalPrompt, finalSystemPrompt);
        } catch (err) {
          console.warn("Nvidia NIM Direct call failed, trying OpenRouter fallback:", err);
          if (openrouterKey) {
            if (targetModule) updateRoutedBadge(targetModule, 'Nvidia (OpenRouter Yedek)', 'badge-warning');
            return await window.FenAI.Providers.callOpenRouterDirect(finalPrompt, 'meta/llama-3.3-70b-instruct', finalSystemPrompt);
          }
          if (targetModule) updateRoutedBadge(targetModule, 'Gemini (Yedek)', 'badge-success');
          return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
        }
      } else if (currentEngine === 'openai') {
        const model = window.FenAI.AppState.getApiModel('openai');
        if (targetModule) updateRoutedBadge(targetModule, `OpenAI (${model})`, 'badge-primary');
        try {
          return await window.FenAI.Providers.callOpenAiDirect(finalPrompt, finalSystemPrompt);
        } catch (err) {
          console.warn("OpenAI Direct call failed, trying OpenRouter fallback:", err);
          if (openrouterKey) {
            if (targetModule) updateRoutedBadge(targetModule, 'GPT-4o (OpenRouter Yedek)', 'badge-warning');
            return await window.FenAI.Providers.callOpenRouterDirect(finalPrompt, 'openai/gpt-4o', finalSystemPrompt);
          }
          if (targetModule) updateRoutedBadge(targetModule, 'Gemini (Yedek)', 'badge-success');
          return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
        }
      } else if (currentEngine === 'perplexity') {
        const model = window.FenAI.AppState.getApiModel('perplexity');
        if (targetModule) updateRoutedBadge(targetModule, `Perplexity (${model})`, 'badge-warning');
        try {
          return await window.FenAI.Providers.callPerplexityDirect(finalPrompt, finalSystemPrompt);
        } catch (err) {
          console.warn("Perplexity Direct call failed, trying Gemini fallback:", err);
          if (targetModule) updateRoutedBadge(targetModule, 'Gemini (Yedek)', 'badge-success');
          return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
        }
      }

      if (currentEngine === 'gemini') {
        const model = window.FenAI.AppState.getApiModel('gemini');
        if (targetModule) updateRoutedBadge(targetModule, `Gemini (${model})`, 'badge-success');
        return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
      } else if (currentEngine === 'deepseek') {
        const model = window.FenAI.AppState.getApiModel('deepseek');
        if (targetModule) updateRoutedBadge(targetModule, `DeepSeek (${model})`, 'badge-primary');
        try {
          return await window.FenAI.Providers.callDeepSeekDirect(finalPrompt, finalSystemPrompt);
        } catch (err) {
          console.warn("DeepSeek Direct call failed, trying OpenRouter or Gemini fallback:", err);
          if (openrouterKey) {
            if (targetModule) updateRoutedBadge(targetModule, 'DeepSeek V3 (OpenRouter Yedek)', 'badge-warning');
            return await window.FenAI.Providers.callOpenRouterDirect(finalPrompt, 'deepseek/deepseek-chat', finalSystemPrompt);
          }
          if (targetModule) updateRoutedBadge(targetModule, 'Gemini (Yedek)', 'badge-success');
          return await window.FenAI.Providers.callGemini(finalPrompt, finalSystemPrompt);
        }
      } else {
        let model = 'openai/gpt-4o';
        let badgeText = 'GPT-4o (OpenRouter)';
        if (currentEngine === 'openrouter-r1') {
          model = 'deepseek/deepseek-r1';
          badgeText = 'DeepSeek-R1 (OpenRouter)';
        } else if (currentEngine === 'openrouter-claude') {
          model = 'anthropic/claude-3.5-sonnet';
          badgeText = 'Claude 3.5 Sonnet (OpenRouter)';
        } else if (currentEngine === 'openrouter-gpt') {
          model = 'openai/gpt-4o';
          badgeText = 'GPT-4o (OpenRouter)';
        } else if (currentEngine === 'openrouter') {
          model = window.FenAI.AppState.getApiModel('openrouter');
          badgeText = `OpenRouter (${model})`;
        }
        if (targetModule) updateRoutedBadge(targetModule, badgeText, 'badge-warning');
        return await window.FenAI.Providers.callOpenRouterDirect(finalPrompt, model, finalSystemPrompt);
      }
    }
  };
})();
