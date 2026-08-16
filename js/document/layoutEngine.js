// ============================================================
// LAYOUTENGINE.JS – CanFenci Pedagojik Mizanpaj ve Düzen Motoru
// ============================================================

window.FenAI = window.FenAI || {};

window.FenAI.LayoutEngine = (() => {
  
  // Bileşen nesnelerini döküman mizanpaj şablonlarına göre düzenler
  function applyLayout(moduleType, componentNodes, titleData = {}) {
    const layout = {
      moduleType,
      title: titleData.title || "CanFenci Yayın Serisi",
      sub: titleData.sub || "Türkiye Yüzyılı Maarif Modeli",
      sections: []
    };

    if (moduleType === 'konu') {
      // Konu Anlatımı Mizanpajı: Akış (Hero -> Bilgi -> Düşün -> Deney -> Özet -> Not)
      layout.sections.push({
        type: 'header',
        components: componentNodes.filter(c => c.type === 'HeroTitle' || c.type === 'InfoCard')
      });
      layout.sections.push({
        type: 'content',
        components: componentNodes.filter(c => c.type === 'ThinkBox' || c.type === 'WarningBox' || c.type === 'ExperimentCard')
      });
      layout.sections.push({
        type: 'footer',
        components: componentNodes.filter(c => c.type === 'Summary' || c.type === 'TeacherNote' || c.type === 'QRActivity')
      });
    } else if (moduleType === 'test' || moduleType === 'baglamli' || moduleType === 'calisma' || moduleType === 'yazili' || moduleType === 'deneme') {
      // Test ve Çalışma Kağıdı Mizanpajı: Çift Sütun / Soru Kartları Grid & Cevap Anahtarı
      layout.sections.push({
        type: 'questions',
        components: componentNodes.filter(c => c.type === 'QuestionCard' || c.type === 'InfoCard')
      });
      layout.sections.push({
        type: 'answers',
        components: componentNodes.filter(c => c.type === 'Summary' || c.type === 'TeacherNote')
      });
    } else {
      // Varsayılan Doğrusal Mizanpaj
      layout.sections.push({
        type: 'general',
        components: componentNodes
      });
    }

    return layout;
  }

  // Sunum (PowerPoint / Slayt) Mizanpajına Dönüştür
  function applySlideLayout(componentNodes, titleData = {}) {
    const slides = [];

    // Slayt 1: Kapak
    slides.push({
      slideNumber: 1,
      type: 'title',
      title: titleData.title || "CanFenci Sunum Serisi",
      subtitle: titleData.sub || "Türkiye Yüzyılı Maarif Modeli Ders Sunumu",
      bg: "#1a1a2e"
    });

    // Slayt 2 ve sonrası: Bileşen grubu slaytları
    let currentSlideComponents = [];
    let slideIndex = 2;

    componentNodes.forEach((comp, idx) => {
      currentSlideComponents.push(comp);
      // Her 2-3 bileşende bir yeni slayda geç
      if (currentSlideComponents.length >= 2 || idx === componentNodes.length - 1) {
        slides.push({
          slideNumber: slideIndex++,
          type: 'content',
          components: [...currentSlideComponents],
          bg: "#0f0f1a"
        });
        currentSlideComponents = [];
      }
    });

    return slides;
  }

  return {
    applyLayout,
    applySlideLayout
  };
})();
