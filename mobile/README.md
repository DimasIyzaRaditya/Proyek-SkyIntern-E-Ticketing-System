# SkyIntern Mobile App

Panduan ini menjelaskan cara setup, build, install, dan menjalankan APK mobile SkyIntern dari nol sampai bisa dipakai di HP fisik.

## 1. Gambaran Singkat

Aplikasi mobile SkyIntern terhubung ke backend Node/Express dan mendukung fitur utama berikut:

- Login/register user
- Verifikasi login 2FA (jika diaktifkan)
- Pencarian dan booking penerbangan
- Pembayaran dan e-ticket
- Fitur admin (role admin)
- Real-time update via WebSocket

## 2. Prasyarat

Pastikan tools berikut sudah terpasang:

- Flutter SDK (disarankan versi stabil terbaru)
- Android Studio + Android SDK
- ADB (Android Platform Tools)
- Node.js dan npm

Verifikasi cepat:

```bash
flutter doctor
adb version
node -v
npm -v
```

## 3. Struktur Project (Yang Dipakai Saat Running)

- Backend API: ../backend
- Mobile Flutter: . (folder mobile)

## 4. Menjalankan Backend (Wajib)

Aplikasi mobile membutuhkan backend aktif di port 3000.

```bash
cd ../backend
npm install
npm run dev
```

Backend akan berjalan di:

- http://localhost:3000

## 5. Menentukan IP Laptop Untuk HP Fisik

Jika aplikasi dijalankan di HP fisik, gunakan IP Wi-Fi laptop (bukan localhost).

PowerShell (Windows):

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -eq 'Wi-Fi' } | Select-Object IPAddress
```

Contoh hasil: 192.168.1.7

## 6. Setup Dependencies Mobile

Di folder mobile:

```bash
flutter clean
flutter pub get
```

## 7. Menjalankan Dari Flutter (Development)

### 7.1 Android Emulator

```bash
flutter run
```

### 7.2 HP Fisik (USB atau Wireless Debugging)

Edit host API di source code mobile:

- File: lib/services/api_client.dart
- Ubah nilai `_hardcodedApiHost` sesuai IP laptop Wi-Fi Anda

Contoh:

```dart
static const String _hardcodedApiHost = '192.168.1.7';
```

Lalu jalankan:

```bash
flutter run
```
NOTE:
Jika ganti Wi-Fi/jaringan, cukup update `_hardcodedApiHost` lalu jalankan ulang `flutter run`.

## 8. Build APK Release Untuk HP Fisik

Di folder mobile:

Pastikan `_hardcodedApiHost` di `lib/services/api_client.dart` sudah sesuai IP laptop.

```bash
flutter build apk --release
```
NOTE :
Untuk APK release, jika IP backend berubah maka perlu build ulang APK.

Output APK:

- build/app/outputs/flutter-apk/app-release.apk

## 9. Install APK ke HP Dengan USB Debugging

### 9.1 Aktifkan Developer Options di HP

- Buka About phone
- Tap Build number 7x
- Aktifkan USB debugging

### 9.2 Cek Device Terdeteksi

```bash
adb kill-server
adb start-server
adb devices
```

Status yang benar: device

### 9.3 Install APK

```bash
adb install -r build/app/outputs/flutter-apk/app-release.apk
```

## 10. Install APK Tanpa Kabel (Distribusi ke HP Lain)

Tidak wajib USB debugging untuk pengguna akhir.

Langkah:

- Kirim file app-release.apk ke HP lain (Drive/WhatsApp/Telegram)
- Install APK secara manual
- Pastikan HP target dan laptop backend berada di Wi-Fi yang sama

Catatan penting:

- Jika IP laptop berubah, APK perlu dibuild ulang dengan host baru.
- Karena host sekarang disimpan di source code (`_hardcodedApiHost`).

## 11. Wireless Debugging (Tanpa Kabel Saat Development)

Android 11+:

1. Aktifkan Wireless debugging di Developer options
2. Pilih Pair device with pairing code
3. Jalankan di laptop:

```bash
adb pair <IP_PAIRING>:<PORT_PAIRING>
adb connect <IP_DEVICE>:<PORT_DEBUG>
adb devices
```

4. Jalankan app:

```bash
flutter run -d <DEVICE_ID>
```

Alternatif cepat (disarankan):

```powershell
.\start-wireless.ps1
```

Atau via CMD:

```bat
start-wireless.bat
```

Script ini akan:

- Mengecek tool `flutter` dan `adb`
- Memilih device wireless otomatis (jika ada)
- Auto reconnect ADB saat device drop (default 5x retry)
- Menjalankan `flutter run -d <device>`

Opsi jika ingin target spesifik:

```powershell
.\start-wireless.ps1 -DeviceId "adb-xxxx._adb-tls-connect._tcp"
```

Opsi connect endpoint dulu lalu run:

```powershell
.\start-wireless.ps1 -AdbEndpoint "192.168.1.25:37933"
```

Opsi atur jumlah retry reconnect:

```powershell
.\start-wireless.ps1 -ReconnectRetries 5 -RetryDelaySeconds 3
```

## 12. Validasi Koneksi Sebelum Login

Sebelum test login di HP, coba dari browser HP:

- http://192.168.1.7:3000

Jika URL tidak bisa dibuka, berarti masalah jaringan/firewall.

## 13. WebSocket Check (Realtime)

Setelah login:

- Lihat indikator koneksi socket di dashboard
- Lakukan aksi booking/payment/cancel untuk memicu event booking:updated

## 14. Troubleshooting Cepat

### 14.1 Error: Operation not permitted / Connection failed ke 192.168.x.x:3000

Checklist:

- Backend sudah jalan (npm run dev)
- HP dan laptop satu Wi-Fi
- `_hardcodedApiHost` benar (IP Wi-Fi laptop) di `lib/services/api_client.dart`
- Firewall mengizinkan inbound TCP port 3000 (Private profile)
- Untuk `flutter run`: tidak perlu build APK ulang, cukup run ulang
- Untuk APK release: build ulang jika host berubah

### 14.2 adb is not recognized

- Tambahkan Android platform-tools ke PATH
- Atau jalankan command dari folder platform-tools

### 14.3 Device unauthorized di adb devices

- Cek popup USB debugging di HP
- Tekan Allow / Always allow

### 14.4 Flutter tidak mendeteksi HP

```bash
adb devices
flutter devices
flutter doctor
```

## 15. Keamanan Untuk Dev vs Production

Saat ini mobile mengizinkan HTTP (cleartext) untuk kebutuhan development lokal. Untuk production:

- Gunakan HTTPS
- Gunakan domain resmi
- Jangan hardcode secret di aplikasi

## 16. Command Ringkas (Copy-Paste)

Backend:

```bash
cd ../backend
npm run dev
```

Mobile build + install:

```bash
flutter clean
flutter pub get
flutter build apk --release
adb install -r build/app/outputs/flutter-apk/app-release.apk
```
