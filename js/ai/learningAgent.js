// ============================================================
// LEARNINGAGENT.JS – Öğrenen Yapay Zeka Ajanı ve Öneri Motoru
// ============================================================

window.FenAI = window.FenAI || {};

window.FenAI.LearningAgent = (() => {
  const STORAGE_KEY = 'canfenci_learning_profile_v1';

  // Varsayılan öğrenme profili
  let profile = {
    history: [], // [{ timestamp, module, grade, topic, kazanimCount, difficulty }]
    topicFrequency: {}, // { "8-DNA": 4 }
    moduleFrequency: {}, // { "konu": 5, "test": 3 }
    gradeFrequency: {}, // { "8": 10 }
    lastActivity: null
  };

  // Verileri yükle
  function loadProfile() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        profile = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("LearningAgent profil okuma hatası:", e);
    }
  }

  // Verileri kaydet
  function saveProfile() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn("LearningAgent profil kaydetme hatası:", e);
    }
  }

  // Yeni bir içerik üretimi olayını kaydet
  function logActivity(module, grade, topic, extraData = {}) {
    loadProfile();
    const entry = {
      timestamp: Date.now(),
      module,
      grade: grade || '8',
      topic: topic || 'Genel Kazanım',
      extraData
    };

    profile.history.unshift(entry);
    if (profile.history.length > 50) profile.history.pop(); // Son 50 faaliyeti tut

    const topicKey = `${grade}-${topic}`;
    profile.topicFrequency[topicKey] = (profile.topicFrequency[topicKey] || 0) + 1;
    profile.moduleFrequency[module] = (profile.moduleFrequency[module] || 0) + 1;
    profile.gradeFrequency[grade] = (profile.gradeFrequency[grade] || 0) + 1;
    profile.lastActivity = entry;

    saveProfile();
    console.log("🤖 LearningAgent: Faaliyet kaydedildi ve öğrenme profili güncellendi.", entry);
  }

  // Sonraki evre pedagojik önerilerini üret (Proactive Next-Step Suggestions)
  function getProactiveSuggestions() {
    loadProfile();
    const suggestions = [];

    if (!profile.lastActivity) {
      // Başlangıç önerisi
      suggestions.push({
        type: 'recommendation',
        title: '🌱 Hoş Geldiniz! İlk İçeriğinizi Üretelim',
        description: 'Türkiye Yüzyılı Maarif Modeline uygun 8. Sınıf Konu Anlatımı ile başlaşabilirsiniz.',
        module: 'konu',
        actionText: '📖 Konu Anlatımı Başlat'
      });
      return suggestions;
    }

    const { module, grade, topic } = profile.lastActivity;

    // Pedagojik Mantık Döngüsü:
    // Konu Anlatımı -> Kavram Testi veya Çalışma Kağıdı
    // Kavram Testi -> Bağlamlı Soru veya Deneme Sınavı
    // Deneme Sınavı / Yazılı -> Soru Bankasına Kaydet veya Sunum Hazırla
    if (module === 'konu') {
      suggestions.push({
        type: 'next_step',
        title: `⚡ Sonraki Evre: ${grade}. Sınıf ${topic} Kavram Testi`,
        description: `Hazırladığınız konu anlatımının ardından öğrencilerin kavrama düzeyini ölçmek için 10 soruluk test oluşturun.`,
        module: 'test',
        grade,
        topic,
        actionText: '📋 Kavram Testi Oluştur'
      });
      suggestions.push({
        type: 'next_step',
        title: `📄 Etkinlik Hazırla: ${topic} Çalışma Kağıdı`,
        description: 'Öğrencilerin derste aktif öğrenmesini sağlayacak yapılandırılmış şablon çalışma kağıdı hazırlayın.',
        module: 'calisma',
        grade,
        topic,
        actionText: '📄 Çalışma Kağıdı Başlat'
      });
    } else if (module === 'test' || module === 'baglamli') {
      suggestions.push({
        type: 'next_step',
        title: `📝 Ölçme Değerlendirme: ${grade}. Sınıf Deneme Sınavı`,
        description: `Ürettiğiniz test sorularına benzer kazanımlarla resmi sınav formatında genel deneme hazırlayın.`,
        module: 'deneme',
        grade,
        topic,
        actionText: '📝 Deneme Sınavı Oluştur'
      });
    } else {
      suggestions.push({
        type: 'next_step',
        title: `📖 Yeni Konu Anlatımı: ${topic}`,
        description: 'Müfredat kazanımlarına uygun yeni bir pedagojik ders belgesi oluşturun.',
        module: 'konu',
        grade,
        topic,
        actionText: '📖 Ders Belgesi Üret'
      });
    }

    return suggestions;
  }

  // İlk yükleme
  loadProfile();

  return {
    logActivity,
    getProactiveSuggestions,
    getProfile: () => profile
  };
})();
