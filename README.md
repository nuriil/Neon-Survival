# 🔫 Web Survival Shooter 2.0

## 🔥 Neon Işıklar Altında Hayatta Kal!

Web Survival Shooter 2.0, neon ışıkların hakim olduğu distopik bir arenada geçen, hızlı tempolu, tepeden görünümlü (top-down) bir hayatta kalma nişancı oyunudur. Amacınız basit: Sürekli üzerinize gelen düşman dalgalarına karşı mümkün olduğunca uzun süre hayatta kalmak, puan toplamak ve cephaneliğinizi geliştirmek!

Bu proje, herhangi bir derleme aracına ihtiyaç duymayan, saf HTML, CSS ve JavaScript kullanılarak geliştirilmiş, tarayıcı tabanlı bir oyunun hem eğlenceli hem de teknik açıdan sağlam bir örneğidir.

---

## 🕹️ Nasıl Oynanır?

Oyun tamamen tarayıcınızda çalışır. Başlamak için `index.html` dosyasını tarayıcınızda açmanız veya GitHub Pages üzerinden canlı siteye `nuri.mfgultekin.com` erişmeniz yeterlidir.

| Kontrol | Açıklama |
| :--- | :--- |
| **W, A, S, D** | Karakteri hareket ettirir (Yukarı, Sol, Aşağı, Sağ) |
| **Fare** | Karakterin nişan almasını sağlar |
| **Sol Tık** | Ateş etme |
| **Sayı Tuşları (1, 2, 3...)** | Silahlar arasında geçiş yapar |
| **P** | Oyunu duraklatma (Pause) |

### Oyun Mekanikleri:

* **Düşman Dalgaları:** Hayatta kaldıkça düşmanlar daha hızlı, daha dayanıklı ve daha kalabalık gelir. Her dalga, yeni bir hayatta kalma mücadelesi demektir.
* **Toplanabilir Öğeler:** Düşmanları yok ettikçe harita üzerinde size can (health), mühimmat veya geçici hasar artışı gibi güçlendirmeler sağlayan öğeler (items) belirir. Hızlı hareket edip onları yakalamak kritik öneme sahiptir.
* **Silah Sistemi:** Oyunda farklı atış hızına, saçılma paternine ve hasar gücüne sahip çeşitli silahlar bulunur. Doğru anda doğru silahı seçmek en yüksek puanı almanızı sağlar.

---

## 💻 Proje Yapısı ve Geliştirme

Web Survival Shooter 2.0, tamamen istemci tarafında (client-side) çalışan, HTML5 Canvas API'si, CSS3 ve saf JavaScript kullanılarak geliştirilmiştir. Projenin ana yapısı, oyunun temel bileşenlerini ayrı ayrı yönetmek üzere modüler bir şekilde tasarlanmıştır.

### Ana Dosyalar

| Dosya/Dizin | Açıklama |
| :--- | :--- |
| `index.html` | Oyunun yüklendiği ana HTML dosyası. Tüm JavaScript ve CSS bağlantıları buradadır. |
| `style.css` | Oyun arayüzü ve Canvas kapsayıcısının görsel stilini içerir. |
| `game/` | Tüm oyun mantığını (logic) içeren JavaScript modüllerinin bulunduğu dizindir. |

### `game/` Klasörü İçeriği

Oyunun temel işlevleri bu klasördeki JS dosyalarına ayrılmıştır, bu da kodun okunabilirliğini ve bakımını kolaylaştırır:

* **`engine.js`**: Oyun döngüsü (game loop), FPS (kare hızı) yönetimi ve ana oyun akışının senkronizasyonu.
* **`player.js`**: Oyuncunun hareket, çarpışma ve can yönetimi mantığı.
* **`enemies.js`**: Farklı düşman türlerinin oluşturulması, hedef takibi ve yapay zeka (AI) davranışları.
* **`weapons.js`**: Atış mekaniği, mermi/mermi yolu hesaplamaları ve farklı silahların tanımlanması.
* **`map.js`**: Oyun alanının (arena) çizimi, sınırları ve harita öğelerinin yönetimi.

---

## 🚀 Yerel Kurulum (Geliştiriciler İçin)

Oyunu yerel makinenizde çalıştırmak ve geliştirmek isterseniz aşağıdaki basit adımları takip edebilirsiniz:

1.  **Depoyu Klonlayın:**
    ```bash
    git clone [GitHub Reponuzun Adresi]
    ```
2.  **Klasöre Girin:**
    ```bash
    cd web-survival-shooter-2.0
    ```
3.  **Çalıştırın:**
    Bu, statik bir projedir. Kök dizindeki `web survival shooter 2.0/index.html` (veya `index.html` dosyasını taşıdıysanız `index.html`) dosyasını modern bir web tarayıcısında (Chrome, Firefox vb.) çift tıklayarak doğrudan açabilirsiniz.

---

## 🤝 Katkıda Bulunma

Web Survival Shooter 2.0 açık kaynaklı bir projedir. Neon dünyayı genişletmek ve oyuna yeni özellikler eklemek isteyen tüm katkıları memnuniyetle karşılarız!

* Yeni silahlar veya düşman türleri ekleme.
* Performans iyileştirmeleri.
* Kullanıcı arayüzü (UI/UX) geliştirmeleri.

Katkıda bulunmak için lütfen bir "Pull Request" (PR) gönderin.

---

## 📄 Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır. Bu lisans, kodu kısıtlama olmaksızın kullanmanıza, değiştirmenize ve dağıtmanıza olanak tanır. Daha fazla bilgi için lütfen `LICENSE` dosyasına bakınız.

---

## 👨‍💻 Yapımcı (Developer)

| Rol | Adı |
| :--- | :--- |
| **Proje Sahibi** | Nuri İL / [nuriil](https://github.com/nuriil) |
| **Geliştirici** | Mehmet Fatih GÜLTEKİN / [Lifantel](https://github.com/Lifantel) |
| **Geliştirici** | Fikri Efe AKAR / [Ponggo01](https://github.com/Ponggo01) |

Bu proje, web tabanlı basit oyunların ne kadar eğlenceli ve güçlü olabileceğini göstermek amacıyla kişisel bir çabayla geliştirilmiştir. İyi eğlenceler!
