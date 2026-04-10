# Rencana Implementasi

## Tugas

- [x] 1. Setup struktur proyek dan file dasar
  - [x] 1.1 Buat file `index.html` dengan struktur HTML semantik dan placeholder untuk semua widget
  - [x] 1.2 Buat file `css/style.css` dengan variabel CSS untuk tema light/dark dan layout dasar
  - [x] 1.3 Buat file `js/app.js` sebagai entry point dengan pola module pattern

- [x] 2. Implementasi StorageService
  - [x] 2.1 Implementasi `StorageService.isAvailable()` yang mendeteksi ketersediaan Local Storage
  - [x] 2.2 Implementasi `StorageService.get(key)` dengan penanganan JSON.parse yang aman
  - [x] 2.3 Implementasi `StorageService.set(key, value)` dengan penanganan error
  - [x] 2.4 Definisikan semua konstanta kunci storage (`tld_tasks`, `tld_links`, `tld_theme`, `tld_username`, `tld_pomodoro_duration`)
  - [x] 2.5 Tulis property test untuk konsistensi kunci storage (Property 23)

- [x] 3. Implementasi ThemeManager
  - [x] 3.1 Implementasi `ThemeManager.apply(theme)` yang menambah/hapus class pada `<body>`
  - [x] 3.2 Implementasi `ThemeManager.save(theme)` yang menyimpan ke StorageService
  - [x] 3.3 Implementasi `ThemeManager.toggle()` yang membalik tema saat ini
  - [x] 3.4 Implementasi `ThemeManager.init()` yang membaca storage dan menerapkan tema sebelum render
  - [x] 3.5 Tambahkan CSS variabel dan class `.dark` untuk skema warna gelap
  - [x] 3.6 Tulis property test untuk round-trip tema (Property 21) dan toggle idempoten (Property 22)
  - [x] 3.7 Tulis unit test untuk default light mode saat storage kosong (edge case 5.6)

- [x] 4. Implementasi GreetingWidget
  - [x] 4.1 Implementasi `GreetingWidget.formatTime(date)` yang mengembalikan string HH:MM
  - [x] 4.2 Implementasi `GreetingWidget.formatDate(date)` dengan nama hari dan bulan Bahasa Indonesia
  - [x] 4.3 Implementasi `GreetingWidget.getGreeting(hour)` dengan logika empat rentang waktu
  - [x] 4.4 Implementasi `GreetingWidget.saveName(name)` yang menyimpan ke StorageService
  - [x] 4.5 Implementasi `GreetingWidget.render()` yang menampilkan waktu, tanggal, sapaan, dan nama
  - [x] 4.6 Implementasi `GreetingWidget.init()` dengan setInterval 1000ms untuk memperbarui tampilan
  - [x] 4.7 Tulis property test untuk formatTime (Property 1), formatDate (Property 2), getGreeting (Property 3)
  - [x] 4.8 Tulis property test untuk sapaan mengandung nama (Property 4) dan round-trip nama (Property 5)
  - [x] 4.9 Tulis unit test untuk sapaan tanpa nama saat storage kosong (kriteria 1.9)

- [x] 5. Implementasi FocusTimer
  - [x] 5.1 Implementasi `FocusTimer.formatTime(seconds)` yang mengembalikan string MM:SS
  - [x] 5.2 Implementasi `FocusTimer.validateDuration(min)` yang memvalidasi rentang 1–120
  - [x] 5.3 Implementasi `FocusTimer.saveDuration(min)` yang menyimpan ke StorageService
  - [x] 5.4 Implementasi `FocusTimer.start()`, `FocusTimer.stop()`, `FocusTimer.reset()`
  - [x] 5.5 Implementasi `FocusTimer.tick()` yang mengurangi remainingSeconds dan menangani 00:00
  - [x] 5.6 Implementasi `FocusTimer.showCompletionNotice()` untuk notifikasi visual saat timer habis
  - [x] 5.7 Implementasi `FocusTimer.init()` yang memuat durasi dari storage dan merender tampilan
  - [x] 5.8 Tulis property test untuk formatTime timer (Property 6), tick (Property 7), reset (Property 8)
  - [x] 5.9 Tulis property test untuk round-trip durasi (Property 9) dan validasi durasi (Property 10)
  - [x] 5.10 Tulis unit test untuk start/stop (kriteria 2.2, 2.3) dan notifikasi saat 00:00 (edge case 2.5)

- [x] 6. Implementasi TodoList
  - [x] 6.1 Implementasi `TodoList.isValidText(text)` yang menolak string whitespace-only
  - [x] 6.2 Implementasi `TodoList.addTask(text)` dengan validasi, pembuatan ID, dan penyimpanan
  - [x] 6.3 Implementasi `TodoList.toggleTask(id)` yang membalik status completed dan menyimpan
  - [x] 6.4 Implementasi `TodoList.deleteTask(id)` yang menghapus dari array dan menyimpan
  - [x] 6.5 Implementasi `TodoList.editTask(id, newText)` yang memperbarui teks dan menyimpan
  - [x] 6.6 Implementasi `TodoList.getIncompleteCount()` yang menghitung task belum selesai
  - [x] 6.7 Implementasi `TodoList.save()` dan `TodoList.render()` termasuk tampilan jumlah task
  - [x] 6.8 Implementasi `TodoList.init()` yang memuat tasks dari storage
  - [x] 6.9 Tulis property test untuk validasi teks (Property 11), toggle (Property 12), hapus (Property 13)
  - [x] 6.10 Tulis property test untuk edit (Property 14), load (Property 15), dan invariant count (Property 16)

- [x] 7. Implementasi QuickLinks
  - [x] 7.1 Implementasi `QuickLinks.isValidUrl(url)` yang memeriksa awalan http:// atau https://
  - [x] 7.2 Implementasi `QuickLinks.isValidLabel(label)` yang menolak string whitespace-only
  - [x] 7.3 Implementasi `QuickLinks.addLink(label, url)` dengan validasi dan penyimpanan
  - [x] 7.4 Implementasi `QuickLinks.deleteLink(id)` yang menghapus dari array dan menyimpan
  - [x] 7.5 Implementasi `QuickLinks.render()` yang menampilkan tombol link dengan handler klik
  - [x] 7.6 Implementasi `QuickLinks.init()` yang memuat links dari storage
  - [x] 7.7 Tulis property test untuk round-trip tambah link (Property 17), hapus link (Property 18)
  - [x] 7.8 Tulis property test untuk load links (Property 19) dan validasi input link (Property 20)
  - [x] 7.9 Tulis unit test untuk buka URL di tab baru (kriteria 4.2)

- [x] 8. Integrasi dan inisialisasi aplikasi
  - [x] 8.1 Implementasi urutan inisialisasi di `app.js`: ThemeManager pertama, lalu modul lain
  - [x] 8.2 Implementasi penanganan fallback saat StorageService tidak tersedia (banner peringatan)
  - [x] 8.3 Tulis unit test untuk urutan inisialisasi (kriteria 6.2) dan fallback storage (edge case 6.3)

- [x] 9. Styling dan UI
  - [x] 9.1 Implementasi layout responsif dashboard dengan CSS Grid atau Flexbox
  - [x] 9.2 Implementasi animasi dan transisi untuk toggle tema
  - [x] 9.3 Implementasi tampilan visual task selesai (teks dicoret)
  - [x] 9.4 Implementasi pesan error inline untuk semua validasi input
  - [x] 9.5 Pastikan hanya ada satu file CSS di `css/` dan satu file JS di `js/`
