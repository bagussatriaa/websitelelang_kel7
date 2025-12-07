/* =========================================
   🔐 AUTHENTICATION LOGIC (ULTIMATE V3.0)
   Menangani: Login, Register Lengkap (KYC), & Verifikasi 5 Detik
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    // Deteksi halaman mana yang sedang aktif
    if (document.getElementById('loginForm')) handleLogin();
    if (document.getElementById('registerForm')) handleRegister();
    if (document.querySelector('.loader-diamond')) handleVerificationPage();

});

/* =========================================
   1. LOGIKA LOGIN (Masuk Gerbang)
   ========================================= */
function handleLogin() {
    const form = document.getElementById('loginForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const userInput = document.getElementById('loginUser');
        const passInput = document.getElementById('loginPass');
        const btn = document.querySelector('.btn-auth');
        const card = document.querySelector('.auth-card');

        const username = userInput.value.trim().toLowerCase();
        const password = passInput.value.trim();

        // UI Loading Effect
        const originalText = btn.innerText;
        btn.innerText = "MEMERIKSA IDENTITAS...";
        btn.style.opacity = "0.7";
        btn.disabled = true;

        // Simulasi Delay Database (1 Detik)
        setTimeout(() => {
            const users = KingdomDB.getUsers();
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                // LOGIN SUKSES
                // Simpan sesi login
                localStorage.setItem('kingdom_logged_in', JSON.stringify(user));
                
                // Redirect berdasarkan Role
                if (user.role === 'admin') {
                    window.location.href = '../admin/dashboard.html';
                } else {
                    window.location.href = '../index.html';
                }
            } else {
                // LOGIN GAGAL
                // Efek Shake (Getar) pada kartu
                card.classList.add('shake');
                setTimeout(() => card.classList.remove('shake'), 500);

                // Reset UI
                btn.innerText = originalText;
                btn.style.opacity = "1";
                btn.disabled = false;
                passInput.value = '';
                
                // Alert Modern (Toast kalau ada, atau alert biasa)
                alert("🚫 Akses Ditolak: Username atau Sandi salah!");
            }
        }, 1000);
    });
}

/* =========================================
   2. LOGIKA REGISTRASI (KYC LENGKAP)
   ========================================= */
function handleRegister() {
    const form = document.getElementById('registerForm');

    // Preview Nama File Upload
    const fileInput = document.getElementById('regKTP');
    if(fileInput) {
        fileInput.addEventListener('change', function() {
            const label = document.getElementById('fileNameDisplay');
            if (this.files && this.files.length > 0) {
                label.innerText = "✅ Siap Diunggah: " + this.files[0].name;
                label.style.color = "#00ff88";
            }
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Ambil Data Input (V3.0: Lebih Lengkap)
        const name = document.getElementById('regName').value.trim();
        const username = document.getElementById('regUser').value.trim().toLowerCase();
        const pass = document.getElementById('regPass').value;
        const passConf = document.getElementById('regPassConf').value;
        const referral = document.getElementById('regRef').value.trim();
        
        // Data KYC Baru
        const nik = document.getElementById('regNIK').value;
        const phone = document.getElementById('regPhone').value;
        const job = document.getElementById('regJob').value;
        const city = document.getElementById('regCity').value;
        const file = document.getElementById('regKTP').files[0];
        
        const btn = document.querySelector('.btn-auth');

        // --- VALIDASI KETAT ---
        if (pass !== passConf) { alert("⚠️ Kata sandi tidak cocok!"); return; }
        if (pass.length < 6) { alert("⚠️ Kata sandi minimal 6 karakter."); return; }
        if (nik.length < 16) { alert("⚠️ NIK harus 16 digit!"); return; }
        if (!file) { alert("⚠️ Wajib upload KTP!"); return; }
        if (username.includes(' ')) { alert("⚠️ Username tidak boleh ada spasi."); return; }

        // Ubah Status Tombol
        btn.innerText = "MENGENKRIPSI DATA...";
        btn.disabled = true;

        // Proses Konversi Gambar KTP ke Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = function(event) {
            const base64KTP = event.target.result;

            // Buat Object User Baru (Struktur Lengkap V3)
            const newUser = {
                name: name,
                username: username,
                password: pass,
                nik: nik,
                phone: phone,
                job: job,
                city: city,
                ktpImage: base64KTP, // Simpan gambar
                invitedBy: referral || null, // Upline
                
                // Default Stats (Hardcore Mode: Saldo 0)
                role: 'user',
                rank: 'rank-peasant',
                saldo: 0, // NO FREE MONEY
                verified: false, // Pending verification page
                
                // Inventory Awal
                inventory: ['border-default'],
                activeBorder: 'border-default',
                badges: [],
                history: [],
                walletHistory: [],
                settings: { ghostMode: false, showHistory: true, showNetWorth: true },
                createdAt: new Date().toISOString()
            };

            // Cek Username Ganda sebelum pindah halaman
            const existingUsers = KingdomDB.getUsers();
            if (existingUsers.find(u => u.username === username)) {
                alert("⚠️ Username sudah dipakai! Pilih yang lain.");
                btn.innerText = "AJUKAN VERIFIKASI (5 DETIK)";
                btn.disabled = false;
                return;
            }

            // Simpan Sementara di Session Storage (Belum masuk DB permanen sampai verifikasi selesai)
            // Atau langsung create unverified user (Kita pilih create unverified user)
            KingdomDB.createUser(newUser); // Fungsi ini ada di db.js (perlu sedikit penyesuaian saldo di db.js atau kita timpa di step verifikasi)

            // KITA FORCE UPDATE SALDO JADI 0 DI SINI (Override default db.js)
            let users = KingdomDB.getUsers();
            let createdUserIndex = users.findIndex(u => u.username === username);
            if(createdUserIndex !== -1) {
                users[createdUserIndex].saldo = 0; // Pastikan 0
                users[createdUserIndex].walletHistory = []; // Kosongkan bonus history
                localStorage.setItem('kingdom_users', JSON.stringify(users));
            }

            // Redirect ke Halaman Loading
            window.location.href = `verification.html?user=${username}`;
        };
    });
}

/* =========================================
   3. LOGIKA VERIFIKASI (LOADING 5 DETIK)
   ========================================= */
function handleVerificationPage() {
    const statusText = document.getElementById('verifyStatusText'); // Pastikan ID ini ada di HTML verification.html
    const progressBar = document.querySelector('.progress-fill');

    // Ambil username dari URL
    const params = new URLSearchParams(window.location.search);
    const targetUser = params.get('user');

    if (!targetUser) {
        alert("Data user hilang.");
        window.location.href = 'register.html';
        return;
    }

    // Animasi Progress Bar (5 Detik / 5000ms)
    setTimeout(() => { 
        if(progressBar) progressBar.style.width = "100%"; 
    }, 100);

    // Skenario Status (Roleplay)
    const messages = [
        { time: 1000, text: "Mengenkripsi dokumen rahasia..." },
        { time: 2500, text: "Menghubungi Dukcapil Kerajaan..." },
        { time: 3500, text: "Memeriksa daftar hitam kriminal..." },
        { time: 4500, text: "Membuka rekening Royal Bank..." }
    ];

    messages.forEach(msg => {
        setTimeout(() => {
            if(statusText) statusText.innerText = msg.text;
        }, msg.time);
    });

    // FINALISASI (Setelah 5 Detik)
    setTimeout(() => {
        // Ambil User
        const users = KingdomDB.getUsers();
        const index = users.findIndex(u => u.username === targetUser);

        if (index !== -1) {
            // Ubah Status jadi Verified
            users[index].verified = true;
            
            // Cek Referral Bonus (Jika ada upline)
            const uplineCode = users[index].invitedBy;
            if (uplineCode) {
                const upline = users.find(u => u.referralCode === uplineCode);
                if (upline) {
                    // Bonus HANYA untuk Upline (5 Juta)
                    upline.saldo += 5000000;
                    upline.walletHistory.push({
                        type: 'in', category: 'Referral', 
                        desc: `Bonus ajak ${targetUser}`, amount: 5000000, 
                        date: new Date().toLocaleString()
                    });
                    // User baru TETAP 0 (Sesuai request)
                }
            }

            // Simpan Perubahan
            localStorage.setItem('kingdom_users', JSON.stringify(users));

            // Auto Login
            localStorage.setItem('kingdom_logged_in', JSON.stringify(users[index]));

            // Pesan Sukses
            if(statusText) {
                statusText.innerText = "✅ Identitas Terkonfirmasi! Selamat Datang.";
                statusText.style.color = "#00ff88";
            }

            // Redirect
            setTimeout(() => { window.location.href = '../index.html'; }, 1500);
        }
    }, 5000); // 5000ms = 5 Detik
}