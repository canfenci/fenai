// ============================================================
// DNAANALYZER.JS – Soru DNA Analizi & Profil Yöneticisi
// ============================================================
// Soru setlerini AI ile analiz eder, DNA profili oluşturur,
// IndexedDB'de saklar ve prompt enjeksiyonu için hazır tutar.
// ============================================================

window.FenAI = window.FenAI || {};

window.FenAI.DnaAnalyzer = (() => {

  const DB_NAME = 'fenai_db';
  const STORE = 'dna_profiles';
  let dbInstance = null;

  // ---------- IndexedDB ----------

  function openDb() {
    return new Promise((resolve, reject) => {
      if (dbInstance) { resolve(dbInstance); return; }
      const req = indexedDB.open(DB_NAME, 3);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function saveProfile(profile) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.add({ ...profile, tarih: new Date().toISOString() });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function listProfiles() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteProfile(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function getProfile(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // ---------- AI DNA Analizi ----------

  async function analyzeWithAI(sorularMetni, kaynakAdi) {
    const analysisPrompt = `Sen deneyimli bir Türk eğitim uzmanı ve soru analisti olarak görev yapıyorsun.

Aşağıda bir fen bilimleri sınav kaynağından ayıklanmış soru metni verilmiştir.
Bu soruların "çıkma felsefesini" ve "DNA profilini" analiz et.

KAYNAK ADI: ${kaynakAdi}

SORU METNİ:
${sorularMetni.substring(0, 8000)}

Aşağıdaki JSON formatında bir DNA profili çıkar. Sadece JSON döndür, başka açıklama yapma:

{
  "kaynak_adi": "${kaynakAdi}",
  "toplam_soru_tahmini": <sayı>,
  "bilissel_dagilim": {
    "bilgi": "<yüzde, örn: 10%>",
    "kavrama": "<yüzde>",
    "uygulama": "<yüzde>",
    "analiz": "<yüzde>",
    "sentez": "<yüzde>"
  },
  "senaryo_tipleri": ["<tip1>", "<tip2>"],
  "dominant_soru_formati": "<örn: hangisi_dogrudur | asagidakilerden_hangisi | hesaplama | grafik_yorumlama>",
  "tuzak_stratejileri": ["<strateji1>", "<strateji2>"],
  "konu_dagilimi": {
    "<konu1>": <soru_sayisi>,
    "<konu2>": <soru_sayisi>
  },
  "zorluk_dagilimi": {
    "kolay": "<yüzde>",
    "orta": "<yüzde>",
    "zor": "<yüzde>"
  },
  "anahtar_kavramlar": ["<kavram1>", "<kavram2>", "<kavram3>"],
  "pedagojik_ozet": "<Bu kaynak soruların genel felsefesini 2-3 cümleyle özetle>",
  "uretim_rehberi": "<Bu DNA'ya göre yeni sorular üretirken yapay zekaya verilecek özel talimat>"
}`;

    const systemPrompt = 'Sen bir soru analiz uzmanısın. Sadece geçerli JSON döndür, hiçbir açıklama ekleme.';

    // Önce AIEngine dene (akıllı routing ile)
    if (window.FenAI && window.FenAI.AIEngine) {
      try {
        const result = await window.FenAI.AIEngine.generate(analysisPrompt, systemPrompt, null, null, null);
        return parseJsonResult(result);
      } catch (e) {
        console.warn('AIEngine başarısız, manuel fallback deneniyor:', e);
      }
    }

    // Manuel fallback: tanımlı olan ilk provider'ı dene
    const providers = window.FenAI && window.FenAI.Providers;
    const appState = window.FenAI && window.FenAI.AppState;
    if (!providers || !appState) {
      throw new Error('AI motoru başlatılmamış. Lütfen Ayarlar sayfasından API anahtarınızı kontrol edin.');
    }

    const tryProviders = [
      { has: !!appState.getApiKey('gemini'), fn: () => providers.callGemini(analysisPrompt, systemPrompt), label: 'Gemini' },
      { has: !!appState.getApiKey('openrouter'), fn: () => providers.callOpenRouterDirect(analysisPrompt, 'openai/gpt-4o-mini', systemPrompt), label: 'OpenRouter (GPT-4o-mini)' },
      { has: !!appState.getApiKey('deepseek'), fn: () => providers.callDeepSeekDirect(analysisPrompt, systemPrompt), label: 'DeepSeek' },
      { has: !!appState.getApiKey('openai'), fn: () => providers.callOpenAiDirect(analysisPrompt, systemPrompt), label: 'OpenAI' },
      { has: !!appState.getApiKey('claude'), fn: () => providers.callClaudeDirect(analysisPrompt, systemPrompt), label: 'Claude' },
      { has: !!appState.getApiKey('perplexity'), fn: () => providers.callPerplexityDirect(analysisPrompt, systemPrompt), label: 'Perplexity' },
      { has: !!appState.getApiKey('nvidia'), fn: () => providers.callNvidiaNimDirect(analysisPrompt, systemPrompt), label: 'Nvidia NIM' }
    ];

    for (const p of tryProviders) {
      if (p.has) {
        try {
          console.log(`DNA analizi için ${p.label} deneniyor...`);
          const result = await p.fn();
          return parseJsonResult(result);
        } catch (e) {
          console.warn(`${p.label} başarısız:`, e);
        }
      }
    }

    throw new Error('Hiçbir API anahtarı tanımlı değil veya tüm providerlar başarısız oldu. Lütfen Ayarlar sayfasından en az bir API anahtarı girin.');
  }

  function parseJsonResult(result) {
    let jsonStr = result;
    const match = result.match(/\{[\s\S]*\}/);
    if (match) jsonStr = match[0];

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      throw new Error('AI yanıtı JSON formatında değil. Tekrar deneyin.');
    }
  }

  // ---------- Prompt Enjektörü ----------

  async function buildDnaInjection(profileId) {
    if (!profileId || profileId === 'none') return null;
    try {
      const profile = await getProfile(parseInt(profileId));
      if (!profile) return null;

      return `\n\n🧬 SORU DNA PROFİLİ AKTİF — ${profile.kaynak_adi}:
Bu soruları üretirken aşağıdaki DNA profiline SADIK KAL:
• Bilişsel dağılım: ${JSON.stringify(profile.bilissel_dagilim)}
• Baskın format: ${profile.dominant_soru_formati}
• Senaryo tipleri: ${(profile.senaryo_tipleri || []).join(', ')}
• Tuzak stratejileri: ${(profile.tuzak_stratejileri || []).join(', ')}
• Anahtar kavramlar: ${(profile.anahtar_kavramlar || []).join(', ')}
• Zorluk dağılımı: ${JSON.stringify(profile.zorluk_dagilimi)}
• Üretim rehberi: ${profile.uretim_rehberi || ''}

Üretilen sorular bu kaynakla aynı felsefeyi, formatı ve zorluk dengesini taşımalıdır.`;
    } catch (e) {
      console.error('DNA profili yüklenemedi:', e);
      return null;
    }
  }

  // ---------- Özet İstatistikler ----------

  function buildSummaryHtml(profile) {
    if (!profile) return '';
    const kognitif = profile.bilissel_dagilim || {};
    const zorluk = profile.zorluk_dagilimi || {};

    return `
      <div style="display:flex; flex-direction:column; gap:10px; font-size:0.82rem;">
        <div style="background:rgba(108,99,255,0.07); padding:12px; border-radius:8px; border-left:3px solid var(--primary);">
          <strong>📚 Kaynak:</strong> ${profile.kaynak_adi}<br>
          <strong>🔢 Tahmini Soru Sayısı:</strong> ${profile.toplam_soru_tahmini || '?'}<br>
          <strong>📅 Analiz Tarihi:</strong> ${new Date(profile.tarih).toLocaleDateString('tr-TR')}
        </div>
        <div style="background:var(--surface2); padding:12px; border-radius:8px;">
          <strong>🧠 Bilişsel Dağılım:</strong><br>
          ${Object.entries(kognitif).map(([k,v]) => `<span style="display:inline-block; margin:2px 4px; padding:2px 8px; background:rgba(108,99,255,0.12); border-radius:4px;">${k}: ${v}</span>`).join('')}
        </div>
        <div style="background:var(--surface2); padding:12px; border-radius:8px;">
          <strong>📊 Zorluk Dağılımı:</strong>
          <span style="color:#2ecc71;"> Kolay: ${zorluk.kolay || '?'}</span> |
          <span style="color:#f39c12;"> Orta: ${zorluk.orta || '?'}</span> |
          <span style="color:#e74c3c;"> Zor: ${zorluk.zor || '?'}</span>
        </div>
        <div style="background:var(--surface2); padding:12px; border-radius:8px;">
          <strong>🎯 Pedagojik Özet:</strong><br>
          <em style="color:var(--text-muted);">${profile.pedagojik_ozet || ''}</em>
        </div>
      </div>
    `;
  }

  return {
    analyzeWithAI,
    saveProfile,
    listProfiles,
    deleteProfile,
    getProfile,
    buildDnaInjection,
    buildSummaryHtml
  };

})();
