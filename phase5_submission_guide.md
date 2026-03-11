# 🚀 NARROW - FAZ 5: BUILD & APP STORE SUBMISSION

Her şey hazır! Oyunun testleri bitti, asset'leri tamam. Artık Apple'a (veya Play Store'a) gönderme vakti geldi.
Bu işlemleri senin kendi Expo hesabınla ve Apple Developer hesabınla yapman gerekiyor. Tüm adımlar sırasıyla aşağıdadır.

---

## 🟢 ADIM 1: EAS'a Giriş Yap (Eğer yapmadıysan)

Terminali (Komut İstemi veya PowerShell) projenin olduğu klasörde aç ve şu komutu çalıştır:

```bash
npx eas login
```
*Bu komut senden Expo (expo.dev) e-posta ve şifreni isteyecek. Başarıyla giriş yaptıktan sonra devam et.*

---

## 🟢 ADIM 2: iOS İçin Production Build Al

Aşağıdaki komut, uygulamanın App Store için son versiyonunu (Production Build) bulut üzerinde oluşturacak.

```bash
npx eas build --platform ios --profile production
```

* **Apple Developer Hesabı İsteyecek:** Komutu çalıştırdığında EAS sana Apple ID'ni (e-posta) ve şifreni (veya App-Specific Password) sorabilir.
* **Sertifikalar:** Dağıtım sertifikalarını (Distribution Certificate) ve Provisioning Profile'ı otomatik oluşturması için gelen sorulara "Y" (Evet) diyerek onayla.
* **Bekleme Süresi:** Bulutta build işlemi yaklaşık 15-30 dakika sürebilir. Terminal sana bir link verecek, o linkten süreci takip edebilirsin.

*(Not: Eğer Android versiyonunu da Play Store'a atacaksan: `npx eas build --platform android --profile production` komutunu ayrıca çalıştıracaksın).*

---

## 🟢 ADIM 3: App Store Connect'e Gönder (Submit)

Build işlemi "Finished" (Tamamlandı) yazdıktan sonra, elde ettiğin bu `.ipa` dosyasını Apple'ın paneline (TestFlight/App Store Connect) göndermen gerekiyor.

```bash
npx eas submit --platform ios
```

* Sistem sana "Hangi build'i göndermek istiyorsun?" diye sorar. Listedeki en son (Latest) başarılı build'i seç.
* Gönderim tamamlandıktan sonra Apple'ın bu dosyayı işlemesi (Processing) yaklaşık 15-20 dakika sürer.

---

## 🟢 ADIM 4: App Store Connect Panelinde Son Ayarlar

1. [App Store Connect](https://appstoreconnect.apple.com/)'e giriş yap.
2. "My Apps" (Uygulamalarım) bölümünden **Narrow**'u seç.
3. TestFlight sekmesine git. İşleme bitince yüklediğin Build orada görünecek.
4. "Export Compliance" (Dışa Aktarma Uyumluluğu) uyarısı verirse: **"Hayır, ekstra bir şifreleme kullanmıyorum"** seçeneğini işaretle (Çünkü `app.json` içinde belirttik ama paneller bazen yine de sorar).
5. App Store sekmesine geç (Hazırlıyoruz statüsündeki versiyon).
    * `appstore_metadata.md` dosyasındaki TR/EN açıklamaları, promosyon metnini ve virgüllü keyword'leri gir.
    * Support URL ve Privacy Policy (FAZ 1'de oluşturulan GitHub linki) linklerini ilgili kutulara yapıştır.
    * Kaydettiğin **5 Adet 6.7" ve 6.1" Ekran Görüntüsünü (Screenshots)** yükle.
    * Rating (Yaş Derecelendirmesi) anketini doldur (4+ çıkacak şekilde şiddet/kumar vs. yok seç).
    * Fiyatlandırmayı (Free/Ücretsiz) seç.
6. Alt kısımdan, demin yüklediğin (İşlemesi biten) **Build'i (Derlemeyi) Seç**.

---

## 🟢 ADIM 5: İNCELEMEYE GÖNDER (Submit for Review)

Her şeyi doldurduktan sonra sağ üstteki **Add for Review (İncelemeye Ekle)** veya **Submit for Review (İncelemeye Gönder)** butonuna tıkla.

> 🎉 **Tebrikler!** Artık top Apple'ın inceleme ekibinde. Genellikle 24 ile 48 saat arasında (bazen çok daha kısa sürede) uygulamanı inceleyip "Ready for Sale" (Satışa Hazır / Yayında) veya red gelirse "Rejected" statüsüne çekecekler. Red gelirse sebebini açıkça yazarlar, o sorunu çözüp yeni build atarız aslanlar gibi!
