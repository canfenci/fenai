// ============================================================
// LOCALDB.JS – Veritabanı Katmanı (IndexedDB Soru Bankası & Kaynaklar)
// ============================================================

window.FenAI = window.FenAI || {};

window.FenAI.LocalDb = (() => {
  const DB_NAME = 'fenai_db';
  const STORE_NAME = 'icerikler';
  let dbInstance = null;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (dbInstance && dbInstance.name === DB_NAME) {
        resolve(dbInstance);
        return;
      }
      const request = indexedDB.open(DB_NAME, 2);
      request.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('tur', 'tur', { unique: false });
          store.createIndex('sinif', 'sinif', { unique: false });
          store.createIndex('tarih', 'tarih', { unique: false });
          store.createIndex('favori', 'favori', { unique: false });
        }
        if (!db.objectStoreNames.contains('kaynaklar')) {
          db.createObjectStore('kaynaklar', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = function(event) {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };
      request.onerror = function(event) {
        reject(event.target.error);
      };
    });
  }

  return {
    async saveContent(veri) {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(veri);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },

    async listContents(filtre = {}) {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
          let sonuclar = request.result;
          if (filtre.tur) sonuclar = sonuclar.filter(item => item.tur === filtre.tur);
          if (filtre.sinif) sonuclar = sonuclar.filter(item => item.sinif === filtre.sinif);
          if (filtre.ara) {
            const ara = filtre.ara.toLowerCase();
            sonuclar = sonuclar.filter(item => 
              item.baslik.toLowerCase().includes(ara) || 
              item.icerik.toLowerCase().includes(ara)
            );
          }
          if (filtre.favori === true) sonuclar = sonuclar.filter(item => item.favori === true);
          resolve(sonuclar);
        };
        request.onerror = () => reject(request.error);
      });
    },

    async deleteContent(id) {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    async toggleFavorite(id) {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          const veri = getRequest.result;
          if (!veri) { reject('Veri bulunamadı'); return; }
          veri.favori = !veri.favori;
          const putRequest = store.put(veri);
          putRequest.onsuccess = () => resolve(veri);
          putRequest.onerror = () => reject(putRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    },

    async clearAllContents() {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    async saveResource(kaynak) {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('kaynaklar', 'readwrite');
        const store = transaction.objectStore('kaynaklar');
        const request = store.add(kaynak);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },

    async listResources() {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('kaynaklar', 'readonly');
        const store = transaction.objectStore('kaynaklar');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    },

    async deleteResource(id) {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('kaynaklar', 'readwrite');
        const store = transaction.objectStore('kaynaklar');
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },

    async getResource(id) {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('kaynaklar', 'readonly');
        const store = transaction.objectStore('kaynaklar');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },

    async clearAllResources() {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('kaynaklar', 'readwrite');
        const store = transaction.objectStore('kaynaklar');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  };
})();
