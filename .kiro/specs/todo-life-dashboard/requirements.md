# Dokumen Persyaratan

## Pendahuluan

To-Do List Life Dashboard adalah sebuah halaman web statis yang membantu pengguna mengorganisir hari mereka. Dashboard ini menampilkan waktu dan tanggal real-time, sapaan personal, focus timer berbasis Pomodoro, daftar tugas (to-do list), dan quick links ke website favorit. Seluruh data disimpan di sisi klien menggunakan Local Storage. Tidak ada backend, tidak ada framework — hanya HTML, CSS, dan Vanilla JavaScript.

---

## Glosarium

- **Dashboard**: Halaman web utama yang menampilkan semua widget secara terpadu.
- **Greeting_Widget**: Komponen yang menampilkan waktu, tanggal, dan sapaan berdasarkan waktu hari.
- **Focus_Timer**: Komponen countdown timer berbasis Pomodoro dengan durasi yang dapat dikonfigurasi.
- **Todo_List**: Komponen pengelola daftar tugas harian.
- **Quick_Links**: Komponen pengelola tautan cepat ke website favorit.
- **Local_Storage**: Browser Local Storage API yang digunakan untuk menyimpan semua data pengguna.
- **Theme_Manager**: Komponen yang mengelola mode tampilan terang (light) dan gelap (dark).
- **Task**: Satu item dalam Todo_List yang memiliki teks, status selesai, dan timestamp pembuatan.
- **Link**: Satu item dalam Quick_Links yang memiliki label dan URL.

---

## Persyaratan

### Persyaratan 1: Greeting Widget

**User Story:** Sebagai pengguna, saya ingin melihat waktu, tanggal, dan sapaan personal di dashboard, agar saya dapat langsung mengetahui konteks waktu saat membuka halaman.

#### Kriteria Penerimaan

1. THE Greeting_Widget SHALL menampilkan jam dan menit saat ini dalam format HH:MM yang diperbarui setiap detik.
2. THE Greeting_Widget SHALL menampilkan nama hari dan tanggal lengkap dalam Bahasa Indonesia (contoh: "Senin, 14 Juli 2025").
3. WHEN waktu berada antara 05:00–11:59, THE Greeting_Widget SHALL menampilkan sapaan "Selamat Pagi".
4. WHEN waktu berada antara 12:00–14:59, THE Greeting_Widget SHALL menampilkan sapaan "Selamat Siang".
5. WHEN waktu berada antara 15:00–17:59, THE Greeting_Widget SHALL menampilkan sapaan "Selamat Sore".
6. WHEN waktu berada antara 18:00–04:59, THE Greeting_Widget SHALL menampilkan sapaan "Selamat Malam".
7. WHERE fitur custom name diaktifkan, THE Greeting_Widget SHALL menampilkan nama pengguna dalam sapaan (contoh: "Selamat Pagi, Budi").
8. WHERE fitur custom name diaktifkan, WHEN pengguna menyimpan nama baru, THE Greeting_Widget SHALL menyimpan nama tersebut ke Local_Storage dan menampilkannya segera.
9. IF Local_Storage tidak mengandung nama pengguna, THEN THE Greeting_Widget SHALL menampilkan sapaan tanpa nama.

---

### Persyaratan 2: Focus Timer

**User Story:** Sebagai pengguna, saya ingin menggunakan focus timer berbasis Pomodoro, agar saya dapat bekerja dalam sesi terfokus dengan durasi yang terukur.

#### Kriteria Penerimaan

1. THE Focus_Timer SHALL menampilkan sisa waktu dalam format MM:SS.
2. WHEN pengguna menekan tombol Start, THE Focus_Timer SHALL memulai countdown dari durasi yang telah dikonfigurasi.
3. WHEN pengguna menekan tombol Stop, THE Focus_Timer SHALL menghentikan countdown dan mempertahankan sisa waktu.
4. WHEN pengguna menekan tombol Reset, THE Focus_Timer SHALL mengembalikan tampilan ke durasi awal yang dikonfigurasi.
5. WHEN countdown mencapai 00:00, THE Focus_Timer SHALL menampilkan notifikasi visual kepada pengguna.
6. WHILE countdown berjalan, THE Focus_Timer SHALL memperbarui tampilan setiap detik.
7. WHERE fitur custom Pomodoro time diaktifkan, THE Focus_Timer SHALL menyediakan input untuk mengubah durasi sesi dalam satuan menit.
8. WHERE fitur custom Pomodoro time diaktifkan, WHEN pengguna menyimpan durasi baru, THE Focus_Timer SHALL menyimpan nilai tersebut ke Local_Storage dan menerapkannya pada sesi berikutnya.
9. IF durasi yang dimasukkan pengguna kurang dari 1 menit atau lebih dari 120 menit, THEN THE Focus_Timer SHALL menampilkan pesan kesalahan dan mempertahankan durasi sebelumnya.

---

### Persyaratan 3: To-Do List

**User Story:** Sebagai pengguna, saya ingin mengelola daftar tugas harian saya, agar saya dapat melacak pekerjaan yang perlu diselesaikan.

#### Kriteria Penerimaan

1. WHEN pengguna memasukkan teks tugas dan mengonfirmasi (tekan Enter atau klik tombol tambah), THE Todo_List SHALL menambahkan Task baru ke daftar dan menyimpannya ke Local_Storage.
2. WHEN pengguna menandai sebuah Task sebagai selesai, THE Todo_List SHALL memperbarui status Task tersebut secara visual (contoh: teks dicoret) dan menyimpan perubahan ke Local_Storage.
3. WHEN pengguna menghapus sebuah Task, THE Todo_List SHALL menghapus Task tersebut dari daftar dan dari Local_Storage.
4. WHEN pengguna mengedit teks sebuah Task dan mengonfirmasi, THE Todo_List SHALL memperbarui teks Task tersebut di daftar dan di Local_Storage.
5. WHEN halaman dimuat, THE Todo_List SHALL memuat semua Task yang tersimpan dari Local_Storage dan menampilkannya.
6. IF teks tugas yang dimasukkan pengguna kosong atau hanya berisi spasi, THEN THE Todo_List SHALL menolak penambahan Task dan tidak menyimpan apapun ke Local_Storage.
7. THE Todo_List SHALL menampilkan jumlah tugas yang belum selesai kepada pengguna.

---

### Persyaratan 4: Quick Links

**User Story:** Sebagai pengguna, saya ingin menyimpan dan mengakses tautan ke website favorit saya langsung dari dashboard, agar saya dapat membuka situs yang sering dikunjungi dengan cepat.

#### Kriteria Penerimaan

1. WHEN pengguna menambahkan Link baru dengan label dan URL yang valid, THE Quick_Links SHALL menyimpan Link tersebut ke Local_Storage dan menampilkannya sebagai tombol.
2. WHEN pengguna mengklik sebuah tombol Link, THE Quick_Links SHALL membuka URL yang sesuai di tab baru browser.
3. WHEN pengguna menghapus sebuah Link, THE Quick_Links SHALL menghapus Link tersebut dari tampilan dan dari Local_Storage.
4. WHEN halaman dimuat, THE Quick_Links SHALL memuat semua Link yang tersimpan dari Local_Storage dan menampilkannya.
5. IF URL yang dimasukkan pengguna tidak mengandung format yang valid (tidak diawali http:// atau https://), THEN THE Quick_Links SHALL menampilkan pesan kesalahan dan menolak penyimpanan Link.
6. IF label yang dimasukkan pengguna kosong atau hanya berisi spasi, THEN THE Quick_Links SHALL menolak penambahan Link dan menampilkan pesan kesalahan.

---

### Persyaratan 5: Light / Dark Mode

**User Story:** Sebagai pengguna, saya ingin dapat beralih antara tampilan terang dan gelap, agar dashboard nyaman digunakan di berbagai kondisi pencahayaan.

#### Kriteria Penerimaan

1. THE Theme_Manager SHALL menyediakan tombol toggle untuk beralih antara light mode dan dark mode.
2. WHEN pengguna mengaktifkan dark mode, THE Theme_Manager SHALL menerapkan skema warna gelap ke seluruh elemen Dashboard.
3. WHEN pengguna mengaktifkan light mode, THE Theme_Manager SHALL menerapkan skema warna terang ke seluruh elemen Dashboard.
4. WHEN pengguna mengubah tema, THE Theme_Manager SHALL menyimpan preferensi tema ke Local_Storage.
5. WHEN halaman dimuat, THE Theme_Manager SHALL membaca preferensi tema dari Local_Storage dan menerapkannya sebelum konten ditampilkan untuk menghindari flash of unstyled content.
6. IF Local_Storage tidak mengandung preferensi tema, THEN THE Theme_Manager SHALL menerapkan light mode sebagai default.

---

### Persyaratan 6: Persistensi Data

**User Story:** Sebagai pengguna, saya ingin semua pengaturan dan data saya tetap tersimpan saat saya menutup dan membuka kembali browser, agar saya tidak perlu mengatur ulang dashboard setiap saat.

#### Kriteria Penerimaan

1. THE Local_Storage SHALL menyimpan semua data Task, Link, preferensi tema, nama pengguna, dan durasi Pomodoro secara terpisah menggunakan kunci (key) yang unik dan konsisten.
2. WHEN halaman dimuat, THE Dashboard SHALL memuat semua data dari Local_Storage sebelum merender antarmuka pengguna.
3. IF Local_Storage tidak tersedia di browser pengguna, THEN THE Dashboard SHALL tetap berfungsi secara penuh dalam sesi tersebut tanpa menyimpan data secara permanen, dan SHALL menampilkan peringatan kepada pengguna.

---

### Persyaratan 7: Performa dan Kompatibilitas

**User Story:** Sebagai pengguna, saya ingin dashboard berjalan dengan cepat dan lancar di browser modern, agar pengalaman penggunaan terasa responsif.

#### Kriteria Penerimaan

1. THE Dashboard SHALL dapat dimuat dan digunakan sepenuhnya tanpa koneksi internet setelah aset pertama kali diunduh.
2. THE Dashboard SHALL berjalan tanpa error di browser Chrome, Firefox, Edge, dan Safari versi terbaru.
3. WHILE pengguna berinteraksi dengan komponen apapun, THE Dashboard SHALL merespons interaksi dalam waktu kurang dari 100ms.
4. THE Dashboard SHALL menggunakan tepat satu file CSS di dalam direktori css/ dan tepat satu file JavaScript di dalam direktori js/.
