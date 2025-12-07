/* =========================================
   ⚔️ AUCTION ROOM LOGIC (ULTIMATE V3.0)
   Menangani: Bidding, Timer, Smart Bots, & Admin Remote Sync
   ========================================= */

let currentItem = null;
let currentUser = null;
let timerInterval = null;
let botInterval = null;

// Fitur Auto Bid Client-Side
let userAutoBidMax = 0;
let isAutoBidActive = false;

document.addEventListener('DOMContentLoaded', () => {
    // 1. SETUP AWAL & VALIDASI
    const params = new URLSearchParams(window.location.search);
    const itemId = parseInt(params.get('id')); // Pastikan Integer

    if (!itemId) { window.location.href = 'index.html'; return; }

    const session = JSON.parse(localStorage.getItem('kingdom_logged_in'));
    if (!session) {
        alert("🔒 Silakan login untuk masuk Ruang Lelang.");
        window.location.href = 'auth/login.html';
        return;
    }

    // Load Data
    currentUser = KingdomDB.getUser(session.username);
    const items = KingdomDB.getItems();
    currentItem = items.find(i => i.id === itemId);

    if (!currentItem) {
        alert("⚠️ Barang tidak ditemukan / Telah dihapus.");
        window.location.href = 'index.html';
        return;
    }

    // 2. JALANKAN RUANGAN
    initRoom();
});

function initRoom() {
    renderUserStatus();
    
    // Cek Rank (Security)
    if (!checkSecurityClearance()) return;

    renderItemDetails();
    injectAdvancedFeatures(); // PDF & Auto Bid UI
    
    // Cek Status Barang saat Load
    if(currentItem.status === 'sold') {
        finishAuction(true); // Langsung tampilkan pemenang tanpa animasi
        document.getElementById('countdownTimer').innerText = "SOLD";
        return;
    } else if (currentItem.status === 'paused') {
        document.getElementById('countdownTimer').innerText = "PAUSED";
        document.getElementById('countdownTimer').style.color = "gold";
    } else {
        startAuctionTimer();
        startSmartBotSimulation();
    }
    
    // Welcome Message
    addSystemMessage(`Selamat datang di Channel #${currentItem.id}. Fee transaksi: ${getCurrentFee()}%`);
}

/* --- 1. RENDER UI --- */
function renderUserStatus() {
    document.getElementById('userRankDisplay').innerText = currentUser.rank.replace('rank-', '').toUpperCase();
    document.getElementById('userSaldoDisplay').innerText = KingdomDB.formatRupiah(currentUser.saldo);
    document.getElementById('roomIdDisplay').innerText = `#${currentItem.id}`;
}

function renderItemDetails() {
    document.getElementById('itemName').innerText = currentItem.name;
    document.getElementById('itemDesc').innerText = `Kategori: ${currentItem.category} • ID: ${currentItem.id}`;
    document.getElementById('itemImage').src = currentItem.image;
    
    // Random Viewer Count (Simulasi)
    const baseView = currentItem.access === 'vvip' ? 5000 : 800;
    document.getElementById('viewCount').innerText = baseView + Math.floor(Math.random() * 500);
    
    updatePriceDisplay();
}

function updatePriceDisplay() {
    document.getElementById('currentPriceDisplay').innerText = KingdomDB.formatRupiah(currentItem.currentBid);
    document.getElementById('highestBidderName').innerText = currentItem.highestBidder || '-';
    
    // Efek Flash pada Harga
    const priceBox = document.getElementById('currentPriceDisplay');
    priceBox.style.transform = "scale(1.1)";
    priceBox.style.color = "#fff";
    setTimeout(() => { 
        priceBox.style.transform = "scale(1)"; 
        priceBox.style.color = "var(--gold-primary)"; 
    }, 200);
}

/* --- 2. INJECT FITUR TAMBAHAN (AUTO BID & PDF) --- */
function injectAdvancedFeatures() {
    // Tombol PDF
    const metaBox = document.querySelector('.item-meta');
    if(!document.getElementById('btnPdf')) {
        const pdfBtn = document.createElement('button');
        pdfBtn.id = 'btnPdf';
        pdfBtn.className = 'btn-pdf'; // Style dari auction-live.html V2
        pdfBtn.innerHTML = '📄 Dokumen Sertifikat (PDF)';
        pdfBtn.onclick = () => { showToast("Mengunduh dokumen...", "info"); };
        metaBox.appendChild(pdfBtn);
    }

    // Auto Bid Logic UI sudah ada di HTML V2 (#autoBidPanel), kita tinggal handle logicnya
}

/* --- 3. TIMER LOGIC --- */
function startAuctionTimer() {
    if(timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const endTime = new Date(currentItem.endTime).getTime();
        const distance = endTime - now;

        if (distance < 0) {
            clearInterval(timerInterval);
            // Cek apakah barang Sold atau Pass (Reserve Price)
            // Logic ini biasanya di handle server, tapi disini kita handle di client side
            // Biarkan Admin yang memutuskan 'Sold' via remote, atau otomatis close disini
            document.getElementById('countdownTimer').innerText = "WAITING...";
            return;
        }

        // Format Waktu
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        const timerEl = document.getElementById('countdownTimer');
        timerEl.innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;

        // Efek Tegang (< 30 detik)
        if (distance < 30000) {
            timerEl.style.color = '#ff4444';
            timerEl.style.textShadow = '0 0 10px red';
        }
    }, 1000);
}

/* --- 4. BIDDING ENGINE --- */
window.addBid = function(amount) { processBid(currentItem.currentBid + amount); };
window.submitBid = function() {
    const val = parseInt(document.getElementById('customBidInput').value);
    if(val) processBid(val);
};

function processBid(amount) {
    // Validasi Dasar
    if (amount <= currentItem.currentBid) {
        showToast("Tawaran harus lebih tinggi!", "error");
        return;
    }

    // Cek Saldo + Limit Utang
    const fee = KingdomDB.getRankInfo(currentUser.rank).fee * amount;
    const limit = Math.abs(KingdomDB.getRankInfo(currentUser.rank).limit);
    
    if ((currentUser.saldo + limit) < (amount + fee)) {
        showToast("Saldo / Limit Kredit tidak mencukupi.", "error");
        return;
    }

    executeBid(currentUser.username, amount, false);
}

function executeBid(username, amount, isAuto) {
    // Update DB
    KingdomDB.placeBid(currentItem.id, {username: username}, amount, isAuto);
    
    // Update Lokal
    currentItem.currentBid = amount;
    currentItem.highestBidder = username;
    updatePriceDisplay();

    // Chat & Sound
    let displayName = username;
    // Cek jika ini saya sendiri & ghost mode aktif
    if (username === currentUser.username && currentUser.settings.ghostMode) displayName = "Hamba Kerajaan";
    
    // Cari Rank untuk warna chat
    let rank = 'rank-peasant';
    if(username === currentUser.username) rank = currentUser.rank; 
    
    addChatMessage(displayName, amount, rank);
    playSound('coin');

    // Anti-Sniping: Tambah waktu jika < 30 detik
    const now = new Date().getTime();
    const end = new Date(currentItem.endTime).getTime();
    if (end - now < 30000) {
        currentItem.endTime = new Date(end + 60000).toISOString();
        addSystemMessage("⏱️ Waktu diperpanjang (Anti-Sniping)");
    }

    // Trigger Auto Bid Saya (Jika saya di-outbid)
    if (username !== currentUser.username && isAutoBidActive) {
        checkAutoBidTrigger();
    }
}

/* --- 5. FITUR AUTO BID (PROXY) --- */
window.toggleAutoBidUI = function(show) {
    document.getElementById('autoBidPanel').style.display = show ? 'block' : 'none';
};

window.activateAutoBid = function() {
    const max = parseInt(document.getElementById('autoBidMax').value);
    if(!max || max <= currentItem.currentBid) {
        showToast("Limit harus lebih tinggi dari harga sekarang.", "error");
        return;
    }
    userAutoBidMax = max;
    isAutoBidActive = true;
    showToast("🤖 Auto-Bid Aktif!", "success");
    toggleAutoBidUI(false);
    
    // Cek langsung, siapa tau harga sekarang masih dibawah limit
    checkAutoBidTrigger();
};

function checkAutoBidTrigger() {
    if (currentItem.highestBidder !== currentUser.username && currentItem.currentBid < userAutoBidMax) {
        // Delay reaksi manusiawi (1-2 detik)
        setTimeout(() => {
            // Bid sedikit di atas lawan
            const increment = 1000000; 
            const nextBid = currentItem.currentBid + increment;
            
            if (nextBid <= userAutoBidMax) {
                executeBid(currentUser.username, nextBid, true);
                showToast("🤖 Auto-Bid membalas tawaran!", "gold");
            } else {
                isAutoBidActive = false;
                showToast("⚠️ Auto-Bid berhenti (Limit tercapai).", "error");
            }
        }, 1500);
    }
}

/* --- 6. BOT V3 (SMART AGGRESSION) --- */
function startSmartBotSimulation() {
    const bots = [
        { name: 'Elon_Musk', rank: 'rank-emperor', aggression: 0.9 },
        { name: 'Sultan_Brunei', rank: 'rank-king', aggression: 0.7 },
        { name: 'Mr_Beast', rank: 'rank-duke', aggression: 0.4 }
    ];

    botInterval = setInterval(() => {
        if(currentItem.status !== 'active') return;

        // Bot Logic: Semakin sedikit waktu, semakin agresif
        const now = new Date().getTime();
        const end = new Date(currentItem.endTime).getTime();
        const timeLeft = end - now;
        
        let chance = 0.3; // Base chance 30%
        if (timeLeft < 60000) chance = 0.8; // 80% chance di menit terakhir

        if (Math.random() < chance) {
            const bot = bots[Math.floor(Math.random() * bots.length)];
            
            // Jangan bid jika bot ini sdh tertinggi
            if (currentItem.highestBidder === bot.name) return;

            const increment = 1000000 * Math.floor(Math.random() * 5 + 1);
            const bidAmount = currentItem.currentBid + increment;
            
            // Simulasi Bid
            currentItem.currentBid = bidAmount;
            currentItem.highestBidder = bot.name;
            
            updatePriceDisplay();
            addChatMessage(bot.name, bidAmount, bot.rank);
            playSound('coin');
            
            // Trigger Auto Bid User
            if (isAutoBidActive) checkAutoBidTrigger();
        }
    }, 5000);
}

/* --- 7. REMOTE CONTROL RECEIVER (V3 MULTI-ROOM) --- */
window.addEventListener('storage', (event) => {
    
    // A. Sinyal STATUS (Live/Pause/Sold)
    if (event.key === 'auction_cmd_status') {
        const data = event.newValue.split('|'); // ID|STATUS|TIME
        const targetId = parseInt(data[0]);
        const status = data[1];

        // HANYA bereaksi jika ID cocok dengan room ini
        if (targetId === currentItem.id) {
            if (status === 'SOLD') {
                finishAuction();
            } else if (status === 'PAUSED') {
                clearInterval(timerInterval);
                document.getElementById('countdownTimer').innerText = "PAUSED";
                document.getElementById('countdownTimer').style.color = "gold";
                showToast("⏸️ Lelang di-jeda oleh Admin.", "warning");
            } else if (status === 'LIVE') {
                startAuctionTimer();
                showToast("▶️ Lelang dilanjutkan!", "success");
            }
        }
    }

    // B. Sinyal NARATOR (Chat)
    if (event.key === 'auction_cmd_chat') {
        const data = event.newValue.split('|'); // ID|MSG|TIME
        const targetId = parseInt(data[0]);
        const msg = data[1];

        if (targetId === currentItem.id) {
            addNarratorMessage(msg);
        }
    }
});

function addNarratorMessage(msg) {
    const container = document.getElementById('chatContainer');
    const div = document.createElement('div');
    
    // Style Narator Spesial
    div.className = 'chat-msg fade-in';
    div.style.border = '1px solid var(--gold-primary)';
    div.style.background = 'rgba(212, 175, 55, 0.1)';
    div.style.color = 'var(--gold-primary)';
    div.style.textAlign = 'center';
    div.style.fontWeight = 'bold';
    div.style.fontFamily = 'Share Tech Mono';
    
    div.innerHTML = `🎙️ JURU LELANG: "${msg}"`;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    playSound('coin'); // Audio attention
}

/* --- UTILS --- */
function finishAuction(skipAnim = false) {
    clearInterval(timerInterval);
    clearInterval(botInterval);
    
    document.getElementById('countdownTimer').innerText = "SOLD OUT";
    
    const overlay = document.getElementById('winnerOverlay');
    document.getElementById('winnerName').innerText = currentItem.highestBidder;
    overlay.style.display = 'flex'; // CSS V2 handle animasi pop-in

    if(!skipAnim) playSound('win');

    // Disable Buttons
    document.querySelectorAll('button').forEach(b => b.disabled = true);
}

function addChatMessage(name, amount, rank) {
    const container = document.getElementById('chatContainer');
    let nameClass = 'text-white';
    
    // Rank Colors
    if(rank.includes('emperor')) nameClass = 'name-glow-gold';
    if(rank.includes('king')) nameClass = 'name-glow-fire';
    if(rank.includes('duke')) nameClass = 'name-glow-diamond';

    const div = document.createElement('div');
    div.className = 'chat-msg fade-in';
    div.innerHTML = `<span class="chat-user ${nameClass}">${name}:</span> <span class="chat-val">${KingdomDB.formatRupiah(amount)}</span>`;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function addSystemMessage(text) {
    const container = document.getElementById('chatContainer');
    const div = document.createElement('div');
    div.className = 'chat-msg system';
    div.innerText = text;
    container.appendChild(div);
}

function checkSecurityClearance() {
    // Mapping Rank to Level
    const rankLevels = { 'rank-peasant':0, 'rank-knight':0, 'rank-noble':0, 'rank-duke':1, 'rank-royal':1, 'rank-king':2, 'rank-emperor':3 };
    const accessLevels = { 'public':0, 'vip':1, 'vvip':2 };

    const userLv = rankLevels[currentUser.rank] || 0;
    const itemLv = accessLevels[currentItem.access] || 0;

    if (userLv < itemLv) {
        document.getElementById('securityOverlay').style.display = 'flex';
        const req = itemLv === 2 ? "KING / EMPEROR" : "DUKE / ROYAL";
        document.getElementById('requiredRankName').innerText = req;
        return false;
    }
    return true;
}

function getCurrentFee() {
    return KingdomDB.getRankInfo(currentUser.rank).fee * 100;
}

function playSound(type) {
    const audio = document.getElementById(type === 'coin' ? 'sfxCoin' : type === 'win' ? 'sfxWin' : 'sfxGavel');
    if(audio) { audio.currentTime = 0; audio.play().catch(()=>{}); }
}