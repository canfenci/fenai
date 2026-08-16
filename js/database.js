// ============================================================
// DATABASE.JS – Geriye Dönük Uyumluluk Köprüsü
// ============================================================

async function db_bankasiKaydet(veri) {
  return await window.FenAI.LocalDb.saveContent(veri);
}

async function db_bankasiListele(filtre = {}) {
  return await window.FenAI.LocalDb.listContents(filtre);
}

async function db_bankasiSil(id) {
  return await window.FenAI.LocalDb.deleteContent(id);
}

async function db_bankasiFavoriToggle(id) {
  return await window.FenAI.LocalDb.toggleFavorite(id);
}

async function db_bankasiTemizle() {
  return await window.FenAI.LocalDb.clearAllContents();
}

async function db_kaynakKaydet(kaynak) {
  return await window.FenAI.LocalDb.saveResource(kaynak);
}

async function db_kaynakListele() {
  return await window.FenAI.LocalDb.listResources();
}

async function db_kaynakSil(id) {
  return await window.FenAI.LocalDb.deleteResource(id);
}

async function db_kaynakGetir(id) {
  return await window.FenAI.LocalDb.getResource(id);
}

async function db_kaynaklariTemizle() {
  return await window.FenAI.LocalDb.clearAllResources();
}