# 🧪 NARROW - FAZ 4: TEST & QA (Kalite Kontrol)

App Store'dan RED almamak için Apple'ın test uzmanlarının (review team) yapacağı tüm denemeleri önceden yapmamız gerekiyor. Bu liste senin manuel test rehberindir. Lütfen telefonunda (Expo Go veya TestFlight üzerinden oynarken) bu senaryoları tek tek dene.

> **Nasıl Test Edeceksin?**
> Terminalde `npx expo start` yaz ve telefonundaki kamerayla QR kodu okutarak Expo Go üzerinden projeyi aç. Ardından aşağıdaki adımları test et. Tüm testleri (✔) yaparken en az 3-5 ekran görüntüsü (screenshot) almayı da unutma! (Bu görüntüler App Store için kullanılacak).

---

## 🛑 1. FONKSİYONEL TEMEL TESTLER (En Kritik Bölüm)
- [ ] Parmağı ekrandan tamamen kaldırınca anında "GAME OVER" oluyor mu? (1 can varken)
- [ ] 2 can varken parmağı kaldırınca 1 can gidiyor ama oyun kaldığı yerden hata vermeden devam ediyor mu?
- [ ] Düşen "Kalp" ikonunu toplayınca can (lives) başarıyla 2'ye çıkıyor mu?
- [ ] Shield (Kalkan - Yeşil) alındığında, bir sonraki engelle çarpışmayı engelliyor mu? Kalkan animasyonu ve hasar almama çalışıyor mu?
- [ ] Slow (Yavaşlama - Mavi) alındığında arka plandaki düşüş hızı anlık olarak yavaşlıyor ve süresi dolunca eski haline dönüyor mu?
- [ ] Widen (Sarı) power-up alındığında geçiş yolu (dar geçit) genişliyor mu?
- [ ] 3 ve üzeri başarılı geçiş yapıldığında arka planda "x1.5, x2.0" gibi Combo çarpanları görünüyor mu?
- [ ] Pembe (Zigzag) engeller ekrana geldiğinde sorunsuz bir şekilde sağa sola sallanıyor mu?
- [ ] Kırmızı (Closing) engeller geldiğinde geçit zamanla daha da daralıyor mu?
- [ ] Skorunuz 40+ puana geldiğinde ekran kararıyor ve "Lantern Mode" (Fener Modu) aktif oluyor mu? Görüş açısı sadece parmağın etrafında kalıyor mu?
- [ ] Hız artışları (Speed Burst) skor 15 barajını geçtikten sonra rastgele ve sarsıntılı şekilde geliyor mu?
- [ ] Ana ekrana veya Game Over ekranına dönüldüğünde en yüksek skorunuz (High Score) cihaz hafızasından okunup doğru görünüyor mu?
- [ ] "RETRY" (Tekrar) butonuna basınca sorunsuz yeni bir oyun başlatıyor mu?
- [ ] "MENU" butonuna basınca Ana Menü'ye eksiksiz dönüyor mu? Can vs. sıfırlanıyor mu?

## 💥 2. STABİLİTE VE ÇÖKME (CRASH) TESTLERİ
Apple'ın en çok nefret ettiği şey cihazın "crash" (donma/hata) vermesidir. Uygulama çökerse anında red alır.
- [ ] Oyun esnasında telefonu "Arka Plana" atıp (Home'a dönüp) tekrar oyuna geçince oyun çöküyor mu? (FrameCallback hataları)
- [ ] Arkan plana atılınca Gesture (parmak takibi) state'i kaybolup oyunu tamamen bozuyor mu?
- [ ] Telefonu yatay çevirince bozuluyor mu? (Portrait - Dikey modda kilitli kalmalı)
- [ ] Uzun süre (örn: 5-10 dakika) oynanınca uygulamada kasmalar (Memory Leak fps düşüşü) yaşanıyor mu?

## 📱 3. EKRAN VE UI(ARAYÜZ) KALİTESİ TESTLERİ
- [ ] iPhone'ların dinamik adası (Dynamic Island) veya eski telefonların Notch'u (Çentik kısmı) önemli butonları veya yazıları gizliyor mu? (Tepe boşluğu yani İnsets ayarları doğru mu)
- [ ] Parmağını hareket ettirirken iz bırakan "Neon Trail" akıcı mı, donuyor mu?
- [ ] Çarpışma anında ekran sarsıntısı efekti mantıklı çalışıyor mu? Titreşim (Haptics) veriyor mu?
- [ ] Koyu temadaki siyahlar yeterince tok duruyor mu? Gözü yoracak beyaz patlamalar var mı? (Özellikle Notification/Status Bar ikonları beyaz renk mi?)

---

### Test Sırasında "App Store Ekran Görüntüleri" İçin Fırsatlar:
Telefonunda test ederken screenshot kısayolunu kullanıp şunları yakalamayı unutma:
📸 Ana Menü
📸 Dar bir boşluktan geçme (Kritik an)
📸 "Lantern Mode"da karanlık ortamda parlak geçiş
📸 x2.5 ya da üstü heyecanlı bir Combo Anı
📸 Kalkan (Shield) Aktifken Mavi/Neon geçiş

> **Tüm Adımlardan Geçeceğimize %100 Emin Olduğunda FAZ 5 (Build ve Submission) İçin Hazırız!**
