// ============================================================
// APP.JS – Ana uygulama, navigasyon, başlangıç, üretim fonksiyonları
// ============================================================

// Global değişkenler
let currentEngine = 'smart';
let yaziliSorular = [];
let selectedYaziliCiktilar = [];
let selectedDenemeOgrCiktilar = [];
let tempWebSources = [];

// Sayfa meta bilgileri
const pageMeta = {
  dashboard: { title: '📊 Kontrol Paneli', sub: 'FenAI Akıllı Fen Bilimleri Asistanı Genel Durum ve İstatistikler' },
  kaynak:  { title: '📂 Kaynak Havuzu',   sub: 'Özel ders notları, PDF veya makaleleri sisteme ekleyin ve yönetin' },
  dna:     { title: '🧬 Soru DNA Analizi', sub: 'MEB/LGS sınavlarının soru çıkma felsefesini öğren, aynı felsefede yeni sorular üret' },
  test:    { title: '📋 Kavram Testi',      sub: 'Kazanım odaklı, açıklayıcı soru analizli kavram testleri' },
  baglamli:{ title: '🧠 Bağlamlı Soru',    sub: 'Gerçek yaşam senaryolarına dayanan PISA/TIMSS tipi yeni nesil sorular' },
  calisma: { title: '📄 Çalışma Kağıdı',   sub: 'Öğrencinin kavramları yapılandırmasını kolaylaştıracak şablon etkinlikler' },
  yazili:  { title: '📝 Yazılı Sınav',     sub: 'Resmi sınav başlığı, puanlama şeması ve çözüm anahtarı olan yazılı sınav' },
  deneme:  { title: '📝 Deneme Sınavı',     sub: 'Genel, Konu veya Özel seçilmiş kazanımlardan otomatik deneme sınavları hazırlayın' },
  ayarlar: { title: '⚙️ Ayarlar',          sub: 'Yapay zeka modelleri için özel anahtar girişleri ve yapılandırma' },
  bankasi: { title: '🏦 Soru Bankası',     sub: 'Üretilen tüm içerikleri saklayın, yönetin ve tekrar kullanın' }
};

// ============================================================
// BAŞLANGIÇ
// ============================================================
window.onload = async function() {
  // PDF.js worker
  try {
    const pdfjs = window['pdfjs-dist/build/pdf'] || window.pdfjsLib || (typeof pdfjsLib !== 'undefined' ? pdfjsLib : null);
    if (pdfjs) {
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }
  } catch (e) { console.error("PDF.js worker setup failed:", e); }

  // API anahtarlarını yükle
  loadKeys();

  // Müfredatı yükle
  ['konu','test','bag','ck','yaz','deneme-konu','deneme-ogr'].forEach(p => loadUnits(p));

  // Yazılı sınav başlangıç
  initYaziliSorular();

  // Deneme sınavı başlangıç
  initDeneme();

  // API durumu
  checkApiStatus();

  // Önbellekten içerikleri geri yükle
  restoreCachedContent();

  // Kaynak verilerini IndexedDB'ye taşı ve yenile
  await migrateLocalStorageSource();
  await refreshSourceSelects();

  // Müfredat düzenleyici
  mufreSinifDegisti();

  // Soru bankasını listele
  await bankasiListele();

  // Service Worker'ı kaydet
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker kaydedildi.');
    } catch (e) {
      console.error('Service Worker kaydedilemedi:', e);
    }
  }
  checkPwaMode();
  await loadDashboardStats();
};

// ============================================================
// NAVİGASYON
// ============================================================
function showPage(name, element) {
  document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  const pageId = name === 'baglamli' ? 'baglamli' : name === 'deneme' ? 'deneme' : name;
  const activePage = document.getElementById('page-' + pageId);
  if (activePage) activePage.style.display = 'block';
  
  if (!element) {
    const navItems = document.querySelectorAll('.nav-item');
    for (let item of navItems) {
      if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(`'${name}'`)) {
        element = item; break;
      }
    }
  }
  if (element) element.classList.add('active');
  
  const meta = pageMeta[name] || {};
  document.getElementById('page-title').textContent = meta.title || '';
  document.getElementById('page-sub').textContent = meta.sub || '';
  
  if (name === 'dashboard') {
    loadDashboardStats();
  }

  if (name === 'dna') {
    loadDnaProfileList();
    loadDnaSelectorsInModules();
  }

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ============================================================
// DNA ANALİZİ UI FONKSİYONLARI
// ============================================================

let dnaSelectedFile = null;
let dnaExtractedText = '';

function handleDnaFileSelect(event) {
  const file = event.target.files[0];
  if (file) setDnaFile(file);
}

function handleDnaDrop(event) {
  event.preventDefault();
  document.getElementById('dna-drop-zone').style.background = '';
  const file = event.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') setDnaFile(file);
}

function setDnaFile(file) {
  dnaSelectedFile = file;
  dnaExtractedText = '';
  const info = document.getElementById('dna-file-info');
  info.style.display = 'block';
  info.innerHTML = `📄 <strong>${file.name}</strong> · ${(file.size / 1024).toFixed(0)} KB`;
  document.getElementById('btn-dna-analyze').disabled = false;
  document.getElementById('dna-drop-zone').innerHTML = `<div style="font-size:2rem;margin-bottom:8px;">✅</div><strong>${file.name}</strong> seçildi`;
}

async function startDnaAnalysis() {
  if (!dnaSelectedFile) { showToast('Önce bir PDF dosyası seçin.', 'error'); return; }
  const sourceName = document.getElementById('dna-source-name').value.trim() || dnaSelectedFile.name.replace('.pdf','');

  const btn = document.getElementById('btn-dna-analyze');
  btn.disabled = true;
  btn.textContent = '⏳ Analiz ediliyor...';

  const badge = document.getElementById('dna-status-badge');
  badge.textContent = 'Analiz Ediliyor';
  badge.style.background = 'var(--warning, #f39c12)';

  const progressCont = document.getElementById('dna-progress-container');
  progressCont.style.display = 'block';
  const progressBar = document.getElementById('dna-progress-bar');
  const progressLabel = document.getElementById('dna-progress-label');

  const loadingBar = document.getElementById('loading-dna');
  if (loadingBar) loadingBar.classList.add('active');

  try {
    // 1) PDF metnini çıkar
    progressLabel.textContent = 'PDF okunuyor...';
    if (!window.FenAI.PdfParser) throw new Error('PDF Parser hazır değil.');

    dnaExtractedText = await window.FenAI.PdfParser.extractText(dnaSelectedFile, (pct) => {
      progressBar.style.width = (pct * 0.5) + '%';
      progressLabel.textContent = `PDF okunuyor... %${pct}`;
    });

    progressBar.style.width = '55%';
    progressLabel.textContent = 'AI analizi yapılıyor...';

    // 2) AI ile DNA analizi
    const profile = await window.FenAI.DnaAnalyzer.analyzeWithAI(dnaExtractedText, sourceName);
    progressBar.style.width = '90%';

    // 3) Profili kaydet
    const savedId = await window.FenAI.DnaAnalyzer.saveProfile(profile);
    progressBar.style.width = '100%';

    // 4) Sonucu göster
    document.getElementById('dna-result-panel').innerHTML = window.FenAI.DnaAnalyzer.buildSummaryHtml({ ...profile, tarih: new Date().toISOString() });
    badge.textContent = '✅ Analiz Tamamlandı';
    badge.style.background = 'var(--success, #2ecc71)';

    showToast(`"${sourceName}" DNA profili oluşturuldu!`, 'success');
    loadDnaProfileList();
    loadDnaSelectorsInModules();

  } catch (err) {
    document.getElementById('dna-result-panel').innerHTML = `<span style="color:var(--danger, #e74c3c);">❌ Hata: ${err.message}</span>`;
    badge.textContent = 'Hata';
    badge.style.background = 'var(--danger, #e74c3c)';
    showToast('DNA analizi başarısız: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🧬 DNA Analizi Başlat';
    progressCont.style.display = 'none';
    progressBar.style.width = '0%';
    if (loadingBar) loadingBar.classList.remove('active');
  }
}

async function loadDnaProfileList() {
  const container = document.getElementById('dna-profile-list');
  if (!container || !window.FenAI.DnaAnalyzer) return;

  try {
    const profiles = await window.FenAI.DnaAnalyzer.listProfiles();
    if (profiles.length === 0) {
      container.innerHTML = '<span style="color:var(--text-muted); font-style:italic;">Henüz analiz yapılmadı.</span>';
      return;
    }

    container.innerHTML = profiles.map(p => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--surface2); border-radius:8px; border-left:3px solid var(--primary);">
        <div>
          <strong style="font-size:0.85rem;">${p.kaynak_adi || 'İsimsiz'}</strong><br>
          <span style="font-size:0.75rem; color:var(--text-muted);">${p.toplam_soru_tahmini || '?'} soru · ${new Date(p.tarih).toLocaleDateString('tr-TR')}</span>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="showDnaProfile(${p.id})" style="padding:4px 10px; font-size:0.75rem;">🔬 Detay</button>
          <button class="btn btn-danger btn-sm" onclick="deleteDnaProfile(${p.id})" style="padding:4px 10px; font-size:0.75rem;">🗑️</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<span style="color:var(--danger);">Profiller yüklenemedi.</span>';
  }
}

async function showDnaProfile(id) {
  const panel = document.getElementById('dna-result-panel');
  if (!panel || !window.FenAI.DnaAnalyzer) return;
  try {
    const profile = await window.FenAI.DnaAnalyzer.getProfile(id);
    panel.innerHTML = window.FenAI.DnaAnalyzer.buildSummaryHtml(profile);
  } catch (e) {
    panel.innerHTML = '<span style="color:var(--danger);">Profil yüklenemedi.</span>';
  }
}

async function deleteDnaProfile(id) {
  if (!confirm('Bu DNA profili silinsin mi?')) return;
  await window.FenAI.DnaAnalyzer.deleteProfile(id);
  showToast('DNA profili silindi.', 'success');
  loadDnaProfileList();
  loadDnaSelectorsInModules();
}

async function loadDnaSelectorsInModules() {
  if (!window.FenAI.DnaAnalyzer) return;
  const profiles = await window.FenAI.DnaAnalyzer.listProfiles();

  const moduleIds = ['test', 'bag', 'ck', 'yaz'];
  moduleIds.forEach(mod => {
    const container = document.getElementById(`dna-selector-${mod}`);
    if (!container) return;

    const options = ['<option value="none">🧬 DNA Profili Kullanma</option>',
      ...profiles.map(p => `<option value="${p.id}">${p.kaynak_adi}</option>`)
    ].join('');

    container.innerHTML = `
      <div style="padding:10px 14px; background:rgba(0,201,167,0.07); border:1px dashed var(--secondary); border-radius:8px; margin-bottom:14px;">
        <label style="font-weight:600; color:var(--secondary); font-size:0.82rem; display:block; margin-bottom:6px;">🧬 Soru DNA Profili (İsteğe Bağlı)</label>
        <select id="dna-profile-select-${mod}" style="margin:0; background:var(--bg);">${options}</select>
        <p style="font-size:0.72rem; color:var(--text-muted); margin-top:5px;">Seçilen kaynağın soru üretim felsefesi ve formatı kullanılır.</p>
      </div>`;
  });
}



function renderLearningAgentSuggestions() {
  const container = document.getElementById('learning-agent-suggestions');
  if (!container) return;
  if (!window.FenAI || !window.FenAI.LearningAgent) return;

  const suggestions = window.FenAI.LearningAgent.getProactiveSuggestions() || [];
  if (suggestions.length === 0) return;

  let html = '';
  suggestions.forEach(s => {
    html += `
      <div style="background: rgba(108, 99, 255, 0.08); padding: 12px; border-radius: 8px; border-left: 3px solid var(--primary); margin-bottom: 8px;">
        <div style="font-weight: 700; color: var(--primary); font-size: 0.85rem; margin-bottom: 4px;">${s.title}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 8px;">${s.description}</div>
        <button class="btn btn-outline btn-sm" onclick="showPage('${s.module}')">${s.actionText}</button>
      </div>
    `;
  });
  container.innerHTML = html;
}

async function loadDashboardStats() {
  renderLearningAgentSuggestions();
  try {
    const listDocs = await db_bankasiListele() || [];
    const listRes = await db_kaynakListele() || [];
    
    const docsVal = document.getElementById('stat-total-docs');
    const resVal = document.getElementById('stat-total-resources');
    const engineVal = document.getElementById('stat-active-engine');
    
    if (docsVal) docsVal.textContent = listDocs.length;
    if (resVal) resVal.textContent = listRes.length;
    
    if (engineVal) {
      const currentVal = document.getElementById('ai-engine-select') ? document.getElementById('ai-engine-select').value : 'smart';
      const engineNames = {
        smart: 'Akıllı Akış',
        gemini: 'Gemini 2.5 Flash',
        deepseek: 'DeepSeek-V3',
        openai: 'OpenAI GPT-4o',
        claude: 'Claude 3.5 Sonnet',
        perplexity: 'Perplexity Sonar',
        nvidia: 'Nvidia NIM',
        'openrouter-r1': 'DeepSeek-R1',
        'openrouter-claude': 'Claude 3.5 Sonnet',
        'openrouter-gpt': 'GPT-4o',
        openrouter: 'OpenRouter'
      };
      engineVal.textContent = engineNames[currentVal] || currentVal;
    }

    // Son Çalışmaların Dinamik Listelenmesi
    const recentContainer = document.getElementById('db-recent-projects');
    if (recentContainer) {
      if (listDocs.length === 0) {
        recentContainer.innerHTML = '<p style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">Henüz döküman üretilmedi.</p>';
      } else {
        const sortedDocs = [...listDocs].sort((a, b) => b.tarih - a.tarih).slice(0, 5);
        let html = '';
        sortedDocs.forEach(item => {
          const emoji = item.tur === 'konu' ? '📖' : item.tur === 'test' ? '📋' : item.tur === 'baglamli' ? '🧠' : item.tur === 'calisma' ? '📄' : '📝';
          const dateStr = new Date(item.tarih).toLocaleDateString('tr-TR');
          html += `
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; background: var(--surface2); padding: 8px 12px; border-radius: 6px; border-left: 3px solid var(--primary); margin-bottom: 4px;">
              <span style="font-weight:600; color:var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;">
                ${emoji} ${item.baslik}
              </span>
              <span style="font-size: 0.72rem; color: var(--text-muted);">${dateStr}</span>
            </div>
          `;
        });
        recentContainer.innerHTML = html;
      }
    }

    // Son Kullanılan Kazanımların Listelenmesi
    const achievementsContainer = document.getElementById('db-recent-achievements');
    if (achievementsContainer) {
      const achievements = new Set();
      listDocs.forEach(item => {
        if (item.kazanim) {
          achievements.add(item.kazanim);
        }
      });
      if (achievements.size === 0) {
        achievements.add('F.8.1.1.1 (Mevsimler)');
        achievements.add('F.8.2.1.3 (DNA)');
        achievements.add('F.8.3.1.2 (Sıvı Basıncı)');
      }
      let html = '';
      Array.from(achievements).slice(0, 6).forEach(code => {
        html += `<span class="badge badge-primary" style="margin-right: 4px; margin-bottom: 4px;">🎯 ${code}</span>`;
      });
      achievementsContainer.innerHTML = html;
    }
  } catch (e) {
    console.error("Dashboard stats loading failed:", e);
  }
}

function loadTemplate(type, topic) {
  showPage(type);
  const topicInputs = {
    konu: 'konu-baslik',
    calisma: 'calisma-baslik',
    baglamli: 'baglamli-konu',
    test: 'test-konu',
    yazili: 'yazili-konu',
    deneme: 'deneme-konu'
  };
  const targetId = topicInputs[type];
  const inputEl = document.getElementById(targetId);
  if (inputEl) {
    inputEl.value = topic;
    showToast(`"${topic}" şablonu yüklendi! Yapay zeka ile hemen üretmeye başlayabilirsiniz.`, 'success');
  }
}

// ============================================================
// MOTOR DEĞİŞİMİ
// ============================================================
function onEngineChange() {
  const selectVal = document.getElementById('ai-engine-select').value;
  currentEngine = selectVal;
  const badge = document.getElementById('engine-badge');
  if (currentEngine === 'smart') {
    badge.textContent = 'Akıllı Akış Aktif';
    badge.className = 'badge badge-success';
  } else if (currentEngine === 'gemini') {
    const m = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
    badge.textContent = `Gemini (${m})`;
    badge.className = 'badge badge-success';
  } else if (currentEngine === 'deepseek') {
    const m = localStorage.getItem('deepseek_model') || 'deepseek-chat';
    badge.textContent = `DeepSeek (${m})`;
    badge.className = 'badge badge-primary';
  } else if (currentEngine === 'openai') {
    const m = localStorage.getItem('openai_model') || 'gpt-4o';
    badge.textContent = `OpenAI (${m})`;
    badge.className = 'badge badge-primary';
  } else if (currentEngine === 'claude') {
    const m = localStorage.getItem('claude_model') || 'claude-3-5-sonnet-20241022';
    badge.textContent = `Claude (${m})`;
    badge.className = 'badge badge-warning';
  } else if (currentEngine === 'perplexity') {
    const m = localStorage.getItem('perplexity_model') || 'sonar';
    badge.textContent = `Perplexity (${m})`;
    badge.className = 'badge badge-warning';
  } else if (currentEngine === 'nvidia') {
    const m = localStorage.getItem('nvidia_model') || 'meta/llama-3.1-70b-instruct';
    badge.textContent = `Nvidia NIM (${m})`;
    badge.className = 'badge badge-primary';
  } else if (currentEngine === 'openrouter') {
    const m = localStorage.getItem('openrouter_model') || 'deepseek/deepseek-r1';
    badge.textContent = `OpenRouter (${m})`;
    badge.className = 'badge badge-warning';
  } else {
    badge.textContent = 'OpenRouter AI';
    badge.className = 'badge badge-warning';
  }
  loadDashboardStats();
}

// ============================================================
// ÖNBELLEK
// ============================================================
function restoreCachedContent() {
  ['konu','test','bag','ck','yaz','deneme'].forEach(mod => {
    const cached = localStorage.getItem(`cache_fenai_${mod}`);
    if (cached) {
      rawOutputs[mod] = cached;
      processAndRenderOutput(`output-${mod}`, cached);
    }
  });
}

// ============================================================
// API ANAHTAR YÖNETİMİ (Dinamik & Maskeli Arayüz)
// ============================================================
const PROVIDER_MODELS = {
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Varsayılan)' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek V3 (Chat)' },
    { value: 'deepseek-reasoner', label: 'DeepSeek R1 (Reasoner)' }
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o (Varsayılan)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
    { value: 'o1-mini', label: 'o1-mini' }
  ],
  openrouter: [
    { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1 (Reasoning)' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o-mini' },
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'deepseek/deepseek-chat', label: 'DeepSeek V3' },
    { value: 'meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' }
  ],
  claude: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Varsayılan)' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' }
  ],
  perplexity: [
    { value: 'sonar', label: 'Sonar (Varsayılan)' },
    { value: 'sonar-pro', label: 'Sonar Pro' },
    { value: 'sonar-reasoning', label: 'Sonar Reasoning' }
  ],
  nvidia: [
    { value: 'meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B Instruct (Önerilen)' },
    { value: 'meta/llama-3.1-70b-instruct', label: 'Llama 3.1 70B Instruct' },
    { value: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Llama 3.1 Nemotron 70B' },
    { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1' },
    { value: 'meta/llama-3.1-8b-instruct', label: 'Llama 3.1 8B Instruct' },
    { value: 'nvidia/glm-5.2', label: 'GLM 5.2' },
    { value: 'deepseek-ai/deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
    { value: 'nvidia/nemotron-3-nano-omni', label: 'Nemotron 3 Nano Omni' },
    { value: 'deepseek-ai/deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
    { value: 'kimi/kimi-k2.6', label: 'Kimi K2.6' },
    { value: 'mistralai/mistral-medium-3.5-128b', label: 'Mistral Medium 3.5 128B' }
  ]
};

let apiEditModes = {
  gemini: false,
  deepseek: false,
  openai: false,
  openrouter: false,
  claude: false,
  perplexity: false,
  nvidia: false
};

function onApiModelSelectChange() {
  renderApiSettings();
}

function onApiModelDropdownChange(provider) {
  const dropdown = document.getElementById('api-model-select-dropdown');
  const customInput = document.getElementById('api-model-custom-input');
  if (!dropdown || !customInput) return;
  
  if (dropdown.value === 'custom') {
    customInput.style.display = 'block';
    customInput.focus();
  } else {
    customInput.style.display = 'none';
  }
}

function renderApiSettings() {
  const selectEl = document.getElementById('api-model-select');
  if (!selectEl) return;
  
  const provider = selectEl.value;
  const savedKey = localStorage.getItem(provider + '_key') || '';
  const isEditing = apiEditModes[provider];
  
  const defaultModel = PROVIDER_MODELS[provider]?.[0]?.value || '';
  const savedModel = localStorage.getItem(provider + '_model') || defaultModel;
  const isPredefined = PROVIDER_MODELS[provider]?.some(m => m.value === savedModel);
  
  const container = document.getElementById('api-config-detail-container');
  if (!container) return;
  
  let title = '';
  let description = '';
  let placeholder = '';
  let statusText = '';
  let statusClass = '';
  
  if (provider === 'gemini') {
    title = 'Google Gemini API';
    description = 'Google AI Studio\'dan aldığınız ücretsiz Gemini API anahtarını buraya ekleyebilirsiniz. Özel anahtar girilmezse dahili anahtar kullanılır.';
    placeholder = 'AIzaSy...';
    if (savedKey) {
      statusText = '🟢 Özel Anahtar Kayıtlı';
      statusClass = 'badge-success';
    } else {
      statusText = '🔵 Dahili Entegrasyon Aktif';
      statusClass = 'badge-primary';
    }
  } else if (provider === 'deepseek') {
    title = 'DeepSeek API';
    description = 'DeepSeek API portalından aldığınız API anahtarını buraya ekleyebilirsiniz. (Model: deepseek-v3 veya R1)';
    placeholder = 'sk-...';
    if (savedKey) {
      statusText = '🟢 Özel Anahtar Kayıtlı';
      statusClass = 'badge-success';
    } else {
      statusText = '🔴 API Anahtarı Kayıtlı Değil';
      statusClass = 'badge-warning';
    }
  } else if (provider === 'openai') {
    title = 'OpenAI API (Direct)';
    description = 'OpenAI platformundan aldığınız API anahtarını girerek GPT-4o veya diğer modelleri doğrudan kullanabilirsiniz.';
    placeholder = 'sk-...';
    if (savedKey) {
      statusText = '🟢 Özel Anahtar Kayıtlı';
      statusClass = 'badge-success';
    } else {
      statusText = '🔴 API Anahtarı Kayıtlı Değil';
      statusClass = 'badge-warning';
    }
  } else if (provider === 'openrouter') {
    title = 'OpenRouter API';
    description = 'OpenRouter portalından aldığınız API anahtarını ekleyerek Claude, DeepSeek-R1 ve GPT-4o gibi modelleri kullanabilirsiniz.';
    placeholder = 'sk-or-...';
    if (savedKey) {
      statusText = '🟢 Özel Anahtar Kayıtlı';
      statusClass = 'badge-success';
    } else {
      statusText = '🔴 API Anahtarı Kayıtlı Değil';
      statusClass = 'badge-warning';
    }
  } else if (provider === 'claude') {
    title = 'Anthropic Claude API (Direct)';
    description = 'Anthropic konsolundan aldığınız API anahtarını girerek Claude model ailesini doğrudan kullanabilirsiniz.';
    placeholder = 'sk-ant-...';
    if (savedKey) {
      statusText = '🟢 Özel Anahtar Kayıtlı';
      statusClass = 'badge-success';
    } else {
      statusText = '🔴 API Anahtarı Kayıtlı Değil';
      statusClass = 'badge-warning';
    }
  } else if (provider === 'perplexity') {
    title = 'Perplexity API';
    description = 'Perplexity API portalından aldığınız API anahtarını girerek Sonar arama modellerini doğrudan kullanabilirsiniz.';
    placeholder = 'pplx-...';
    if (savedKey) {
      statusText = '🟢 Özel Anahtar Kayıtlı';
      statusClass = 'badge-success';
    } else {
      statusText = '🔴 API Anahtarı Kayıtlı Değil';
      statusClass = 'badge-warning';
    }
  } else if (provider === 'nvidia') {
    title = 'Nvidia NIM API';
    description = 'Nvidia build portalından aldığınız API anahtarını girerek Llama veya Nemotron modellerini doğrudan çağırabilirsiniz.';
    placeholder = 'nvapi-...';
    if (savedKey) {
      statusText = '🟢 Özel Anahtar Kayıtlı';
      statusClass = 'badge-success';
    } else {
      statusText = '🔴 API Anahtarı Kayıtlı Değil';
      statusClass = 'badge-warning';
    }
  }
  
  let html = `
    <div class="settings-group" style="margin: 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 12px;">
        <h3 style="margin: 0; border: none; padding: 0;">🔑 ${title}</h3>
        <span class="badge ${statusClass}" style="font-size: 0.75rem;">${statusText}</span>
      </div>
      <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:15px; line-height: 1.4;">${description}</p>
  `;
  
  if (isEditing) {
    let optionsHtml = '';
    const models = PROVIDER_MODELS[provider] || [];
    models.forEach(m => {
      const selectedAttr = (m.value === savedModel) ? 'selected' : '';
      optionsHtml += `<option value="${m.value}" ${selectedAttr}>${m.label}</option>`;
    });
    optionsHtml += `<option value="custom" ${!isPredefined ? 'selected' : ''}>Diğer (Manuel Gir)...</option>`;
    
    html += `
      <div class="api-key-row" style="margin-bottom: 12px;">
        <input type="password" id="api-key-input" placeholder="${placeholder}" value="${savedKey}" style="flex: 1;" />
        <button class="btn btn-outline btn-sm" onclick="toggleApiKeyVisibility()" title="Anahtarı Göster/Gizle">👁</button>
      </div>
      <div class="model-select-row" style="margin-bottom: 15px; display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Aktif Model</label>
        <select id="api-model-select-dropdown" onchange="onApiModelDropdownChange('${provider}')" style="padding: 8px; font-size: 0.85rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; color: var(--text);">
          ${optionsHtml}
        </select>
        <input type="text" id="api-model-custom-input" placeholder="Model adını yazın (örn: meta/llama-3-70b)..." style="display: ${isPredefined ? 'none' : 'block'}; padding: 8px; font-size: 0.85rem; background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; color: var(--text);" value="${isPredefined ? '' : savedModel}" />
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button class="btn btn-primary btn-sm" onclick="saveApiKey('${provider}')">💾 Kaydet</button>
        <button class="btn btn-outline btn-sm" onclick="setApiEditMode('${provider}', false)">❌ İptal</button>
      </div>
    `;
  } else {
    const maskedVal = savedKey ? '••••••••••••••••••••••••••••••••' : '';
    html += `
      <div class="api-key-row">
        <input type="password" id="api-key-input" placeholder="${savedKey ? '' : 'Anahtar bulunamadı...'}" value="${maskedVal}" readonly style="flex: 1; background: rgba(255,255,255,0.02); color: var(--text-muted);" />
        <button class="btn btn-primary btn-sm" onclick="setApiEditMode('${provider}', true)">✏️ Düzenle</button>
        ${savedKey ? `<button class="btn btn-danger btn-sm" onclick="clearApiKey('${provider}')">🗑️ Sil</button>` : ''}
      </div>
      <div style="margin-top: 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 8px;">
        <span style="color: var(--text-muted);">Aktif Model:</span>
        <span class="badge badge-primary" style="font-family: monospace;">${savedModel}</span>
      </div>
    `;
  }
  
  html += `</div>`;
  container.innerHTML = html;
}

function setApiEditMode(provider, isEdit) {
  apiEditModes[provider] = isEdit;
  renderApiSettings();
}

function toggleApiKeyVisibility() {
  const el = document.getElementById('api-key-input');
  if (el) {
    el.type = el.type === 'password' ? 'text' : 'password';
  }
}

function saveApiKey(provider) {
  const inputEl = document.getElementById('api-key-input');
  if (!inputEl) return;
  const val = inputEl.value.trim();
  if (!val) {
    showToast('Lütfen geçerli bir API anahtarı girin.', 'error');
    return;
  }
  localStorage.setItem(provider + '_key', val);
  
  // Save model
  const dropdown = document.getElementById('api-model-select-dropdown');
  const customInput = document.getElementById('api-model-custom-input');
  if (dropdown) {
    let modelVal = dropdown.value;
    if (modelVal === 'custom' && customInput) {
      modelVal = customInput.value.trim();
    }
    if (modelVal) {
      localStorage.setItem(provider + '_model', modelVal);
    }
  }
  
  apiEditModes[provider] = false;
  renderApiSettings();
  checkApiStatus();
  showToast(`${provider.toUpperCase()} ayarları kaydedildi!`, 'success');
}

function clearApiKey(provider) {
  const msg = `${provider.toUpperCase()} API anahtarını silmek istediğinize emin misiniz?`;
  if (!confirm(msg)) return;
  
  localStorage.removeItem(provider + '_key');
  localStorage.removeItem(provider + '_model');
  
  apiEditModes[provider] = false;
  renderApiSettings();
  checkApiStatus();
  showToast(`${provider.toUpperCase()} silindi.`, 'info');
}

function loadKeys() {
  renderApiSettings();
  checkApiStatus();
}

function checkApiStatus() {
  const gemini = localStorage.getItem('gemini_key');
  const ds = localStorage.getItem('deepseek_key');
  const openai = localStorage.getItem('openai_key');
  const or = localStorage.getItem('openrouter_key');
  const claude = localStorage.getItem('claude_key');
  const perplexity = localStorage.getItem('perplexity_key');
  const nvidia = localStorage.getItem('nvidia_key');
  
  const dotGemini = document.getElementById('dot-gemini');
  const labelGemini = document.getElementById('label-gemini');
  if (dotGemini && labelGemini) {
    if (gemini) {
      dotGemini.classList.add('active');
      labelGemini.textContent = 'Gemini API (Özel Anahtar)';
    } else {
      dotGemini.classList.add('active');
      labelGemini.textContent = 'Gemini API (Dahili)';
    }
  }
  
  const dotDs = document.getElementById('dot-deepseek');
  if (dotDs) dotDs.classList.toggle('active', !!ds);
  
  const dotOpenAi = document.getElementById('dot-openai');
  if (dotOpenAi) dotOpenAi.classList.toggle('active', !!openai);
  
  const dotOr = document.getElementById('dot-openrouter');
  if (dotOr) dotOr.classList.toggle('active', !!or);
  
  const dotClaude = document.getElementById('dot-claude');
  if (dotClaude) dotClaude.classList.toggle('active', !!claude);
  
  const dotPerplexity = document.getElementById('dot-perplexity');
  if (dotPerplexity) dotPerplexity.classList.toggle('active', !!perplexity);
  
  const dotNvidia = document.getElementById('dot-nvidia');
  if (dotNvidia) dotNvidia.classList.toggle('active', !!nvidia);
}

async function clearAllData() {
  if (confirm('Tüm API anahtarlarınız, önbellekleriniz ve kaynak dökümanlarınız silinecektir. Emin misiniz?')) {
    localStorage.clear();
    apiEditModes = {
      gemini: false,
      deepseek: false,
      openai: false,
      openrouter: false,
      claude: false,
      perplexity: false,
      nvidia: false
    };
    
    try {
      await db_kaynaklariTemizle();
      await db_bankasiTemizle();
      tempWebSources = [];
      await refreshSourceSelects();
      await bankasiListele();
    } catch (e) {
      console.error('Temizleme hatası:', e);
    }
    
    // Temizle giriş alanları
    const kaynakMetin = document.getElementById('kaynak-metin');
    if (kaynakMetin) kaynakMetin.value = '';
    const kaynakBaslik = document.getElementById('kaynak-baslik');
    if (kaynakBaslik) kaynakBaslik.value = '';
    const fileUploader = document.getElementById('file-uploader');
    if (fileUploader) fileUploader.value = '';
    
    renderApiSettings();
    checkApiStatus();
    showToast('Tüm veriler temizlendi.', 'info');
  }
}

// ============================================================
// KAYNAK YÖNETİMİ
// ============================================================
async function saveSourceData() {
  const title = document.getElementById('kaynak-baslik').value.trim();
  const text = document.getElementById('kaynak-metin').value.trim();
  if (!title || !text) {
    showToast('Lütfen başlık ve kaynak metni alanlarını doldurun!', 'error');
    return;
  }
  try {
    await db_kaynakKaydet({
      baslik: title,
      icerik: text,
      tarih: new Date().toISOString()
    });
    document.getElementById('kaynak-baslik').value = '';
    document.getElementById('kaynak-metin').value = '';
    document.getElementById('file-uploader').value = '';
    await refreshSourceSelects();
    showToast('Kaynak başarıyla veritabanına kaydedildi!', 'success');
  } catch (e) {
    console.error('Kaydetme hatası:', e);
    showToast('Kaynak kaydedilemedi: ' + e.message, 'error');
  }
}

async function deleteSource(id) {
  if (!confirm('Bu kaynak belgesini silmek istediğinize emin misiniz?')) return;
  try {
    await db_kaynakSil(id);
    await refreshSourceSelects();
    showToast('Kaynak belgesi silindi.', 'info');
  } catch (e) {
    console.error('Silme hatası:', e);
    showToast('Hata: ' + e.message, 'error');
  }
}

async function refreshSourceSelects() {
  try {
    const kaynaklar = await db_kaynakListele();
    
    // 1. Kaynak Havuzu sayfasındaki listeyi doldur
    const listContainer = document.getElementById('kaynaklar-liste');
    if (listContainer) {
      if (kaynaklar.length === 0 && tempWebSources.length === 0) {
        listContainer.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-muted); font-style: italic;">Kayıtlı veya geçici kaynak bulunmuyor. Yukarıdan yeni bir kaynak kaydedebilirsiniz.</div>`;
      } else {
        let html = '';
        
        // Veritabanı kaynakları
        kaynaklar.forEach(k => {
          const dateStr = new Date(k.tarih).toLocaleString('tr-TR');
          const sizeKb = Math.round(k.icerik.length / 1024);
          html += `
            <div style="background: var(--surface2); padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border);">
              <div>
                <strong style="color: var(--primary); font-size: 0.9rem; display: block; margin-bottom: 4px;">💾 ${k.baslik}</strong>
                <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Boyut: ~${sizeKb} KB | Sürüm: Kalıcı Veritabanı | 📅 ${dateStr}</span>
              </div>
              <button class="btn btn-danger btn-sm" onclick="deleteSource(${k.id})" style="padding: 4px 10px; font-size: 0.75rem;">🗑️ Sil</button>
            </div>
          `;
        });
        
        // Geçici web/video kaynakları
        tempWebSources.forEach(k => {
          const dateStr = new Date(k.tarih).toLocaleString('tr-TR');
          const sizeKb = Math.round(k.icerik.length / 1024);
          html += `
            <div style="background: rgba(108, 99, 255, 0.05); padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px dashed var(--primary);">
              <div>
                <strong style="color: var(--secondary); font-size: 0.9rem; display: block; margin-bottom: 4px;">🌐 ${k.baslik}</strong>
                <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Boyut: ~${sizeKb} KB | Sürüm: Geçici Web/Video | 📅 ${dateStr}</span>
              </div>
              <button class="btn btn-danger btn-sm" onclick="deleteTempSource('${k.id}')" style="padding: 4px 10px; font-size: 0.75rem;">🗑️ Sil</button>
            </div>
          `;
        });
        
        listContainer.innerHTML = html;
      }
    }

    // 2. Diğer tüm modüllerdeki açılır kutuları doldur
    const mods = ['konu', 'test', 'bag', 'ck', 'yaz', 'deneme'];
    mods.forEach(mod => {
      const selectEl = document.getElementById(`use-source-select-${mod}`);
      if (selectEl) {
        const currentVal = selectEl.value;
        selectEl.innerHTML = '<option value="none">❌ Kaynak Kullanma (Varsayılan Müfredat)</option>';
        
        // Kalıcı kaynakları ekle
        kaynaklar.forEach(k => {
          const opt = document.createElement('option');
          opt.value = k.id;
          opt.textContent = `📂 [Kalıcı] ${k.baslik}`;
          selectEl.appendChild(opt);
        });
        
        // Geçici kaynakları ekle
        tempWebSources.forEach(k => {
          const opt = document.createElement('option');
          opt.value = `temp-${k.id}`;
          opt.textContent = `🌐 [Geçici] ${k.baslik}`;
          selectEl.appendChild(opt);
        });
        
        // Seçimi geri yükle
        const existsInPersistent = kaynaklar.some(k => String(k.id) === String(currentVal));
        const existsInTemp = tempWebSources.some(k => `temp-${k.id}` === String(currentVal));
        if (existsInPersistent || existsInTemp) {
          selectEl.value = currentVal;
        } else {
          selectEl.value = 'none';
        }
      }
    });
    loadDashboardStats();
  } catch (e) {
    console.error('Kaynak listesi yenilenirken hata:', e);
  }
}

async function migrateLocalStorageSource() {
  const oldTitle = localStorage.getItem('kaynak_baslik');
  const oldText = localStorage.getItem('kaynak_metin');
  if (oldText) {
    try {
      await db_kaynakKaydet({
        baslik: oldTitle || 'Eski Kaynak',
        icerik: oldText,
        tarih: new Date().toISOString()
      });
      localStorage.removeItem('kaynak_baslik');
      localStorage.removeItem('kaynak_metin');
      console.log('Migrated old localStorage source to IndexedDB.');
    } catch (e) {
      console.error('Failed to migrate old source:', e);
    }
  }
}

function clearSourceData() {
  document.getElementById('kaynak-metin').value = '';
  document.getElementById('kaynak-baslik').value = '';
  document.getElementById('file-uploader').value = '';
  showToast('Giriş alanları temizlendi.', 'info');
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const textArea = document.getElementById('kaynak-metin');
  const titleInput = document.getElementById('kaynak-baslik');
  const cleanName = file.name.replace(/\.[^/.]+$/, "");
  titleInput.value = cleanName;
  if (file.type === "application/pdf") {
    showToast("PDF metni çıkartılıyor, lütfen bekleyin...", "info");
    try {
      const extractedText = await extractTextFromPDF(file);
      textArea.value = extractedText;
      showToast("PDF içeriği başarıyla çıkartıldı!", "success");
    } catch (e) {
      console.error(e);
      showToast("PDF okunurken hata oluştu: " + e.message, "error");
    }
  } else if (file.type === "text/plain") {
    const reader = new FileReader();
    reader.onload = function(e) {
      textArea.value = e.target.result;
      showToast("Metin dosyası yüklendi!", "success");
    };
    reader.readAsText(file);
  } else {
    showToast("Lütfen sadece PDF veya TXT dosyası yükleyin.", "error");
  }
}

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjs = window['pdfjs-dist/build/pdf'] || window.pdfjsLib || (typeof pdfjsLib !== 'undefined' ? pdfjsLib : null);
  if (!pdfjs) throw new Error("PDF.js kütüphanesi yüklenemedi.");
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

// ============================================================
// ÜRETİM FONKSİYONLARI (KONU, TEST, BAĞLAMLI, ÇALIŞMA, YAZILI, SÜRÜKLE)
// ============================================================

async function generateKonu() {
  const sinif = document.getElementById('konu-sinif').value;
  const unite = document.getElementById('konu-unite').value;
  const topic = document.getElementById('konu-topic').value;
  const duzey = document.getElementById('konu-duzey').value;
  const stil  = document.getElementById('konu-stil').value;
  const not   = document.getElementById('konu-not').value;

  const systemPrompt = `Sen uzman bir Türk fen bilimleri öğretmenisin. Hazırlayacağın konu anlatımı Türkiye Yüzyılı Maarif Modeli fen bilimleri öğretim programına (5. 6. ve 7. Sınıflar için TYMM 2024 güncel müfredatına; 8. Sınıf için ise LGS MEB müfredatına) %100 uyumlu olmalıdır.`;
  const prompt = `Lütfen ${sinif}. Sınıf düzeyinde şu kazanım için mükemmel bir konu anlatımı dokümanı hazırla:
Ünite/Tema: ${unite}
Kazanım Detayı: ${topic}
Pedagojik Anlatım Düzeyi: ${duzey} düzeyi öğrencilerine uygun
Ders Anlatım Stili: ${stil} formatında
${not ? 'Ek Öğretmen Yönergesi / Vurgu Noktaları: ' + not : ''}

Lütfen içeriği şu başlık düzeniyle yapılandır (Markdown h1-h2-h3 kullanarak):
1. **🔬 Derse Giriş & Günlük Hayat Bağlantısı:** ...
2. **📖 Temel Kavramlar & Bilimsel Tanımlar:** ...
3. **💡 Detaylı Açıklamalar & Modelleme:** (LaTeX formülleri ile)
4. **⚠️ Önemli Ayrıntılar & Sık Karıştırılan Noktalar:** ...
5. **🎯 Akılda Kalıcı Şifreler & Özet:** ...`;

  setLoading('konu', true);
  try {
    const result = await unifiedAiGenerate(prompt, systemPrompt, 'konu', sinif, unite);
    rawOutputs.konu = result;
    localStorage.setItem('cache_fenai_konu', result);
    processAndRenderOutput('output-konu', result);
    // Soru bankasına kaydet
    await db_bankasiKaydet({
      baslik: `${sinif}. Sınıf - ${unite} - ${topic}`,
      tur: 'konu',
      sinif: sinif,
      unite: unite,
      konu: topic,
      icerik: result,
      tarih: new Date().toISOString(),
      favori: false
    });
    showToast('Konu anlatımı üretildi ve soru bankasına kaydedildi!', 'success');
  } catch(e) { if (e.message !== 'no key') showToast('Hata: ' + e.message, 'error'); }
  setLoading('konu', false);
}

async function generateTest() {
  const sinif  = document.getElementById('test-sinif').value;
  const unite  = document.getElementById('test-unite').value;
  const topic  = document.getElementById('test-topic').value;
  const sayi   = document.getElementById('test-sayi').value;
  const tip    = document.getElementById('test-tip').value;
  const zorluk = document.getElementById('test-zorluk').value;
  const gorsel = document.getElementById('test-gorsel').value.trim();

  const systemPrompt = `Sen profesyonel bir MEB Ölçme ve Değerlendirme uzmanı ve fen bilimleri öğretmenisin. Soruları TYMM 2024 veya LGS müfredatına uygun test kitabı formatında hazırlarsın.`;
  let prompt = `Lütfen ${sinif}. Sınıf düzeyi için kavram kavrama testi hazırla.
Ünite/Tema: ${unite}
Kapsanan Kazanımlar: ${topic}
Soru Sayısı: ${sayi}
Soru Tipi: ${tip}
Zorluk: ${zorluk}
Her sorunun altında doğru cevap ve açıklama olsun. LaTeX kullan.`;

  if (gorsel) prompt += `\n📊 Görsel/Tablo/Grafik İsteği:\n${gorsel}`;

  setLoading('test', true);
  try {
    const result = await unifiedAiGenerate(prompt, systemPrompt, 'test', sinif, unite);
    rawOutputs.test = result;
    localStorage.setItem('cache_fenai_test', result);
    processAndRenderOutput('output-test', result);
    await db_bankasiKaydet({
      baslik: `${sinif}. Sınıf - ${unite} - ${topic} (Test)`,
      tur: 'test',
      sinif: sinif,
      unite: unite,
      konu: topic,
      icerik: result,
      tarih: new Date().toISOString(),
      favori: false
    });
    showToast('Test üretildi ve soru bankasına kaydedildi!', 'success');
  } catch(e) { if (e.message !== 'no key') showToast('Hata: ' + e.message, 'error'); }
  setLoading('test', false);
}

async function generateBaglamli() {
  const sinif    = document.getElementById('bag-sinif').value;
  const unite    = document.getElementById('bag-unite').value;
  const topic    = document.getElementById('bag-topic').value;
  const senaryo  = document.getElementById('bag-senaryo').value;
  const sayi     = document.getElementById('bag-sayi').value;
  const gorsel   = document.getElementById('bag-gorsel').value.trim();

  const systemPrompt = `Sen uluslararası fen okuryazarlığı ölçme değerlendirme (PISA/TIMSS) sınav komisyonu üyesi ve fen bilimleri editörüsün.`;
  let prompt = `Lütfen ${sinif}. Sınıf düzeyinde, PISA felsefesine ve bilimsel sorgulama becerilerine uygun bir senaryolu bağlam belgesi üret.
Ünite/Tema: ${unite}
Kazanım Odak Alanı: ${topic}
Senaryo Ana Teması: ${senaryo}
Hazırlanacak Bağlamlı Soru Adedi: ${sayi} adet

Yapı:
1. **📖 Senaryo Metni / Grafiksel Bağlam:** ...
2. **❓ Yeni Nesil Sorular:** ...
3. **🔑 Ayrıntılı Değerlendirme & Cevap Anahtarı:** ...`;

  if (gorsel) prompt += `\n📊 Görsel/Tablo/Grafik İsteği:\n${gorsel}`;

  setLoading('bag', true);
  try {
    const result = await unifiedAiGenerate(prompt, systemPrompt, 'bag', sinif, unite);
    rawOutputs.bag = result;
    localStorage.setItem('cache_fenai_bag', result);
    processAndRenderOutput('output-bag', result);
    await db_bankasiKaydet({
      baslik: `${sinif}. Sınıf - ${unite} - ${topic} (Bağlamlı)`,
      tur: 'baglamli',
      sinif: sinif,
      unite: unite,
      konu: topic,
      icerik: result,
      tarih: new Date().toISOString(),
      favori: false
    });
    showToast('Bağlamlı sorular üretildi ve soru bankasına kaydedildi!', 'success');
  } catch(e) { if (e.message !== 'no key') showToast('Hata: ' + e.message, 'error'); }
  setLoading('bag', false);
}

async function generateCalisma() {
  const sinif = document.getElementById('ck-sinif').value;
  const unite = document.getElementById('ck-unite').value;
  const topic = document.getElementById('ck-topic').value;
  const turEl = document.getElementById('ck-tur');
  const tur   = turEl.options[turEl.selectedIndex].text;
  const sayi  = document.getElementById('ck-sayi').value;
  const gorsel = document.getElementById('ck-gorsel').value.trim();

  const systemPrompt = `Sen yaratıcı fen etkinlikleri tasarlayan pedagojik içerik geliştiricisisin.`;
  let prompt = `Lütfen ${sinif}. Sınıf düzeyinde, öğrencilerin bireysel veya akranlarıyla iş birliği içinde yapabileceği bir çalışma kağıdı belgesi oluştur.
Ünite/Tema: ${unite}
Kazanım: ${topic}
Etkinlik Formatı: ${tur}
Soru/Öğe Sayısı: ${sayi} adet

Lütfen çalışma kağıdıma standart bir "Öğrenci Ad-Soyad-Sınıf-Okul" bilgi formu başlığı koyun. Etkinliklerin anlaşılır yönergelerini yazın ve en sonda öğretmen için bir "Çözüm Anahtarı" ekleyin.`;

  if (gorsel) prompt += `\n📊 Görsel/Tablo/Grafik İsteği:\n${gorsel}`;

  setLoading('ck', true);
  try {
    const result = await unifiedAiGenerate(prompt, systemPrompt, 'ck', sinif, unite);
    rawOutputs.ck = result;
    localStorage.setItem('cache_fenai_ck', result);
    processAndRenderOutput('output-ck', result);
    await db_bankasiKaydet({
      baslik: `${sinif}. Sınıf - ${unite} - ${topic} (Çalışma Kağıdı)`,
      tur: 'calisma',
      sinif: sinif,
      unite: unite,
      konu: topic,
      icerik: result,
      tarih: new Date().toISOString(),
      favori: false
    });
    showToast('Çalışma kağıdı üretildi ve soru bankasına kaydedildi!', 'success');
  } catch(e) { if (e.message !== 'no key') showToast('Hata: ' + e.message, 'error'); }
  setLoading('ck', false);
}

async function generateYazili() {
  const sinif = document.getElementById('yaz-sinif').value;
  const unite = document.getElementById('yaz-unite').value;
  const gorsel = document.getElementById('yaz-gorsel').value.trim();

  if (selectedYaziliCiktilar.length === 0) {
    showToast('Lütfen en az bir öğrenme çıktısı ve soru yapısı ekleyin!', 'error');
    return;
  }

  // Detaylı soru yapısını seçilen öğrenme çıktılarına göre oluştur
  let detailedComposition = '';
  let toplamPuan = 0;
  
  selectedYaziliCiktilar.forEach((c, idx) => {
    detailedComposition += `\nKazanım ${idx + 1}: ${c.fullText}\n`;
    c.sorular.forEach((q, qIdx) => {
      const typeStr = q.tip === 'coktan' ? 'Çoktan Seçmeli (Test)' 
                    : q.tip === 'acik-uc' ? 'Açık Uçlu Klasik' 
                    : q.tip === 'bosluk' ? 'Boşluk Doldurma' 
                    : q.tip === 'dogru-yanlis' ? 'Doğru-Yanlış' 
                    : 'Eşleştirme';
      detailedComposition += `  - Soru ${qIdx + 1}: ${typeStr} formatında, ${q.puan} puan değerinde.\n`;
      toplamPuan += q.puan;
    });
  });

  const systemPrompt = `Sen MEB müfredat standartlarına tam uyumlu yazılı sınav hazırlayan kıdemli fen bilgisi zümre başkanısın.`;
  let prompt = `Lütfen aşağıda kazanımları ve soru tipleri detaylı olarak belirtilen resmi ${sinif}. Sınıf 1. Dönem Yazılı Sınav kağıdını ve cevap anahtarını hazırla.
Ünite/Tema: ${unite}
Sınav Toplam Puanı: ${toplamPuan} Puan

Yazılı Sınav Soru Dağılımı ve Yapısal Şeması:
${detailedComposition}

Lütfen sınav belgesini şu standart yapıda oluştur:
1. **Resmi Okul Sınav Başlığı** (Okul Adı, Sınıf, Dönem, Sınav Tarihi alanları olan MEB şablonu)
2. **Öğrenci Yönergeleri & Süre Bilgisi**
3. **Sınav Soruları Bölümleri** (Belirtilen kazanım ve tiplere tam olarak sadık kalarak, her soru için puanını belirterek)
4. **Resmi Çözüm & Dereceli Puanlama Anahtarı** (Her sorunun çözümü, doğru şıkkı veya açık uçlu sorunun detaylı çözümü/puanlama kriterleri)`;

  if (gorsel) prompt += `\n📊 Görsel/Tablo/Grafik İsteği:\n${gorsel}`;

  setLoading('yaz', true);
  try {
    const result = await unifiedAiGenerate(prompt, systemPrompt, 'yaz', sinif, unite);
    rawOutputs.yaz = result;
    localStorage.setItem('cache_fenai_yaz', result);
    processAndRenderOutput('output-yaz', result);
    await db_bankasiKaydet({
      baslik: `${sinif}. Sınıf - ${unite} - Yazılı Sınav (${toplamPuan} Puan)`,
      tur: 'yazili',
      sinif: sinif,
      unite: unite,
      konu: selectedYaziliCiktilar.map(c => c.code).join(', '),
      icerik: result,
      tarih: new Date().toISOString(),
      favori: false
    });
    showToast('Yazılı sınav üretildi ve soru bankasına kaydedildi!', 'success');
  } catch(e) { if (e.message !== 'no key') showToast('Hata: ' + e.message, 'error'); }
  setLoading('yaz', false);
}

// ============================================================
// YAZILI SINAV YAPISI (UI)
// ============================================================
function initYaziliSorular() {
  selectedYaziliCiktilar = [];
  renderYaziliCiktilar();
}

function addYaziliCikti() {
  const ciktiEl = document.getElementById('yaz-cikti');
  if (!ciktiEl || !ciktiEl.value) {
    showToast('Lütfen önce bir öğrenme çıktısı seçin!', 'error');
    return;
  }
  const fullText = ciktiEl.value;
  
  if (selectedYaziliCiktilar.some(c => c.fullText === fullText)) {
    showToast('Bu öğrenme çıktısı zaten eklenmiş!', 'warning');
    return;
  }
  
  let code = '';
  const match = fullText.match(/\((FB\.\d+\.\d+\.\d+\.\d+)\)/);
  if (match) {
    code = match[1];
  } else {
    code = fullText.substring(fullText.lastIndexOf('(') + 1, fullText.lastIndexOf(')')) || 'Kazanım';
  }

  selectedYaziliCiktilar.push({
    id: Date.now() + Math.random().toString(36).substr(2, 5),
    fullText: fullText,
    code: code,
    soruSayisi: 1,
    sorular: [
      { tip: 'acik-uc', puan: 10 }
    ]
  });
  
  renderYaziliCiktilar();
  showToast('Öğrenme çıktısı eklendi.', 'success');
}

function renderYaziliCiktilar() {
  const container = document.getElementById('yaz-sorular-list');
  if (!container) return;
  container.innerHTML = '';
  
  if (selectedYaziliCiktilar.length === 0) {
    container.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-muted); font-style: italic;">Henüz eklenmiş öğrenme çıktısı yok. Lütfen yukarıdan seçip ekleyin.</div>`;
    updateToplamPuan();
    return;
  }
  
  selectedYaziliCiktilar.forEach((c, idx) => {
    let questionsHtml = '';
    c.sorular.forEach((q, qIdx) => {
      questionsHtml += `
        <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px; flex-wrap: wrap; background: var(--bg); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border);">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--secondary);">Soru ${qIdx + 1}:</span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">Soru Tipi:</span>
            <select style="width: auto; margin: 0; padding: 4px 8px; font-size: 0.8rem; height: auto;" onchange="updateQuestionType('${c.id}', ${qIdx}, this.value)">
              <option value="acik-uc" ${q.tip === 'acik-uc' ? 'selected' : ''}>Açık Uçlu (Klasik)</option>
              <option value="coktan" ${q.tip === 'coktan' ? 'selected' : ''}>Çoktan Seçmeli (Test)</option>
              <option value="bosluk" ${q.tip === 'bosluk' ? 'selected' : ''}>Boşluk Doldurma</option>
              <option value="eslestirme" ${q.tip === 'eslestirme' ? 'selected' : ''}>Eşleştirme</option>
              <option value="dogru-yanlis" ${q.tip === 'dogru-yanlis' ? 'selected' : ''}>Doğru-Yanlış</option>
            </select>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">Puan:</span>
            <input type="number" min="1" max="100" value="${q.puan}" style="width: 60px; margin: 0; padding: 4px 8px; font-size: 0.8rem;" onchange="updateQuestionPuan('${c.id}', ${qIdx}, this.value)" />
          </div>
        </div>
      `;
    });

    container.innerHTML += `
      <div class="q-card" style="background: var(--surface2); padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
          <div>
            <span class="badge badge-primary" style="font-size: 0.8rem; margin-bottom: 6px;">${c.code}</span>
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text); line-height: 1.4;">${c.fullText}</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="removeYaziliCikti('${c.id}')" style="padding: 4px 8px; font-size: 0.75rem;">✕ Sil</button>
        </div>
        
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; border-top: 1px solid var(--border); padding-top: 10px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Soru Sayısı:</span>
            <input type="number" min="1" max="20" value="${c.soruSayisi}" style="width: 70px; margin: 0; padding: 6px 10px;" onchange="updateSoruSayisi('${c.id}', this.value)" />
          </div>
        </div>
        
        <div style="margin-left: 10px;">
          ${questionsHtml}
        </div>
      </div>
    `;
  });
  
  updateToplamPuan();
}

function removeYaziliCikti(id) {
  selectedYaziliCiktilar = selectedYaziliCiktilar.filter(c => c.id !== id);
  renderYaziliCiktilar();
  showToast('Öğrenme çıktısı silindi.', 'info');
}

function updateSoruSayisi(id, val) {
  const count = parseInt(val) || 1;
  const c = selectedYaziliCiktilar.find(item => item.id === id);
  if (!c) return;
  c.soruSayisi = count;
  
  if (c.sorular.length < count) {
    while (c.sorular.length < count) {
      c.sorular.push({ tip: 'acik-uc', puan: 10 });
    }
  } else if (c.sorular.length > count) {
    c.sorular.length = count;
  }
  
  renderYaziliCiktilar();
}

function updateQuestionType(id, qIdx, val) {
  const c = selectedYaziliCiktilar.find(item => item.id === id);
  if (!c || !c.sorular[qIdx]) return;
  c.sorular[qIdx].tip = val;
}

function updateQuestionPuan(id, qIdx, val) {
  const points = parseInt(val) || 0;
  const c = selectedYaziliCiktilar.find(item => item.id === id);
  if (!c || !c.sorular[qIdx]) return;
  c.sorular[qIdx].puan = points;
  updateToplamPuan();
}

function updateToplamPuan() {
  let toplam = 0;
  selectedYaziliCiktilar.forEach(c => {
    c.sorular.forEach(q => {
      toplam += q.puan;
    });
  });
  const el = document.getElementById('toplam-puan');
  if (el) el.textContent = toplam + ' Puan';
}

// ============================================================
// SÜRÜKLE-BIRAK OYUNU
// ============================================================
// ============================================================
// DENEME SINAVI YAPISI (UI & AI)
// ============================================================
function denemeSinifDegisti() {
  loadUnits('deneme-konu');
  loadUnits('deneme-ogr');
  selectedDenemeOgrCiktilar = [];
  renderDenemeOgrCiktilar();
}

function denemeTipDegisti() {
  const tip = document.getElementById('deneme-tip').value;
  document.getElementById('deneme-panel-genel').style.display = tip === 'genel' ? 'block' : 'none';
  document.getElementById('deneme-panel-konu').style.display = tip === 'konu' ? 'block' : 'none';
  document.getElementById('deneme-panel-ogretmen').style.display = tip === 'ogretmen' ? 'block' : 'none';
}

function addDenemeOgrCikti() {
  const ciktiEl = document.getElementById('deneme-ogr-cikti');
  if (!ciktiEl || !ciktiEl.value) {
    showToast('Lütfen önce bir öğrenme çıktısı seçin!', 'error');
    return;
  }
  const fullText = ciktiEl.value;
  const count = parseInt(document.getElementById('deneme-ogr-soru-sayisi').value) || 1;

  if (selectedDenemeOgrCiktilar.some(c => c.fullText === fullText)) {
    showToast('Bu öğrenme çıktısı zaten eklenmiş!', 'warning');
    return;
  }

  let code = '';
  const match = fullText.match(/\((FB\.\d+\.\d+\.\d+\.\d+)\)/);
  if (match) {
    code = match[1];
  } else {
    code = fullText.substring(fullText.lastIndexOf('(') + 1, fullText.lastIndexOf(')')) || 'Kazanım';
  }

  selectedDenemeOgrCiktilar.push({
    id: Date.now() + Math.random().toString(36).substr(2, 5),
    fullText: fullText,
    code: code,
    soruSayisi: count
  });

  renderDenemeOgrCiktilar();
  showToast('Kazanım eklendi.', 'success');
}

function renderDenemeOgrCiktilar() {
  const container = document.getElementById('deneme-ogr-liste');
  if (!container) return;
  container.innerHTML = '';

  if (selectedDenemeOgrCiktilar.length === 0) {
    container.innerHTML = `<div style="padding: 12px; text-align: center; color: var(--text-muted); font-style: italic; font-size: 0.8rem;">Henüz kazanım eklenmedi.</div>`;
    return;
  }

  selectedDenemeOgrCiktilar.forEach((c) => {
    container.innerHTML += `
      <div style="background: var(--bg); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <div style="flex: 1;">
          <span class="badge badge-primary" style="font-size: 0.75rem; margin-bottom: 4px;">${c.code}</span>
          <span style="font-size: 0.8rem; color: var(--text); font-weight: 500; display: block; line-height: 1.4;">${c.fullText}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Soru Sayısı: <strong>${c.soruSayisi} Soru</strong></span>
        </div>
        <button class="btn btn-danger btn-sm" onclick="removeDenemeOgrCikti('${c.id}')" style="padding: 2px 6px; font-size: 0.7rem;">✕</button>
      </div>
    `;
  });
}

function removeDenemeOgrCikti(id) {
  selectedDenemeOgrCiktilar = selectedDenemeOgrCiktilar.filter(c => c.id !== id);
  renderDenemeOgrCiktilar();
  showToast('Kazanım silindi.', 'info');
}

function initDeneme() {
  selectedDenemeOgrCiktilar = [];
  // Gecikmeli çağırarak DOM elementlerinin yüklenmesini bekle
  setTimeout(() => {
    denemeSinifDegisti();
    denemeTipDegisti();
  }, 100);
}

async function generateDeneme() {
  const sinif = document.getElementById('deneme-sinif').value;
  const tip = document.getElementById('deneme-tip').value;
  const zorluk = document.getElementById('deneme-zorluk').value;
  const tarz = document.getElementById('deneme-tarz').value;

  let prompt = '';
  let title = '';
  let sub = '';
  let denemeUnite = '';

  const systemPrompt = `Sen profesyonel bir ölçme ve değerlendirme uzmanısın. MEB standartlarına (TYMM 2024 / LGS) tam uyumlu deneme sınavları hazırlarsın. Soruların pedagojik olarak kusursuz, bilimsel olarak hatasız olmalıdır.`;

  if (tip === 'genel') {
    const soruSayisi = document.getElementById('deneme-genel-sayi').value;
    title = `${sinif}. Sınıf Genel Deneme Sınavı`;
    sub = `Müfredat genelinden ${soruSayisi} soruluk deneme sınavı`;
    
    prompt = `Lütfen ${sinif}. Sınıf düzeyinde fen bilimleri dersi için ${soruSayisi} sorudan oluşan bir Genel Deneme Sınavı hazırla.
Müfredat Kapsamı: Bu sınıf seviyesindeki TÜM ünitelerden, konulardan ve öğrenme çıktılarından dengeli bir soru dağılımı (kazanım ağırlıklarına göre) kendin otomatik olarak yap.
Zorluk Derecesi: ${zorluk} düzeyinde
Soru Tarzı: ${tarz === 'test' ? 'Sadece Çoktan Seçmeli (4 Seçenekli)' : 'Karma Soru Tipleri (Çoktan seçmeli, açık uçlu ve boşluk doldurma gibi)'}

Sınav Şablonu Yapısı:
1. **Sınav Başlığı** (Deneme Sınavı Başlığı, Ad, Soyad, Sınıf, Numara alanları)
2. **Sınav Yönergeleri** (Süre, soru adedi vb.)
3. **Sorular** (Her sorunun hangi kazanıma/öğrenme çıktısına ait olduğunu sorunun üstünde veya parantez içinde belirt, örn: "FB.5.1.1.1")
4. **Cevap Anahtarı ve Açıklamalı Çözümler** (Her sorunun doğru cevabını ve pedagojik açıklamalı çözümünü ekle)`;
  } 
  else if (tip === 'konu') {
    const unite = document.getElementById('deneme-konu-unite').value;
    denemeUnite = unite;
    const topic = document.getElementById('deneme-konu-topic').value;
    const cikti = document.getElementById('deneme-konu-cikti').value;
    const soruSayisi = document.getElementById('deneme-konu-sayi').value;
    
    title = `${sinif}. Sınıf Konu Denemesi`;
    sub = `${unite} - ${topic}`;

    const kapsam = cikti === 'tum' ? `Bu konunun tüm alt öğrenme çıktılarını kapsasın.` : `SADECE şu öğrenme çıktısına odaklansın: "${cikti}"`;

    prompt = `Lütfen ${sinif}. Sınıf düzeyinde fen bilimleri dersi için ${soruSayisi} sorudan oluşan bir Konu Denemesi Sınavı hazırla.
Ünite/Tema: ${unite}
Konu Başlığı: ${topic}
Kazanım/Öğrenme Çıktısı Kapsamı: ${kapsam}
Zorluk Derecesi: ${zorluk} düzeyinde
Soru Tarzı: ${tarz === 'test' ? 'Sadece Çoktan Seçmeli (4 Seçenekli)' : 'Karma Soru Tipleri (Çoktan seçmeli, açık uçlu vb.)'}

Sınav Şablonu Yapısı:
1. **Sınav Başlığı** (Konu Deneme Sınavı Başlığı, Ad, Soyad vb.)
2. **Sorular** (Her sorunun kazanıma uyumunu ve kodunu belirt)
3. **Cevap Anahtarı ve Detaylı Çözümler**`;
  } 
  else if (tip === 'ogretmen') {
    if (selectedDenemeOgrCiktilar.length === 0) {
      showToast('Lütfen önce kazanım ekleyin!', 'error');
      return;
    }
    
    title = `${sinif}. Sınıf Özel Seçim Deneme Sınavı`;
    sub = `Öğretmen tarafından seçilen ${selectedDenemeOgrCiktilar.length} farklı kazanım`;
    
    let composition = '';
    let toplamSoru = 0;
    selectedDenemeOgrCiktilar.forEach((c, idx) => {
      composition += `- Kazanım ${idx + 1}: ${c.fullText} -> ${c.soruSayisi} Soru\n`;
      toplamSoru += c.soruSayisi;
    });

    prompt = `Lütfen ${sinif}. Sınıf düzeyinde fen bilimleri dersi için öğretmen tarafından özel olarak seçilmiş kazanımlardan oluşan, toplam ${toplamSoru} soruluk bir Deneme Sınavı hazırla.
Zorluk Derecesi: ${zorluk} düzeyinde
Soru Tarzı: ${tarz === 'test' ? 'Sadece Çoktan Seçmeli (4 Seçenekli)' : 'Karma Soru Tipleri (Çoktan seçmeli, açık uçlu vb.)'}

Sınav Kazanım ve Soru Dağılımları Yapısı:
${composition}

Sınav Şablonu Yapısı:
1. **Sınav Başlığı**
2. **Sorular** (Kazanım ve soru sayılarına tam olarak sadık kalarak)
3. **Cevap Anahtarı ve Çözüm Ayrıntıları**`;
  }

  setLoading('deneme', true);
  try {
    const result = await unifiedAiGenerate(prompt, systemPrompt, 'deneme', sinif, denemeUnite);
    rawOutputs.deneme = result;
    localStorage.setItem('cache_fenai_deneme', result);
    processAndRenderOutput('output-deneme', result);
    
    await db_bankasiKaydet({
      baslik: `${sinif}. Sınıf Deneme Sınavı - ${tip === 'genel' ? 'Genel' : tip === 'konu' ? 'Konu' : 'Özel'}`,
      tur: 'test',
      sinif: sinif,
      unite: tip === 'konu' ? document.getElementById('deneme-konu-unite').value : 'Genel/Karma',
      konu: sub,
      icerik: result,
      tarih: new Date().toISOString(),
      favori: false
    });
    
    showToast('Deneme sınavı üretildi ve soru bankasına kaydedildi!', 'success');
  } catch(e) { if (e.message !== 'no key') showToast('Hata: ' + e.message, 'error'); }
  setLoading('deneme', false);
}

// ============================================================
// SORU BANKASI UI FONKSİYONLARI
// ============================================================
async function bankasiListele() {
  const ara = document.getElementById('bankasi-ara')?.value || '';
  const tur = document.getElementById('bankasi-tur')?.value || '';
  const sinif = document.getElementById('bankasi-sinif')?.value || '';
  const filtre = { ara, tur, sinif };
  const liste = await db_bankasiListele(filtre);
  loadDashboardStats();
  const container = document.getElementById('bankasi-liste');
  if (!container) return;
  if (liste.length === 0) {
    container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted);">Henüz kayıtlı içerik yok.</div>';
    return;
  }
  let html = '';
  liste.forEach(item => {
    html += `
      <div style="background:var(--surface2); padding:15px; border-radius:8px; margin-bottom:10px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <div><strong style="color:var(--primary);">${item.baslik}</strong></div>
          <div style="font-size:0.8rem; color:var(--text-muted);">
            ${item.tur === 'konu' ? '📖' : item.tur === 'test' ? '📋' : item.tur === 'baglamli' ? '🧠' : item.tur === 'calisma' ? '📄' : '📝'} 
            ${item.tur} · ${item.sinif}. Sınıf · ${new Date(item.tarih).toLocaleDateString('tr-TR')}
            ${item.favori ? ' ⭐' : ''}
          </div>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="btn btn-sm btn-outline" onclick="bankasiGoster('${item.id}')">👁</button>
          <button class="btn btn-sm ${item.favori ? 'btn-success' : 'btn-outline'}" onclick="bankasiFavoriToggle(${item.id})">⭐</button>
          <button class="btn btn-sm btn-danger" onclick="bankasiSil(${item.id})">🗑</button>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

async function bankasiSil(id) {
  if (!confirm('Bu içeriği silmek istediğinize emin misiniz?')) return;
  await db_bankasiSil(id);
  await bankasiListele();
  showToast('İçerik silindi.', 'info');
}

async function bankasiFavoriToggle(id) {
  await db_bankasiFavoriToggle(id);
  await bankasiListele();
}

function bankasiGoster(id) {
  // Henüz detay gösterme eklenmedi, ileride yapılacak.
  showToast('Detay gösterme özelliği yakında!', 'info');
}

function bankasiFiltrele() {
  bankasiListele();
}

function bankasiTemizleFiltre() {
  document.getElementById('bankasi-ara').value = '';
  document.getElementById('bankasi-tur').value = '';
  document.getElementById('bankasi-sinif').value = '';
  bankasiListele();
}

function bankasiDisariAktar() {
  // Tüm verileri JSON olarak dışa aktar
  db_bankasiListele().then(liste => {
    const blob = new Blob([JSON.stringify(liste, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fenai_soru_bankasi_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Soru bankası dışa aktarıldı!', 'success');
  });
}

function bankasiIceriAktar(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const veriler = JSON.parse(e.target.result);
      if (!Array.isArray(veriler)) throw new Error('Geçersiz format');
      const db = await openDatabase();
      const transaction = db.transaction('icerikler', 'readwrite');
      const store = transaction.objectStore('icerikler');
      let count = 0;
      for (let v of veriler) {
        // id'yi temizle (otomatik artsın)
        delete v.id;
        await new Promise((resolve, reject) => {
          const req = store.add(v);
          req.onsuccess = () => { count++; resolve(); };
          req.onerror = () => reject(req.error);
        });
      }
      await bankasiListele();
      showToast(`${count} içerik içe aktarıldı!`, 'success');
    } catch (err) {
      showToast('İçe aktarma hatası: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // reset
}

// ============================================================
// WEB URL VE YOUTUBE VİDEOSU ANALİZ SİSTEMİ
// ============================================================
async function analyzeUrlSource() {
  const urlInput = document.getElementById('kaynak-url');
  const sinifSelect = document.getElementById('kaynak-url-sinif');
  const resultDiv = document.getElementById('kaynak-url-sonuc');
  const btn = document.getElementById('btn-analiz-url');

  if (!urlInput || !sinifSelect || !resultDiv || !btn) return;

  const url = urlInput.value.trim();
  const sinif = sinifSelect.value;

  if (!url) {
    showToast('Lütfen geçerli bir URL adresi girin!', 'error');
    return;
  }

  // Yükleniyor durumu
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = '⏳ Web Sayfası Okunuyor...';
  resultDiv.innerHTML = `<div style="padding:12px; background:var(--surface2); border-left:4px solid var(--primary); border-radius:6px; color:var(--text); font-size:0.85rem;">
    🌐 Jina Reader ile web sayfası içeriği kazınıyor. Lütfen bekleyin...
  </div>`;

  try {
    // 1. Jina Reader API ile metin çek
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    const response = await fetch(jinaUrl);
    if (!response.ok) {
      throw new Error(`Web sayfası okunamadı (HTTP Hata: ${response.status})`);
    }
    const webMarkdown = await response.text();

    if (!webMarkdown || webMarkdown.trim().length < 50) {
      throw new Error('Web sayfasından anlamlı bir içerik alınamadı.');
    }

    btn.textContent = '🧠 Müfredat Uyum Kontrolü Yapılıyor...';
    resultDiv.innerHTML = `<div style="padding:12px; background:var(--surface2); border-left:4px solid var(--secondary); border-radius:6px; color:var(--text); font-size:0.85rem;">
      🧠 İçerik başarıyla çekildi (Boyut: ~${Math.round(webMarkdown.length / 1024)} KB). Şimdi yapay zeka ile <strong>${sinif}. Sınıf Fen Bilimleri</strong> müfredatına uygunluğu denetleniyor...
    </div>`;

    // 2. Kazanımları hazırla
    const mufre = getMufre();
    const curriculumObj = mufre[sinif] || {};
    let curriculumText = '';
    for (let unite in curriculumObj) {
      curriculumText += `Ünite: ${unite}\n`;
      curriculumObj[unite].forEach(t => {
        curriculumText += `- Kazanım/Konu: ${t}\n`;
      });
    }

    // 3. Prompt oluştur
    const systemPrompt = `Sen uzman bir MEB ölçme değerlendirme ve müfredat denetim uzmanısın. Görevin, verilen bir web sayfası/video metnini ilgili sınıf seviyesinin Fen Bilimleri müfredatı kazanımları ile karşılaştırmaktır.`;
    const checkPrompt = `Sana ${sinif}. Sınıf Fen Bilimleri dersi müfredat kazanımlarını ve bir ders kaynağı (web/video) içeriğini veriyorum. 

MÜFREDAT KAZANIMLARI:
${curriculumText}

KAYNAK METNİ:
${webMarkdown.substring(0, 10000)}

GÖREVİN VE KESİN KURALLARIN:
1. Kaynak metninin, ${sinif}. Sınıf Fen Bilimleri dersi müfredat kazanımlarından EN AZ BİRİYLE doğrudan ilişkili olup olmadığını denetle.
2. EĞER doğrudan ilişkili ise, yanıtına tam olarak "UYGUN:" kelimesiyle başla. Yanıtın formatı aynen şu olmalıdır:
UYGUN: [Kazanım Kodu/Konu Adı] - [İçeriğin Başlığı] - [2-3 cümlelik çok kısa ve anlaşılır kazanım analizi özeti]
3. EĞER doğrudan ilişkili DEĞİLSE veya tamamen kazanım dışı/başka bir ders/sınıf düzeyindeyse, yanıtına tam olarak "HATA:" kelimesiyle başla. Yanıtın formatı aynen şu olmalıdır:
HATA: Girdiğiniz kaynak metni veya video, ${sinif}. Sınıf Fen Bilimleri müfredat kazanımları dışındadır. [1 cümlelik gerekçe yazın].

Lütfen başka hiçbir giriş veya açıklama eklemeden doğrudan bu şablonlardan birini döndür.`;

    const checkResult = await unifiedAiGenerate(checkPrompt, systemPrompt, 'ck');
    const resultStr = checkResult.trim();

    if (resultStr.startsWith('UYGUN:')) {
      const cleanParts = resultStr.substring(6).trim().split(' - ');
      const title = cleanParts[1] || 'Web Kaynağı (YouTube / Makale)';
      const summary = cleanParts[2] || cleanParts[0] || 'Kaynak metni müfredatla uyumludur.';
      const outcome = cleanParts[0] || 'Kazanım';

      const sourceId = 'temp_' + Date.now();
      tempWebSources.push({
        id: sourceId,
        baslik: title,
        icerik: webMarkdown,
        tarih: new Date().toISOString()
      });

      await refreshSourceSelects();

      resultDiv.innerHTML = `
        <div style="padding:14px; background:rgba(0,201,167,0.1); border-left:4px solid var(--secondary); border-radius:8px; color:var(--text); font-size:0.85rem;">
          <strong style="color:var(--secondary); font-size:0.95rem;">🎉 Kazanım Uyumlu Kaynak Eklendi!</strong><br>
          <div style="margin-top:6px; font-weight:600;">İlişkili Kazanım: <span class="badge badge-primary">${outcome}</span></div>
          <div style="margin-top:4px; font-weight:600; color:var(--primary);">Başlık: ${title}</div>
          <div style="margin-top:6px; color:var(--text-muted); line-height:1.4;">Özet: ${summary}</div>
          <div style="margin-top:8px; font-size:0.75rem; color:var(--text-muted);">📌 Bu kaynak geçici olarak hafızaya alınmıştır. Üretim sayfalarındaki "Kaynak Seçimi" açılır kutularından <strong>"🌐 [Geçici] ${title}"</strong> seçeneğini seçerek kullanabilirsiniz.</div>
        </div>
      `;
      urlInput.value = '';
      showToast('Web kaynağı geçici hafızaya eklendi!', 'success');
    } else {
      const errorMsg = resultStr.startsWith('HATA:') ? resultStr.substring(5).trim() : resultStr;
      resultDiv.innerHTML = `
        <div style="padding:14px; background:rgba(255,107,107,0.1); border-left:4px solid var(--danger); border-radius:8px; color:var(--text); font-size:0.85rem;">
          <strong style="color:var(--danger); font-size:0.95rem;">⚠️ Hata: Kazanım Uyumsuzluğu</strong><br>
          <div style="margin-top:6px; line-height:1.4;">${errorMsg}</div>
        </div>
      `;
      showToast('Kazanım dışı kaynak tespit edildi!', 'error');
    }

  } catch (e) {
    console.error('URL analizi hatası:', e);
    resultDiv.innerHTML = `
      <div style="padding:14px; background:rgba(255,107,107,0.1); border-left:4px solid var(--danger); border-radius:8px; color:var(--text); font-size:0.85rem;">
        <strong style="color:var(--danger); font-size:0.95rem;">❌ Kaynak Okunamadı</strong><br>
        <div style="margin-top:6px; line-height:1.4;">Hata Detayı: ${e.message}</div>
      </div>
    `;
    showToast('Analiz başarısız oldu.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function deleteTempSource(id) {
  if (!confirm('Bu geçici web kaynağını silmek istediğinize emin misiniz?')) return;
  tempWebSources = tempWebSources.filter(k => k.id !== id);
  refreshSourceSelects();
  showToast('Geçici web kaynağı kaldırıldı.', 'info');
}

// ============================================================
// PWA (PROGRESSIVE WEB APP) YÜKLEME & UYGULAMA YÖNETİMİ
// ============================================================
let deferredPwaPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
  
  const installBtnTop = document.getElementById('btn-pwa-install');
  if (installBtnTop) installBtnTop.style.display = 'inline-flex';
  
  const installBtnSet = document.getElementById('btn-pwa-install-settings');
  if (installBtnSet) installBtnSet.style.display = 'inline-flex';
});

async function installPWA() {
  if (!deferredPwaPrompt) {
    showToast('Uygulama zaten yüklü veya Chrome adres çubuğundaki (📲) yükleme simgesini kullanabilirsiniz.', 'info');
    return;
  }
  deferredPwaPrompt.prompt();
  const { outcome } = await deferredPwaPrompt.userChoice;
  if (outcome === 'accepted') {
    console.log('Kullanıcı PWA yüklemesini onayladı.');
    hidePwaButtons();
  }
  deferredPwaPrompt = null;
}

function hidePwaButtons() {
  const installBtnTop = document.getElementById('btn-pwa-install');
  if (installBtnTop) installBtnTop.style.display = 'none';
  const installBtnSet = document.getElementById('btn-pwa-install-settings');
  if (installBtnSet) installBtnSet.style.display = 'none';
}

window.addEventListener('appinstalled', () => {
  console.log('FenAI PWA olarak yüklendi.');
  hidePwaButtons();
  checkPwaMode();
  showToast('FenAI başarıyla PWA uygulaması olarak masaüstünüze/telefonunuza yüklendi! 🎉', 'success');
});

function checkPwaMode() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const pwaTitle = document.getElementById('pwa-status-title');
  const pwaSub = document.getElementById('pwa-status-sub');
  
  if (isStandalone) {
    hidePwaButtons();
    if (pwaTitle) pwaTitle.textContent = '📱 PWA Masaüstü/Mobil Uygulama Modu Aktif';
    if (pwaSub) pwaSub.textContent = 'FenAI şu anda tam ekran bağımsız PWA uygulaması olarak çalışıyor.';
  }
}

// ============================================================
// CANFENCI PORTAL & ROADMAP BİLDİRİMLERİ
// ============================================================
function showWorkspaceNotification() {
  showToast('CanFenci platformundayken aktif olarak "Teacher Studio" çalışma alanındasınız.', 'info');
}

function showRoadmapNotification(moduleName) {
  showToast(`${moduleName} stüdyosu geliştirilme aşamasındadır ve çok yakında platforma dahil edilecektir!`, 'info');
}

function showPortalNotification(portalName) {
  showToast(`${portalName} portalı üzerinde çalışmalarımız sürmektedir. Takipte kalın!`, 'info');
}