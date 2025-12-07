/* =========================================
   🛍️ STORE LOGIC ENGINE (ULTIMATE V3.0)
   Menangani: Render Produk Visual, Stock Meter, & Transaksi
   ========================================= */

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. SECURITY CHECK
    const session = JSON.parse(localStorage.getItem('kingdom_logged_in'));
    if (!session) {
        showToast("Silakan login untuk berbelanja.", "error");
        setTimeout(() => window.location.href = 'auth/login.html', 1500);
        return;
    }

    // 2. LOAD DATA
    currentUser = KingdomDB.getUser(session.username);
    
    // 3. RENDER UI COMPONENTS
    updateBalanceUI();
    renderRankShowcase();
    renderCosmeticGrid();

    // Setup Modal Listener
    window.onclick = function(e) {
        const modal = document.getElementById('topUpModal');
        if (e.target == modal) closeTopUpModal();
    };
});

/* --- A. MANAJEMEN SALDO --- */
function updateBalanceUI() {
    const el = document.getElementById('userBalanceDisplay');
    if(el) {
        el.innerText = KingdomDB.formatRupiah(currentUser.saldo);
        // Efek Flash Emas saat saldo berubah
        el.style.textShadow = "0 0 20px #ffd700";
        setTimeout(() => el.style.textShadow = "0 0 10px rgba(212, 175, 55, 0.3)", 500);
    }
}

/* --- B. RANK SYSTEM (HORIZONTAL SCROLL) --- */
function renderRankShowcase() {
    const container = document.getElementById('rankContainer');
    container.innerHTML = ''; 

    // Urutkan Rank dari Murah ke Mahal
    const ranks = Object.values(KingdomDB.ranks).sort((a, b) => a.price - b.price);
    const currentRankIndex = ranks.findIndex(r => r.id === currentUser.rank);

    ranks.forEach((rank, index) => {
        if (rank.id === 'rank-peasant') return; // Skip default rank

        // Logic Tombol
        let btnState = '';
        let cardStyle = 'rank-card glass-panel';
        
        if (index <= currentRankIndex) {
            // Sudah punya
            btnState = `<button class="btn-buy" disabled style="border-color:#00ff88; color:#00ff88; background:rgba(0,255,136,0.1);">✓ DIMILIKI</button>`;
        } else {
            // Bisa beli
            btnState = `<button class="btn-buy" onclick="purchaseRank('${rank.id}', ${rank.price}, '${rank.name}')">UPGRADE</button>`;
        }

        // Highlight VVIP
        if (['rank-king', 'rank-emperor'].includes(rank.id)) {
            cardStyle += ' premium';
        }

        // Format Fitur
        const fee = Math.round(rank.fee * 100);
        const access = (rank.id.includes('king') || rank.id.includes('emperor')) ? 'VVIP Access' : 'VIP Access';

        container.innerHTML += `
            <div class="${cardStyle}" style="min-width: 260px;">
                <img src="${rank.image || 'assets/ui/crown.svg'}" class="rank-icon" onerror="this.src='assets/ui/crown.svg'">
                <h3 class="rank-title">${rank.name}</h3>
                <div class="rank-price">${KingdomDB.formatRupiah(rank.price)}</div>
                
                <ul class="rank-features">
                    <li>Fee: ${fee}%</li>
                    <li>Room: ${access}</li>
                    <li>Credit: ${rank.limit === 0 ? 'No' : 'Active'}</li>
                </ul>
                
                <div style="margin-top:auto;">${btnState}</div>
            </div>
        `;
    });
}

window.purchaseRank = function(rankId, price, rankName) {
    if (currentUser.saldo < price) {
        showToast("Saldo tidak cukup!", "error");
        return;
    }
    if (!confirm(`Upgrade ke ${rankName}?`)) return;

    currentUser.saldo -= price;
    currentUser.rank = rankId;
    
    currentUser.walletHistory.push({
        type: 'out', category: 'Rank', desc: `Upgrade: ${rankName}`, amount: price, date: new Date().toLocaleString()
    });

    KingdomDB.saveUser(currentUser);
    showToast(`Selamat! Anda naik pangkat ke ${rankName}.`, "gold");
    
    // Reload untuk update semua tampilan
    setTimeout(() => location.reload(), 1000);
};

/* --- C. COSMETIC GRID (WITH STOCK METER) --- */
function renderCosmeticGrid() {
    const container = document.getElementById('cosmeticContainer');
    const items = KingdomDB.getStoreItems();
    
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#888;">Stok Toko Kosong.</p>`;
        return;
    }

    items.forEach(item => {
        const isOwned = currentUser.inventory.includes(item.id);
        const isSoldOut = item.isLimited && item.stock !== null && item.stock <= 0;

        // Button Logic
        let btnHTML = `<button class="btn-buy" onclick="purchaseCosmetic('${item.id}')">BELI</button>`;
        if (isOwned) btnHTML = `<button class="btn-buy" disabled style="border-color:#555; color:#888;">DIMILIKI</button>`;
        else if (isSoldOut) btnHTML = `<button class="btn-buy" disabled style="background:#333; border:none; color:#aaa;">SOLD OUT</button>`;

        // Badge Limited
        let badgeHTML = '';
        let stockBarHTML = '';

        if (item.isLimited) {
            badgeHTML = `<div class="badge-limited">Sisa: ${item.stock}</div>`;
            
            // Visual Stock Bar (Max asumsi 10 unit untuk visual penuh)
            const widthPercent = Math.min(100, (item.stock / 10) * 100);
            const colorBar = item.stock < 3 ? '#ff0000' : '#ff4444'; // Merah terang jika kritis
            
            if (!isSoldOut && !isOwned) {
                stockBarHTML = `
                    <div class="stock-bar-bg">
                        <div class="stock-bar-fill" style="width:${widthPercent}%; background:${colorBar};"></div>
                    </div>
                    <small style="color:${colorBar}; font-size:0.7rem;">Stok menipis!</small>
                `;
            }
        }

        container.innerHTML += `
            <div class="item-card glass-panel fade-in">
                ${badgeHTML}
                <div class="item-preview-box">
                    <img src="${item.image}" class="item-img" alt="${item.name}">
                </div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.desc || 'Item Langka.'}</div>
                    
                    <div style="margin-top:auto; width:100%;">
                        ${stockBarHTML}
                        <div class="item-price text-gold" style="margin-top:10px;">
                            ${KingdomDB.formatRupiah(item.price)}
                        </div>
                        ${btnHTML}
                    </div>
                </div>
            </div>
        `;
    });
}

window.purchaseCosmetic = function(itemId) {
    if (!confirm("Beli item ini?")) return;
    
    // Panggil Logic DB
    const result = KingdomDB.buyItem(currentUser.username, itemId);
    
    if (result.success) {
        showToast(result.msg, "success");
        currentUser = KingdomDB.getUser(currentUser.username);
        
        updateBalanceUI();
        renderCosmeticGrid(); // Refresh stok bar
    } else {
        showToast(result.msg, "error");
    }
};

/* --- D. QUICK VOUCHER (HEADER) --- */
window.redeemQuick = function() {
    const input = document.getElementById('quickVoucher');
    const code = input.value.trim().toUpperCase();
    
    if(!code) { showToast("Masukkan kode voucher!", "error"); return; }

    const result = KingdomDB.redeemVoucher(currentUser.username, code);
    
    if(result.success) {
        showToast(result.msg, "gold");
        input.value = '';
        currentUser = KingdomDB.getUser(currentUser.username);
        updateBalanceUI();
    } else {
        showToast(result.msg, "error");
    }
};

/* --- E. TOP UP MODAL --- */
const modal = document.getElementById('topUpModal');
window.openTopUpModal = function() { modal.style.display = 'flex'; };
window.closeTopUpModal = function() { modal.style.display = 'none'; };

window.processTopUp = function(amount) {
    currentUser.saldo += amount;
    currentUser.walletHistory.push({
        type: 'in', category: 'Deposit', desc: 'Top Up Cepat', amount: amount, date: new Date().toLocaleString()
    });
    KingdomDB.saveUser(currentUser);
    
    showToast("Deposit Berhasil!", "success");
    updateBalanceUI();
    closeTopUpModal();
    renderRankList(); // Refresh barangkali sudah bisa beli rank
};