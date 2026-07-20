"""
knowledge.py — Curated knowledge chunks for the RAG system.
Source of truth: cv.md (verified 2026-05-13).
Each chunk has: id, section (display label), text (for embedding + retrieval).
"""

CHUNKS: list[dict] = [
    {
        "id": "identity",
        "section": "Kimlik / Identity",
        "text": (
            "Ad: Muhammed Can Özyaşar. "
            "Ünvan: YZ/ML Araştırmacısı, TÜBİTAK Proje Yürütücüsü, ML Odaklı Backend Geliştirici. "
            "E-posta: can.ozyasarr@gmail.com. "
            "Web sitesi: canozyasar.dev. GitHub: github.com/can-ozyasar. "
            "LinkedIn: linkedin.com/in/muhammed-can-ozyasar. "
            "Konum: Sakarya / İzmir / İstanbul, Türkiye."
        ),
    },
    {
        "id": "summary",
        "section": "Profesyonel Özet / Summary",
        "text": (
            "Sakarya Üniversitesi Bilgisayar Mühendisliği 3. sınıf öğrencisi (GNO: 3,27/4,00). "
            "TÜBİTAK 2209-A kapsamında federe öğrenme tabanlı tıbbi görüntü sınıflandırma projesini yürütüyor. "
            "TÜBİTAK 2247-C STAR programında lityum-iyon batarya SoH/SoC tahmini için makine öğrenmesi modelleri geliştiriyor (Şubat 2026–). "
            "PyTorch, scikit-learn ve LLM entegrasyonuyla üretim kalitesinde YZ sistemleri inşa etti. "
            "RAG mimarisi ve federe öğrenme pipeline'larında uygulamalı deneyim. "
            "Obsidian tabanlı araştırma sistemiyle güncel YZ/ML makalelerini takip ediyor, bulgularını GitHub'da paylaşıyor. "
            "Claude Code gibi YZ ajan sistemlerini open-source araçlarla (Obsidian, Fabric) güçlendiriyor. "
            "Uygulamalı YZ/ML mühendisliği alanında teknik pozisyon hedefliyor."
        ),
    },
    {
        "id": "exp_star",
        "section": "Deneyim: TÜBİTAK 2247-C STAR",
        "text": (
            "TÜBİTAK 2247-C STAR Programı — Öğrenci Araştırmacı (Şubat 2026 – devam ediyor). "
            "SoH/SoC Tahmin Modelleri: Lityum-iyon batarya sağlık durumu (SoH) ve şarj durumu (SoC) tahmini için "
            "Random Forest ve LSTM regresyon modelleri geliştirildi. Büyük ölçekli zaman serisi verisi üzerinde "
            "kayan pencere (sliding window) özellik çıkarımı ve Bayesian hiperparametre optimizasyonu uygulandı. "
            "Radar Sinyal İşleme Araştırması: BSM kapsamında YZ tabanlı radar sinyal işleme modülüne katkı. "
            "Akademik Çıktı: Teknik ilerleme raporları ve literatür sentezi; konferans yayını hedefleniyor."
        ),
    },
    {
        "id": "exp_2209a",
        "section": "Deneyim: TÜBİTAK 2209-A",
        "text": (
            "TÜBİTAK 2209-A Üniversite Öğrencileri Araştırma Projeleri — Proje Yürütücüsü (2025 – devam ediyor). "
            "Federe Öğrenme Sistemi: Hasta verilerini merkezi sunucuya göndermeden HAM10000 veri kümesiyle "
            "ResNet-18 tabanlı cilt lezyon sınıflandırıcı eğitmek için FedAvg algoritması uygulandı. "
            "Gizlilik Tasarımı: KVKK/GDPR uyumlu mimari; yalnızca model ağırlıkları transfer edildi. "
            "Mevcut Metrikler: 3-sınıf sınıflandırmada %84 doğruluk (non-federe baseline: %81). "
            "Teknolojiler: Python, PyTorch, ResNet-18, FedAvg, HAM10000."
        ),
    },
    {
        "id": "exp_turkcell",
        "section": "Deneyim: Turkcell Global Bilgi",
        "text": (
            "Turkcell Global Bilgi — Bilgi Teknolojileri Stajyeri (Yaz 2025). "
            "Otomasyon & Analitik: UiPath ile tekrarlayan iş akışları otomasyona alındı; "
            "Power BI panoları oluşturularak manuel raporlama süreçleri ortadan kaldırıldı. "
            "Sistem Yönetimi: Active Directory ve VMware Horizon üzerinden 500+ kullanıcı hesabı yönetildi. "
            "L1/L2 BT destek süreçleri kök neden analizi yöntemiyle işlendi."
        ),
    },
    {
        "id": "proj_fedlearn",
        "section": "Proje: TÜBİTAK 2209-A Federe Öğrenme",
        "text": (
            "Proje: TÜBİTAK 2209-A Federe Öğrenme — Cilt Lezyon Sınıflandırma. "
            "Durum: Aktif, TÜBİTAK destekli araştırma. Rol: Proje Yürütücüsü. "
            "Açıklama: Federated Learning sistemi, HAM10000 cilt lezyon veri seti üzerinde "
            "hasta verilerini merkezi sunucuya göndermeden ResNet-18 eğitiyor. "
            "FedAvg toplama algoritması, kayan pencere özellik çıkarımı, Bayesian hiperparametre optimizasyonu. "
            "Mevcut doğruluk: %84 (baseline %81). KVKK/GDPR uyumlu. "
            "Teknolojiler: Python, PyTorch, ResNet-18, FedAvg, HAM10000. "
            "GitHub: github.com/can-ozyasar/federe_proje"
        ),
    },
    {
        "id": "proj_industrial",
        "section": "Proje: Endüstriyel İstihbarat Sistemi",
        "text": (
            "Proje: Endüstriyel İstihbarat Sistemi — RSS + LLaMA3 + Graf. "
            "Durum: Tamamlandı, sektörel YZ ürünü. "
            "Problem: Fabrika taşıma hizmetleri veren şirketin iş fırsatlarını manuel takip etmesi verimsizdi. "
            "Çözüm: Kamuya açık kaynaklardan hangi fabrikanın taşınacağını, kapandığını veya genişlediğini "
            "otomatik tespit eden RSS + LLM pipeline. "
            "Pipeline: RSS → anahtar kelime filtresi (fabrika, taşınma, kapasite) → LLaMA3 yapılandırılmış çıktı → Obsidian graf. "
            "Her tespite taşınma olasılığı skoru atanıyor. "
            "Teknolojiler: Python, LLaMA3 (Ollama), RSS Parser, Obsidian Graf."
        ),
    },
    {
        "id": "proj_rag",
        "section": "Proje: RAG Portföy Asistanı",
        "text": (
            "Proje: YZ Destekli Portföy — RAG Tabanlı Akıllı Asistan. "
            "Durum: Canlı üretimde, canozyasar.dev adresinde erişilebilir. "
            "RAG Pipeline: CV ve belge içeriği üzerinde anlamsal arama için Qdrant vektör veritabanı kullanan "
            "üretim kalitesinde Retrieval-Augmented Generation sistemi. "
            "LLM Entegrasyonu: Google Gemini API ile sistem-komut mühendisliği ve çok turlu bağlam yönetimi. "
            "Halüsinasyon oranı saf LLM yaklaşımına kıyasla anlamlı düzeyde azaltıldı. "
            "Mimari: .NET 8 Web API + Next.js. "
            "Teknolojiler: Python, .NET Core 8, Next.js, Google Gemini API, Qdrant, RAG, Tailwind CSS."
        ),
    },
    {
        "id": "proj_teklifakis",
        "section": "Proje: TeklifAkış",
        "text": (
            "Proje: TeklifAkış — KOBİ Teklif Yönetim Sistemi. "
            "Durum: TÜBİTAK 1812 mentörlük programı kapsamında aktif geliştirme. "
            "Problem: KOBİ'lerin ihale ve teklif süreçleri; manuel takip eksikliği nedeniyle hata ve gecikmeye açık. "
            "OCR + LLM Entegrasyonu: Teklif PDF'leri ve taranan belgeler OCR katmanından geçirilmekte; "
            "ham metin LLM'e aktarılarak kritik alanlar yapılandırılmış formatta çıkarılmaktadır. "
            "Manuel veri girişi süreci ortadan kaldırılmaktadır. "
            "Durum: Müşteri keşfi tamamlandı, MVP iterasyonu sürmektedir. "
            "Teknolojiler: Python, OCR (Tesseract/Azure OCR), LLM (Yapılandırılmış Çıktı), REST API."
        ),
    },
    {
        "id": "proj_vocab",
        "section": "Proje: Vocabulary Cards",
        "text": (
            "Proje: Vocabulary Cards — Aralıklı Tekrar Platformu. "
            "Durum: Tamamlandı. Backend + ML-Ready Altyapı. "
            "Algoritma Tasarımı: SM-2 Aralıklı Tekrar algoritması ve Ebbinghaus Unutma Eğrisi parametreleri "
            "kullanılarak kullanıcı başına dinamik zorluk tahmini yapan .NET 8 Web API. "
            "ML Veri Altyapısı: Kullanıcı etkileşim dizilerini (yanıt süresi, doğruluk skoru, tekrar aralığı) "
            "yapılandırılmış formatta kaydeden olay günlüğü alt sistemi. "
            "Teknolojiler: .NET 8 Web API, Entity Framework Core, React (Vite), TypeScript, Tailwind CSS. "
            "GitHub: github.com/can-ozyasar/ingilizce-Kelime-kartlari-Web-Uygulamasi"
        ),
    },
    {
        "id": "proj_hayalperest",
        "section": "Proje: Hayalperest Hikayeler",
        "text": (
            "Proje: Hayalperest Hikayeler — Üretken YZ Platformu. "
            "Durum: Tamamlandı. BTK Hackathon projesi. "
            "Açıklama: Hackathon kısıtlamaları içinde çocuk dostu içerik filtreleme ve prompt optimizasyonuyla "
            "Google Gemini API entegrasyonunu içeren üretken YZ web uygulaması. "
            "Teknolojiler: Node.js, Google Gemini API, REST API. "
            "GitHub: github.com/can-ozyasar/BTK_Hackathon"
        ),
    },
    {
        "id": "proj_bsm",
        "section": "Proje: BSM Batarya Yönetim Sistemi",
        "text": (
            "Proje: BSM Batarya Yönetim Sistemi — Lityum-iyon SoH/SoC Tahmin. "
            "Durum: Aktif araştırma (TÜBİTAK 2247-C STAR kapsamında). "
            "Açıklama: Lityum-iyon batarya sağlık durumu (SoH) ve şarj durumu (SoC) tahmini için "
            "Random Forest ve LSTM regresyon modelleri. "
            "Kayan pencere özellik çıkarımı, Bayesian hiperparametre optimizasyonu uygulandı. "
            "YZ tabanlı radar sinyal işleme modülüne de katkı sağlandı. "
            "Teknolojiler: Python, scikit-learn, PyTorch, LSTM, Random Forest."
        ),
    },
    {
        "id": "proj_sporsalonu",
        "section": "Proje: Spor Salonu Yönetim Sistemi",
        "text": (
            "Proje: Spor Salonu Yönetim ve Randevu Sistemi. "
            "Durum: Tamamlandı. Web Programlama Projesi. "
            "Açıklama: Spor merkezlerinin üye takibi, abonelik ve randevu süreçlerini dijitalleştiren "
            "kapsamlı backend projesi. "
            "Backend: ASP.NET Core MVC, N-Tier Architecture (Katmanlı Mimari). "
            "Veritabanı: PostgreSQL ve Entity Framework Core (Code-First). "
            "Özellikler: Rol yönetimi (Identity), dinamik randevu, raporlama arayüzleri. "
            "Teknolojiler: ASP.NET Core, PostgreSQL, N-Tier Architecture, Entity Framework. "
            "GitHub: github.com/can-ozyasar/SporSalonu"
        ),
    },
    {
        "id": "skills",
        "section": "Teknik Beceriler",
        "text": (
            "YZ/ML Çerçeveleri: PyTorch, scikit-learn, TensorFlow (temel), Hugging Face Transformers. "
            "ML Teknikleri: Derin Öğrenme (CNN/ResNet-18, LSTM), Federe Öğrenme (FedAvg), Random Forest, "
            "Zaman Serisi Analizi, Hiperparametre Optimizasyonu, Transfer Learning. "
            "LLM/GenAI: RAG (Retrieval-Augmented Generation), Prompt Mühendisliği, Embedding Tabanlı Arama, "
            "Google Gemini API, OpenAI API. "
            "Vektör Veritabanı: Qdrant. "
            "Veri ve Analiz: NumPy, Pandas, Matplotlib, Kayan Pencere Özellik Çıkarımı. "
            "Programlama Dilleri: Python (birincil), C#, Java, TypeScript, SQL. "
            "ML Altyapısı: Git, GitHub, Docker (temel), Jupyter Notebook, Postman. "
            "Backend: ASP.NET Core (.NET 8), Spring Boot, REST API, Node.js, FastAPI. "
            "Yabancı Dil: İngilizce B1."
        ),
    },
    {
        "id": "education",
        "section": "Eğitim ve Sertifikalar",
        "text": (
            "Sakarya Üniversitesi — Bilgisayar Mühendisliği Lisans (Eylül 2023 – devam ediyor). "
            "GNO: 3,27/4,00. 1 Yüksek Onur Belgesi, 4 Onur Belgesi. "
            "Devam Eden Programlar: YÖK Yapay Zeka Akademisi (İTÜ, ODTÜ, Boğaziçi, YÖK); "
            "Milli Teknoloji Akademisi — YZ Uzmanlık Programı; "
            "HepsiBurada × SistersLab — Girişimcilik ve Mühendislik Programı. "
            "Sertifikalar: Python ile Makine Öğrenmesi (Prof. Dr. Şadi Evren Şeker); "
            "Veri Bilimi ve ML Python A-Z (Vahit Keskin/Miuul); "
            "Java ve Spring Boot Backend (Enes Bayram); "
            "Prompt Mühendisliği ve YZ Araçları."
        ),
    },
    {
        "id": "activities",
        "section": "Ekstra Faaliyetler ve Liderlik",
        "text": (
            "SAÜ Synapse — Teknofest Sağlık Kategorisi, Takım Kaptanı (2026–). "
            "İlk değerlendirme aşamasını geçmiş çok disiplinli teknik takıma liderlik. "
            "SATSO Teknokent Füzyon Kuluçka — GFAST Programı, Girişimci/StarTex Finalisti (2025-2026). "
            "3 aylık girişimcilik programını tamamladı; EnerjİZeka projesiyle son 10 takım arasına girdi. "
            "TÜBİTAK 1812 Programı — Girişimci Katılımcı (2026–). "
            "TeklifAkış: KOBİ süreç yönetimi odaklı yazılım ürünü geliştirme. "
            "TOG Vakfı (Sakarya) — Proje Koordinatörü (2025–). "
            "'Benimle, Cumhuriyetle' projesi: paydaş iletişimi ve proje yönetimi. "
            "Sürekli Öğrenme: Obsidian graf yapısıyla güncel YZ/ML makaleleri (arXiv, Papers With Code) "
            "düzenli olarak incelenmekte; öğrenimlerin pratik uygulama senaryoları GitHub'da yayımlanmaktadır. "
            "Obsidian Vault: github.com/can-ozyasar/MY_Paper_Library"
        ),
    },
    {
        "id": "references",
        "section": "Referanslar",
        "text": (
            "Referanslar (talep üzerine): "
            "Volkan Salgar — BT Bölge Müdürü, Turkcell Global Bilgi. "
            "Sancar Suten — BT Servis Masası Takım Lideri, Turkcell Global Bilgi. "
            "Mert Karakoç — CEO/Kurucu, MTK Uzay ve Savunma A.Ş."
        ),
    },
]
