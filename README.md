# 3D Three.js Spiral Gallery

Three.js, GLSL, Lenis ve GSAP ile hazırlanmış sinematik 3D spiral görsel galeri.

## Bu Repo Ne İçin Var?
WebGL, shader ve modern animasyon araçlarıyla etkileyici bir görsel deneyim tasarlama pratiği yapmak için oluşturuldu.

Bu README'nin amacı; repoya ilk kez gelen birinin projenin neden açıldığını, içinde ne bulunduğunu ve nereden başlaması gerektiğini hızlıca anlamasını sağlamaktır.

## İçerik ve Kapsam
Bu repoda öne çıkan içerikler şunlardır:
- WebGL tabanlı 3D sahne
- Akıcı scroll ve animasyon deneyimi
- Modern frontend araç zinciri
- Node.js tabanlı kurulum ve geliştirme komutları
- Python bağımlılıklarını tanımlayan requirements dosyası
- Tarayıcıda incelenebilen HTML arayüz dosyaları
- Hazır npm scriptleriyle geliştirme, build veya test akışı

## Kimler İçin Faydalı?
Tam yığın uygulama mimarisini, modül ayrımını veya servis-UI ilişkisini incelemek isteyenler için uygundur.

## Kullanılan Teknolojiler
- CSS
- Node.js
- npm
- React
- Vite
- Python
- HTML

## Kurulum
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm install
```

## Çalıştırma
```bash
index.html dosyasını tarayıcıda açın.
```

## Önemli Dosyalar
- `dist/index.html`
- `index.html`
- `node_modules/.vite/deps/package.json`
- `node_modules/@oxc-project/types/package.json`
- `node_modules/@rolldown/binding-linux-x64-gnu/package.json`
- `node_modules/@rolldown/pluginutils/package.json`
- `node_modules/detect-libc/package.json`
- `node_modules/fdir/package.json`
- `node_modules/gsap/package.json`
- `node_modules/lenis/package.json`
- `node_modules/lightningcss-linux-x64-gnu/package.json`
- `node_modules/lightningcss/package.json`

## Proje Yapısı
- `node_modules` - 1512 dosya
- `dist` - 47 dosya
- `public` - 30 dosya
- `src` - 8 dosya
- `api` - 5 dosya
- `.env.example` - 1 dosya
- `.python-version` - 1 dosya
- `index.html` - 1 dosya

## Geliştirme Notları
- README içeriği, repodaki mevcut dosya yapısı ve proje açıklamasına göre düzenlenmiştir.
- Yeni modül, veri seti veya servis eklendiğinde kurulum/çalıştırma bölümlerini güncelleyin.
- Frontend projelerinde sürüm uyumu için `package-lock.json`/`pnpm-lock.yaml` gibi lock dosyalarını koruyun.

## Lisans
Bu repoda açık bir lisans dosyası yoksa tüm haklar varsayılan olarak proje sahibine aittir. Paylaşım veya kullanım koşulları için repo sahibine danışın.
