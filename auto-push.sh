#!/bin/bash
# ============================================================
# CanFenci Auto-Deploy Script
# Dosya değişikliklerini otomatik olarak GitHub'a gönderir
# Kullanım: bash auto-push.sh
# ============================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH="main"
INTERVAL=30  # saniyede bir kontrol et

echo ""
echo "🚀 CanFenci Auto-Deploy başlatıldı"
echo "📁 Klasör: $PROJECT_DIR"
echo "🔄 Her ${INTERVAL} saniyede değişiklik kontrol edilecek"
echo "❌ Durdurmak için: Ctrl+C"
echo "============================================"
echo ""

cd "$PROJECT_DIR"

while true; do
  # Değişiklik var mı kontrol et
  CHANGES=$(git status --porcelain)

  if [ -n "$CHANGES" ]; then
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$TIMESTAMP] 📦 Değişiklik algılandı, GitHub'a gönderiliyor..."

    # Dosyaları ekle
    git add -A

    # Commit mesajı: hangi dosyalar değişti
    CHANGED_FILES=$(git diff --cached --name-only | head -5 | tr '\n' ', ' | sed 's/,$//')
    COMMIT_MSG="🔄 Otomatik güncelleme – $TIMESTAMP | $CHANGED_FILES"

    git commit -m "$COMMIT_MSG"

    # Push
    if git push origin $BRANCH; then
      echo "[$TIMESTAMP] ✅ GitHub'a gönderildi → https://canfenci.github.io/fenai/"
    else
      echo "[$TIMESTAMP] ❌ Push başarısız! İnternet bağlantısını kontrol edin."
    fi

    echo ""
  fi

  sleep $INTERVAL
done
