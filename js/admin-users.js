/* =========================================
   👥 ADMIN USER MANAGEMENT (CENSUS BUREAU)
   Menangani: Audit User, Ban, Denda, & Statistik Populasi
   ========================================= */

let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. SECURITY CHECK
    const session = JSON.parse(localStorage.getItem('kingdom_logged_in'));
    if (!session || session.role !== 'admin') {
        alert("⛔ AKSES DITOLAK");
        window.location.href = '../auth/login.html';
        return;
    }

    // 2. LOAD DATA
    loadAndRenderUsers();
});

/* --- A. RENDER TABEL & STATISTIK --- */
function loadAndRenderUsers() {
    allUsers = KingdomDB.getUsers();
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';

    let countTotal = 0;
    let countRich = 0; // Saldo > 1 Miliar
    let countVip = 0; // Rank Duke ke atas
    let countPending = 0; // Belum verifikasi KTP
    let totalEconomy = 0; // Total uang beredar

    // Sortir berdasarkan Saldo Tertinggi (Whale First)
    const sortedUsers = [...allUsers].sort((a, b) => b.saldo - a.saldo);

    sortedUsers.forEach((user) => {
        if (user.role === 'admin') return; // Sembunyikan akun admin

        // Hitung Statistik
        countTotal++;
        totalEconomy += user.saldo;
        if (!user.verified) countPending++;
        if (user.saldo > 1000000000) countRich++;
        if (['rank-duke','rank-royal','rank-king','rank-emperor'].includes(user.rank)) countVip++;

        // Hitung Net Worth (Saldo + Aset Barang di History)
        const assetsVal = (user.history || []).reduce((sum, item) => sum + item.price, 0);
        const netWorth = user.saldo + assetsVal;

        // Styling Rank Badge
        let rankClass = 'badge-peasant';
        if(user.rank.includes('knight')) rankClass = 'badge-knight';
        if(user.rank.includes('noble')) rankClass = 'badge-noble';
        if(user.rank.includes('duke')) rankClass = 'badge-duke';
        if(user.rank.includes('royal')) rankClass = 'badge-royal';
        if(user.rank.includes('king')) rankClass = 'badge-king';
        if(user.rank.includes('emperor')) rankClass = 'badge-emperor';

        const rankName = user.rank.replace('rank-', '').toUpperCase();
        const verifyIcon = user.verified ? '✅' : '⏳';
        
        // Data Intelijen
        const friendCount = user.friends ? user.friends.length : 0;
        const refCode = user.referralCode || '-';
        const voucherCount = user.usedVouchers ? user.usedVouchers.length : 0;

        const row = `
            <tr class="user-row fade-in">
                <td style="width: 280px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${user.avatar || '../assets/images/avatars/default.png'}" class="user-avatar-small" onerror="this.src='../assets/images/avatars/default.png'">
                        <div>
                            <div style="font-weight:bold; color:white;">${user.name}</div>
                            <div style="font-size:0.8rem; color:#666; display:flex; align-items:center; gap:5px;">
                                @${user.username} 
                                <span title="Status KTP">${verifyIcon}</span>
                            </div>
                            <div class="user-details-sub" title="Kode Referral">
                                🎟️ ${refCode}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge-rank ${rankClass}">${rankName}</span>
                    <div style="font-size:0.75rem; color:#666; margin-top:5px;">
                        Joined: ${new Date(user.createdAt).toLocaleDateString()}
                    </div>
                </td>
                <td>
                    <div style="font-size:0.75rem; color:#888;">Cash:</div>
                    <div class="text-gold" style="font-weight:bold;">${KingdomDB.formatRupiah(user.saldo)}</div>
                    
                    <div style="font-size:0.75rem; color:#888; margin-top:4px;">Net Worth:</div>
                    <div class="net-worth-val">${KingdomDB.formatRupiah(netWorth)}</div>
                </td>
                <td>
                    <div class="user-details-sub" style="flex-direction:column; gap:4px;">
                        <span>🤝 Teman: <strong style="color:white">${friendCount}</strong></span>
                        <span>🎁 Voucher: <strong style="color:white">${voucherCount}</strong></span>
                        <span>📦 Aset: <strong style="color:white">${(user.history || []).length} item</strong></span>
                    </div>
                </td>
                <td>
                    <div style="display:flex; gap:5px; flex-wrap:wrap; max-width:180px;">
                        ${!user.verified ? `<button onclick="actionVerify('${user.username}')" class="btn-mini btn-verify">ACC KTP</button>` : ''}
                        
                        <button onclick="actionSeize('${user.username}')" class="btn-mini btn-seize" title="Tarik Paksa Saldo">DENDA</button>
                        
                        <button onclick="actionReset('${user.username}')" class="btn-mini btn-reset">RESET PW</button>
                        
                        <button onclick="actionBan('${user.username}')" class="btn-mini btn-ban">BAN</button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    // Update Statistik Dashboard
    animateValue('statTotal', countTotal);
    animateValue('statRich', countRich);
    animateValue('statVip', countVip);
    animateValue('statPending', countPending);
    
    // Update Total Ekonomi di Title (Optional)
    // document.getElementById('totalMoney').innerText = formatCompact(totalEconomy);
}

/* --- B. FILTER SEARCH --- */
function filterUsers() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('.user-row');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(input) ? '' : 'none';
    });
}

/* --- C. ADMIN ACTIONS (GOD MODE) --- */

// 1. Verifikasi Manual
window.actionVerify = function(username) {
    if(!confirm(`Verifikasi KTP user @${username}?`)) return;
    
    const user = KingdomDB.getUser(username);
    if (user) {
        user.verified = true;
        KingdomDB.saveUser(user);
        alert(`✅ ${username} berhasil diverifikasi.`);
        loadAndRenderUsers();
    }
};

// 2. Reset Password
window.actionReset = function(username) {
    if(!confirm(`Reset password @${username} menjadi '123456'?`)) return;
    
    const user = KingdomDB.getUser(username);
    if(user) {
        user.password = '123456';
        KingdomDB.saveUser(user);
        alert("🔑 Password telah direset ke '123456'.");
    }
};

// 3. Ban Hammer (Hapus Akun)
window.actionBan = function(username) {
    const reason = prompt(`Masukkan alasan pemblokiran untuk @${username}:`, "Pelanggaran Aturan Komunitas");
    if(!reason) return;
    
    let users = KingdomDB.getUsers();
    users = users.filter(u => u.username !== username);
    localStorage.setItem('kingdom_users', JSON.stringify(users));
    
    alert(`🚫 User @${username} telah dihapus dari database.\nAlasan: ${reason}`);
    loadAndRenderUsers();
};

// 4. Seize Asset (Denda/Sita Uang)
window.actionSeize = function(username) {
    const amountStr = prompt(`Masukkan jumlah denda (Rp) yang akan ditarik dari @${username}:`, "10000000");
    if(!amountStr) return;
    
    const amount = parseInt(amountStr);
    if(!amount || amount <= 0) { alert("Nominal tidak valid."); return; }

    const user = KingdomDB.getUser(username);
    
    // Cek apakah saldo cukup (Admin bisa bikin saldo minus kalau mau kejam, tapi kita batasi 0)
    if(user.saldo < amount) {
        if(!confirm(`Saldo user hanya ${KingdomDB.formatRupiah(user.saldo)}. Tarik semua yang ada?`)) return;
        // Tarik sisa saldo
        const seized = user.saldo;
        user.saldo = 0;
        recordSeize(user, seized);
    } else {
        user.saldo -= amount;
        recordSeize(user, amount);
    }
};

function recordSeize(user, amount) {
    user.walletHistory.push({
        type: 'out', category: 'Fine', 
        desc: 'Penyitaan Aset oleh Admin (Denda)', amount: amount, 
        date: new Date().toLocaleString()
    });
    KingdomDB.saveUser(user);
    alert(`💸 Berhasil menarik ${KingdomDB.formatRupiah(amount)} dari dompet @${user.username}.`);
    loadAndRenderUsers();
}

/* --- D. UTILITIES --- */
function formatCompact(num) {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(1) + 'T';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'M';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'jt';
    return num.toLocaleString();
}

function animateValue(id, end) {
    const obj = document.getElementById(id);
    if(!obj) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(end / 20));
    const timer = setInterval(() => {
        current += step;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        obj.innerText = current;
    }, 30);
}