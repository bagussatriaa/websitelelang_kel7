/* =========================================
   👤 PROFILE LOGIC (ULTIMATE V2.0)
   Features: Asset Valuation, Social Network, Equip System
   ========================================= */

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. AUTH CHECK
    const session = JSON.parse(localStorage.getItem('kingdom_logged_in'));
    if (!session) { window.location.href = 'auth/login.html'; return; }

    // 2. LOAD DATA
    currentUser = KingdomDB.getUser(session.username);

    // 3. RENDER ALL TABS
    renderHeaderInfo();
    renderInventory();
    renderVault(); // New Feature
    renderSocial(); // New Feature
    renderBadges();
    loadPrivacySettings();
});

/* =========================================
   A. HEADER & INFO
   ========================================= */
function renderHeaderInfo() {
    // Basic Info
    document.getElementById('displayName').innerHTML = currentUser.name;
    document.getElementById('displayUsername').innerText = currentUser.username;
    document.getElementById('displayBio').innerText = currentUser.bio || '"Belum ada bio."';
    document.getElementById('displayReferral').innerText = currentUser.referralCode || '???';

    // Rank Badge Styling
    const rankName = currentUser.rank.replace('rank-', '').toUpperCase();
    const rankEl = document.getElementById('displayRankName');
    rankEl.innerText = rankName;
    rankEl.className = `stat-value rank-${rankName.toLowerCase()}`;

    // Financial Stats
    document.getElementById('displaySaldo').innerText = KingdomDB.formatRupiah(currentUser.saldo);
    
    // Hitung Net Worth (Saldo + Total Nilai Aset di Vault)
    const assetValue = calculateTotalAssetValue();
    const netWorth = currentUser.saldo + assetValue;
    document.getElementById('displayNetWorth').innerText = KingdomDB.formatRupiah(netWorth);

    // Avatar & Border
    document.getElementById('profileAvatar').src = currentUser.avatar || 'assets/images/avatars/default.png';
    renderActiveBorder();
}

function renderActiveBorder() {
    const borderImg = document.getElementById('profileBorder');
    const borderId = currentUser.activeBorder;
    
    // Cari Item di Store DB
    const storeItems = KingdomDB.getStoreItems();
    let item = storeItems.find(i => i.id === borderId);

    // Fallback Manual jika ID lama
    if (!item) {
        if(borderId === 'border-gold') item = { image: 'assets/borders/gold.png' };
        else if(borderId === 'border-fire') item = { image: 'assets/borders/fire.gif' };
    }

    if (item && item.image && borderId !== 'border-default') {
        borderImg.src = item.image;
        borderImg.style.display = 'block';
        
        // Tambah efek CSS jika ada
        borderImg.className = 'avatar-border'; // Reset
        if(borderId === 'border-fire') borderImg.classList.add('breathing');
    } else {
        borderImg.style.display = 'none';
    }
}

/* =========================================
   B. ROYAL VAULT (ASSET PORTFOLIO)
   ========================================= */
function renderVault() {
    const container = document.getElementById('vaultList');
    const history = currentUser.history || []; // Barang yang dimenangkan

    container.innerHTML = '';

    if (history.length === 0) {
        container.innerHTML = `<p class="empty-msg">Belum ada aset investasi. Menangkan lelang untuk mengisi Vault.</p>`;
        return;
    }

    // Render Kartu Aset
    [...history].reverse().forEach(item => {
        // Simulasi Kenaikan Harga (Market Value)
        // Rumus: Harga Beli + (Random 5% - 20%) untuk simulasi keuntungan
        // Kita gunakan ID item sebagai seed sederhana agar angkanya konsisten per sesi (opsional)
        const profitMargin = 1 + (Math.random() * 0.2); 
        const marketValue = Math.floor(item.price * profitMargin);
        const gain = marketValue - item.price;
        
        const gainClass = gain >= 0 ? 'gain-positive' : 'gain-negative';
        const gainSign = gain >= 0 ? '▲' : '▼';

        container.innerHTML += `
            <div class="vault-card fade-in">
                <img src="${item.image}" class="vault-img" onerror="this.src='assets/images/items/placeholder.png'">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between;">
                        <h4 style="color:white; margin:0;">${item.name}</h4>
                        <span style="font-size:0.8rem; color:#888;">${item.date || 'Lama'}</span>
                    </div>
                    <div style="font-size:0.85rem; color:#aaa; margin-bottom:10px;">Beli: ${KingdomDB.formatRupiah(item.price)}</div>
                    
                    <div style="background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.8rem; color:#ccc;">Valuasi Saat Ini</span>
                        <div style="text-align:right;">
                            <div style="color:white; font-weight:bold;">${KingdomDB.formatRupiah(marketValue)}</div>
                            <div class="${gainClass}" style="font-size:0.75rem;">${gainSign} ${KingdomDB.formatRupiah(gain)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function calculateTotalAssetValue() {
    const history = currentUser.history || [];
    // Asumsi nilai rata-rata naik 10% untuk perhitungan Net Worth Header
    return history.reduce((sum, item) => sum + (item.price * 1.1), 0);
}

/* =========================================
   C. SOCIAL NETWORK (FRIENDS)
   ========================================= */
function renderSocial() {
    const container = document.getElementById('friendListContainer');
    const friends = currentUser.friends || [];

    container.innerHTML = '';

    if (friends.length === 0) {
        container.innerHTML = `<p class="empty-msg">Anda belum memiliki koneksi bangsawan.</p>`;
        return;
    }

    // Ambil data detail teman dari DB
    friends.forEach(friendUsername => {
        const friendData = KingdomDB.getUser(friendUsername);
        if (!friendData) return;

        const rankName = friendData.rank.replace('rank-', '').toUpperCase();

        container.innerHTML += `
            <div class="friend-card fade-in">
                <div class="friend-info">
                    <img src="${friendData.avatar}" class="friend-avatar">
                    <div>
                        <div style="color:white; font-weight:bold;">${friendData.name}</div>
                        <div style="font-size:0.8rem; color:var(--gold-primary);">@${friendData.username} • ${rankName}</div>
                    </div>
                </div>
                <button onclick="removeFriend('${friendUsername}')" class="btn-small-danger" style="padding:5px 10px; font-size:0.7rem;">Hapus</button>
            </div>
        `;
    });
}

window.addFriend = function() {
    const input = document.getElementById('addFriendInput');
    const targetName = input.value.trim();

    if (!targetName) return;
    if (targetName === currentUser.username) { showToast("Tidak bisa menambah diri sendiri.", "error"); return; }
    
    // Cek User Exist
    const targetUser = KingdomDB.getUser(targetName);
    if (!targetUser) { showToast("Sultan tidak ditemukan.", "error"); return; }

    // Cek Duplicate
    if (currentUser.friends && currentUser.friends.includes(targetName)) {
        showToast("Sudah menjadi teman.", "info");
        return;
    }

    // Proses Tambah
    if (!currentUser.friends) currentUser.friends = [];
    currentUser.friends.push(targetName);
    
    KingdomDB.saveUser(currentUser);
    renderSocial();
    input.value = '';
    showToast(`Berhasil menjalin koneksi dengan ${targetUser.name}!`, "success");
};

window.removeFriend = function(targetName) {
    if (!confirm(`Hapus ${targetName} dari daftar teman?`)) return;
    
    currentUser.friends = currentUser.friends.filter(f => f !== targetName);
    KingdomDB.saveUser(currentUser);
    renderSocial();
    showToast("Teman dihapus.", "info");
};

/* =========================================
   D. INVENTORY & EQUIP (Existing Logic)
   ========================================= */
function renderInventory() {
    const grid = document.getElementById('inventoryGrid');
    const storeItems = KingdomDB.getStoreItems();
    const myItems = currentUser.inventory || [];

    grid.innerHTML = '';
    if (myItems.length === 0) {
        grid.innerHTML = `<p class="empty-msg">Tas Kosong.</p>`;
        return;
    }

    myItems.forEach(itemId => {
        let itemData = storeItems.find(i => i.id === itemId);
        // Fallback dummy logic
        if (!itemData) {
            if(itemId === 'border-default') itemData = { name:'Default', type:'border', image:'' };
            else if(itemId.includes('border')) itemData = { name:'Legacy Border', type:'border', image:'assets/borders/gold.png' };
            else return; 
        }

        const isEquipped = currentUser.activeBorder === itemId;
        const activeClass = isEquipped ? 'equipped' : '';
        const checkMark = isEquipped ? '<div class="inv-check">✓</div>' : '';
        const imgDisplay = itemData.image ? `<img src="${itemData.image}" class="inv-img">` : `<div class="inv-img" style="border:1px dashed #555; border-radius:50%"></div>`;

        grid.innerHTML += `
            <div class="inv-card ${activeClass}" onclick="equipItem('${itemId}', '${itemData.type}')">
                ${checkMark}
                ${imgDisplay}
                <h4>${itemData.name}</h4>
                <small>${isEquipped ? 'Terpasang' : 'Pasang'}</small>
            </div>
        `;
    });
}

window.equipItem = function(itemId, type) {
    if (type !== 'border') { showToast("Item ini bukan bingkai.", "error"); return; }
    currentUser.activeBorder = itemId;
    KingdomDB.saveUser(currentUser);
    renderHeaderInfo();
    renderInventory();
    showToast("Tampilan diperbarui!", "success");
};

/* =========================================
   E. UTILITIES (Settings, Edit, Tabs)
   ========================================= */
function renderBadges() {
    const grid = document.getElementById('badgesGrid');
    const allAchv = JSON.parse(localStorage.getItem('kingdom_achv')) || [];
    const myBadges = currentUser.badges || [];

    grid.innerHTML = '';
    allAchv.forEach(achv => {
        const unlocked = myBadges.includes(achv.id);
        const style = unlocked ? '' : 'opacity:0.3; filter:grayscale(100%);';
        grid.innerHTML += `
            <div class="inv-card" style="${style} cursor:default;">
                <img src="${achv.image}" class="inv-img" onerror="this.src='assets/ui/badge_placeholder.png'">
                <h4>${achv.title}</h4>
                <small>${achv.desc}</small>
                <div style="color:${unlocked ? '#00ff88' : '#666'}; font-size:0.7rem; font-weight:bold; margin-top:5px;">
                    ${unlocked ? 'TERBUKA' : 'TERKUNCI'}
                </div>
            </div>
        `;
    });
}

function loadPrivacySettings() {
    if (currentUser.settings) {
        document.getElementById('toggleGhost').checked = currentUser.settings.ghostMode;
        document.getElementById('toggleNetWorth').checked = currentUser.settings.showNetWorth;
    }
}

window.updatePrivacy = function() {
    currentUser.settings = {
        ghostMode: document.getElementById('toggleGhost').checked,
        showNetWorth: document.getElementById('toggleNetWorth').checked,
        showHistory: true
    };
    KingdomDB.saveUser(currentUser);
    showToast("Privasi disimpan.", "info");
};

// Modal & Edit Logic
window.openEditModal = function() {
    document.getElementById('editModal').style.display = 'flex';
    document.getElementById('editNameInput').value = currentUser.name;
    document.getElementById('editBioInput').value = currentUser.bio || '';
};
window.closeEditModal = function() { document.getElementById('editModal').style.display = 'none'; };

document.getElementById('editProfileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    currentUser.name = document.getElementById('editNameInput').value;
    currentUser.bio = document.getElementById('editBioInput').value;
    
    const file = document.getElementById('editAvatarFile').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            currentUser.avatar = evt.target.result;
            saveAndFinish();
        };
        reader.readAsDataURL(file);
    } else {
        saveAndFinish();
    }

    function saveAndFinish() {
        KingdomDB.saveUser(currentUser);
        renderHeaderInfo();
        closeEditModal();
        showToast("Profil diperbarui.", "success");
    }
});

// Tab Switcher
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    
    // Highlight button simple logic
    const btns = document.querySelectorAll('.tab-btn');
    const mapping = ['inventory', 'vault', 'social', 'badges', 'settings'];
    btns[mapping.indexOf(tabName)].classList.add('active');
};

window.onclick = function(e) { if(e.target == document.getElementById('editModal')) closeEditModal(); };