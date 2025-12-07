/* =========================================
   🌐 GLOBAL SYSTEM LOGIC (ULTIMATE V2.0)
   Menangani: Navbar, Daily Reward, Admin Broadcast, & Toast
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Komponen Global
    updateNavigation();
    injectToastStyles();
    
    // 2. Fitur V2.0
    checkDailyLoginReward(); // Cek Upeti Harian
    listenToAdminBroadcast(); // Dengar Pengumuman Admin
});

/* --- A. MANAJEMEN NAVIGASI PINTAR --- */
function updateNavigation() {
    const session = JSON.parse(localStorage.getItem('kingdom_logged_in'));
    const authLink = document.getElementById('authLink');

    if (session && authLink) {
        // Ambil data terbaru dari DB (untuk sinkronisasi Rank/Avatar)
        // Kita pakai try-catch biar kalau DB belum ready tidak error
        let user = session;
        try {
            if (typeof KingdomDB !== 'undefined') {
                const dbUser = KingdomDB.getUser(session.username);
                if (dbUser) user = dbUser;
            }
        } catch(e) {}

        // Tentukan Link Tujuan
        let targetUrl = 'profile.html';
        let labelText = user.username;
        let badgeColor = 'var(--gold-primary)';
        let rankLabel = 'WARGA';

        // Logic Admin vs User
        if (user.role === 'admin') {
            targetUrl = 'admin/dashboard.html';
            labelText = 'ADMIN PANEL';
            badgeColor = '#ff4500';
            rankLabel = 'GOD MODE';
        } else {
            // Bersihkan nama rank (rank-duke -> Duke)
            rankLabel = user.rank ? user.rank.replace('rank-', '').toUpperCase() : 'PEASANT';
        }

        // Render Tombol Profil di Header
        authLink.innerHTML = `
            <a href="${targetUrl}" class="btn-outline" style="
                border-color: ${badgeColor}; 
                color: ${badgeColor};
                padding: 6px 15px; 
                font-size: 0.8rem; 
                display: flex; 
                align-items: center; 
                gap: 10px;
                background: rgba(0,0,0,0.3);
            ">
                <img src="${user.avatar || 'assets/images/avatars/default.png'}" style="width:24px; height:24px; border-radius:50%; border:1px solid ${badgeColor}; object-fit:cover;">
                <div style="display:flex; flex-direction:column; line-height:1; text-align:left;">
                    <span style="font-weight:bold;">${labelText}</span>
                    <span style="font-size:0.6rem; color:#aaa;">${rankLabel}</span>
                </div>
            </a>
        `;
    }
}

/* --- B. DAILY LOGIN REWARD (UPETI HARIAN) --- */
function checkDailyLoginReward() {
    const session = JSON.parse(localStorage.getItem('kingdom_logged_in'));
    if (!session || session.role === 'admin') return; // Admin tidak dapat reward

    const today = new Date().toDateString(); // "Mon Dec 01 2025"
    const lastLogin = localStorage.getItem('last_login_date_' + session.username);

    // Jika tanggal beda, beri hadiah
    if (lastLogin !== today) {
        // 1. Update Database
        if (typeof KingdomDB !== 'undefined') {
            const user = KingdomDB.getUser(session.username);
            const rewardAmount = 10000000; // 10 Juta
            
            user.saldo += rewardAmount;
            user.walletHistory.push({
                type: 'in', 
                category: 'Bonus', 
                desc: 'Upeti Harian (Daily Login)', 
                amount: rewardAmount, 
                date: new Date().toLocaleString()
            });
            
            KingdomDB.saveUser(user);
            
            // 2. Tampilkan Modal Hadiah (Inject HTML)
            showDailyRewardModal(rewardAmount);
            
            // 3. Simpan tanggal hari ini
            localStorage.setItem('last_login_date_' + session.username, today);
        }
    }
}

function showDailyRewardModal(amount) {
    // Buat elemen modal secara dinamis
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(5px); animation: fadeIn 0.5s;
    `;
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a1a, #000);
            border: 2px solid var(--gold-primary);
            padding: 40px; text-align: center; border-radius: 16px;
            box-shadow: 0 0 50px rgba(212, 175, 55, 0.3);
            max-width: 400px; position: relative;
        ">
            <div style="font-size: 4rem; margin-bottom: 10px;">🎁</div>
            <h2 class="text-gold" style="font-size: 1.8rem; margin-bottom: 5px;">UPETI HARIAN</h2>
            <p style="color: #ccc; margin-bottom: 20px;">Terima kasih telah kembali, Sultan.</p>
            
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                <span style="color: #888; font-size: 0.8rem;">BONUS DITERIMA</span><br>
                <strong style="color: #00ff88; font-size: 1.5rem;">+ IDR 10.000.000</strong>
            </div>

            <button onclick="this.parentElement.parentElement.remove()" class="btn-gold" style="width: 100%;">KLAIM HADIAH</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    // Mainkan suara koin jika ada
    const audio = new Audio('assets/sounds/coin.mp3');
    audio.play().catch(()=>{});
}

/* --- C. GLOBAL BROADCAST (ADMIN RUNNING TEXT) --- */
function listenToAdminBroadcast() {
    window.addEventListener('storage', (event) => {
        // Jika Admin mengirim pesan lewat panel Live Control
        if (event.key === 'auction_signal_msg') {
            const data = event.newValue.split('|');
            const message = data[0];
            const timestamp = data[1];

            // Cek agar pesan lama tidak muncul saat refresh (validasi 10 detik)
            if (Date.now() - parseInt(timestamp) < 10000) {
                showRunningText(message);
            }
        }
    });
}

function showRunningText(text) {
    // Cek jika sudah ada, hapus dulu
    const existing = document.getElementById('globalMarquee');
    if (existing) existing.remove();

    const marquee = document.createElement('div');
    marquee.id = 'globalMarquee';
    marquee.innerHTML = `
        <div style="
            position: fixed; top: 0; left: 0; width: 100%; height: 35px;
            background: #a00; color: white; z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-family: monospace; font-size: 0.9rem;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            overflow: hidden; pointer-events: none;
        ">
            <div style="animation: scrollLeft 15s linear infinite; white-space: nowrap; padding-left: 100%;">
                📢 PENGUMUMAN KERAJAAN: ${text} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; 📢 ${text}
            </div>
        </div>
        <style>
            @keyframes scrollLeft {
                0% { transform: translateX(0); }
                100% { transform: translateX(-100%); }
            }
            body { margin-top: 35px; transition: 0.3s; } /* Dorong body ke bawah */
        </style>
    `;

    document.body.prepend(marquee);

    // Hilangkan setelah 20 detik
    setTimeout(() => {
        if(marquee) marquee.remove();
        document.body.style.marginTop = "0";
    }, 20000);
}

/* --- D. TOAST NOTIFICATION ENGINE --- */
window.showToast = function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `emerald-toast toast-${type}`;
    
    let icon = '📩';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'gold') icon = '💰';

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-msg">${message}</div>
    `;

    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    container.appendChild(toast);

    // Animasi Masuk
    setTimeout(() => toast.classList.add('show'), 10);

    // Animasi Keluar
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
};

function injectToastStyles() {
    // Cek jika style sudah ada
    if (document.getElementById('toast-style')) return;

    const style = document.createElement('style');
    style.id = 'toast-style';
    style.innerHTML = `
        #toast-container {
            position: fixed; top: 20px; right: 20px; z-index: 10001;
            display: flex; flex-direction: column; gap: 10px;
        }
        .emerald-toast {
            background: rgba(15, 15, 15, 0.95);
            backdrop-filter: blur(10px);
            border-left: 4px solid #888;
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.5);
            display: flex; align-items: center; gap: 15px;
            min-width: 300px;
            transform: translateX(120%);
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-family: 'Poppins', sans-serif;
            font-size: 0.9rem;
        }
        .emerald-toast.show { transform: translateX(0); }
        
        .toast-success { border-left-color: #00ff88; }
        .toast-error { border-left-color: #ff4444; }
        .toast-gold { 
            border-left-color: #d4af37; 
            background: linear-gradient(90deg, #1a1a00, #000);
            border: 1px solid #d4af37;
        }
        
        .toast-icon { font-size: 1.2rem; }
    `;
    document.head.appendChild(style);
}

/* --- E. SEARCH HELPER --- */
const headerSearchInput = document.getElementById('searchInput');
if (headerSearchInput) {
    headerSearchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const query = this.value;
            if(query) window.location.href = `search.html?q=${query}`;
        }
    });
}