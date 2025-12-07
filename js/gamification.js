/* =========================================
   🏆 GAMIFICATION ENGINE (ULTIMATE V3.0)
   Menangani: Auto-Check Misi, Visual Reward, & Sound FX
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Hanya jalan jika user login
    const session = JSON.parse(localStorage.getItem('kingdom_logged_in'));
    if (session) {
        // Inject CSS khusus untuk Achievement Popup (agar tidak perlu edit css manual)
        injectAchievementStyles();
        
        // Cek Achievement setiap kali halaman dibuka (Delay 2 detik biar ga numpuk sama loading awal)
        setTimeout(() => checkAchievements(session.username), 2000);
    }
});

/* --- 1. LOGIKA PENGECEKAN (MISI) --- */
function checkAchievements(username) {
    // Ambil data fresh dari DB
    const user = KingdomDB.getUser(username);
    if (!user) return;

    // Ambil daftar misi dari DB
    const allAchievs = JSON.parse(localStorage.getItem('kingdom_achv')) || [];
    
    // Pastikan array badges ada
    if (!user.badges) user.badges = [];
    
    let hasUpdate = false;

    // --- DEFINISI SYARAT MISI DI SINI ---
    
    // A. MISI: FIRST BLOOD (Menang 1x)
    const achvFirst = allAchievs.find(a => a.id === 'achv-first');
    if (achvFirst && !user.badges.includes('achv-first')) {
        // Syarat: History kemenangan ada isinya
        if (user.history && user.history.length >= 1) {
            unlockAchievement(user, achvFirst);
            hasUpdate = true;
        }
    }

    // B. MISI: THE WHALE (Belanja > 1 Miliar)
    const achvWhale = allAchievs.find(a => a.id === 'achv-whale');
    if (achvWhale && !user.badges.includes('achv-whale')) {
        // Syarat: Total nominal di history > 1M
        const totalSpend = (user.history || []).reduce((sum, item) => sum + item.price, 0);
        if (totalSpend >= 1000000000) {
            unlockAchievement(user, achvWhale);
            hasUpdate = true;
        }
    }

    // Jika ada update, simpan kembali user ke DB
    if (hasUpdate) {
        KingdomDB.saveUser(user);
    }
}

/* --- 2. EKSEKUSI UNLOCK (PEMBERIAN HADIAH) --- */
function unlockAchievement(user, achvData) {
    // 1. Tambah ke daftar badge user
    user.badges.push(achvData.id);

    // 2. Tampilkan Popup Mewah
    showAchievementPopup(achvData);

    // 3. Mainkan Suara Kemenangan
    const audio = new Audio('assets/sounds/fanfare.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
        // Browser kadang blokir autoplay audio jika belum ada interaksi
        console.log("Audio achievement diblokir browser.");
    });
}

/* --- 3. VISUAL POPUP (ANIMASI MEWAH) --- */
function showAchievementPopup(achvData) {
    // Hapus popup lama jika ada
    const oldPopup = document.querySelector('.achv-popup');
    if(oldPopup) oldPopup.remove();

    const popup = document.createElement('div');
    popup.className = 'achv-popup glass-panel';
    
    // Gambar default jika aset hilang
    const imgSrc = achvData.image || 'assets/ui/badge_placeholder.png';

    popup.innerHTML = `
        <div class="achv-glow"></div>
        <div class="achv-icon-container">
            <img src="${imgSrc}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/625/625394.png'">
        </div>
        <div class="achv-text">
            <small style="color:#00ff88; font-weight:bold; letter-spacing:1px; font-family:'Poppins';">ACHIEVEMENT UNLOCKED</small>
            <h3 class="text-gold" style="margin:2px 0; font-size:1.1rem;">${achvData.title}</h3>
            <p style="color:#ccc; font-size:0.85rem; margin:0;">${achvData.desc}</p>
        </div>
    `;

    document.body.appendChild(popup);

    // Animasi Masuk
    // Menggunakan requestAnimationFrame agar transisi CSS terbaca
    requestAnimationFrame(() => {
        popup.classList.add('show');
    });

    // Hilang otomatis setelah 6 detik
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 500);
    }, 6000);
}

/* --- 4. INJECT CSS (STYLE OTOMATIS) --- */
function injectAchievementStyles() {
    if (document.getElementById('achv-style')) return; // Jangan inject kalau sudah ada
    
    const style = document.createElement('style');
    style.id = 'achv-style';
    style.innerHTML = `
        /* Container Popup */
        .achv-popup {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-150px); /* Mulai dari atas layar */
            background: rgba(15, 25, 20, 0.95);
            border: 2px solid var(--gold-primary);
            border-radius: 50px;
            padding: 10px 25px 10px 10px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 0 50px rgba(212, 175, 55, 0.4);
            z-index: 10002;
            opacity: 0;
            transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); /* Efek memantul (bouncy) */
            min-width: 350px;
            overflow: hidden;
        }
        
        /* State Masuk */
        .achv-popup.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }

        /* Efek Kilau Berputar di belakang icon */
        .achv-glow {
            position: absolute;
            top: -50%; left: -20%;
            width: 200px; height: 200px;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, transparent 70%);
            animation: spinSlow 4s infinite linear;
            pointer-events: none;
            z-index: 0;
        }

        /* Icon Badge */
        .achv-icon-container {
            width: 50px; height: 50px;
            background: black;
            border-radius: 50%;
            border: 2px solid var(--gold-primary);
            display: flex; align-items: center; justify-content: center;
            z-index: 1;
            position: relative;
            flex-shrink: 0;
        }

        .achv-icon-container img {
            width: 30px; height: 30px; object-fit: contain;
            animation: popIn 0.5s 0.3s backwards;
        }

        /* Teks */
        .achv-text { z-index: 1; text-align: left; }
        
        /* Animation Helper */
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }
    `;
    document.head.appendChild(style);
}