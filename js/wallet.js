/* =========================================
   🏦 ROYAL WALLET ENGINE (FIXED UX)
   Menangani: Select & Scroll, Transaksi, Voucher
   ========================================= */

let currentUser = null;
let currentTransType = '';

document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('kingdom_logged_in'));
    if (!session) { window.location.href = 'auth/login.html'; return; }
    
    currentUser = KingdomDB.getUser(session.username);
    renderWalletUI();
    
    window.onclick = function(e) {
        if (e.target == document.getElementById('transModal')) closeTransModal();
    };
});

/* --- A. UI & RENDER --- */
function renderWalletUI() {
    document.getElementById('cardHolderName').innerText = currentUser.name;
    document.getElementById('cardBalanceDisplay').innerText = KingdomDB.formatRupiah(currentUser.saldo);
    if(document.getElementById('myReferralCode')) {
        document.getElementById('myReferralCode').innerText = currentUser.referralCode || 'GEN-ERR';
    }
    renderMutationTable();
}

function renderMutationTable() {
    const tbody = document.getElementById('mutationTableBody');
    const history = currentUser.walletHistory || [];
    tbody.innerHTML = '';

    if(history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Belum ada transaksi.</td></tr>';
        return;
    }

    [...history].reverse().slice(0, 50).forEach(t => {
        let color = t.type === 'in' ? 'trans-in' : 'trans-out';
        let sign = t.type === 'in' ? '+' : '-';
        if (t.category === 'Voucher') color = 'text-gold';

        tbody.innerHTML += `
            <tr class="fade-in">
                <td style="color:#888; font-size:0.8rem;">${t.date}</td>
                <td style="font-weight:bold;">${t.category}</td>
                <td>${t.desc}</td>
                <td class="${color}" style="font-family:'Share Tech Mono'; font-size:1rem;">
                    ${sign} ${KingdomDB.formatRupiah(t.amount)}
                </td>
            </tr>`;
    });
}

/* --- B. UX INTERACTION (SELECT & SCROLL) --- */
// Fungsi baru untuk memilih nominal Top Up
window.selectTopUp = function(element, value) {
    // 1. Reset semua pilihan
    document.querySelectorAll('.btn-topup-option').forEach(el => el.classList.remove('selected'));
    
    // 2. Highlight yang dipilih
    element.classList.add('selected');
    
    // 3. Simpan nilai ke hidden input
    document.getElementById('selectedTopUpValue').value = value;
    
    // 4. Aktifkan Tombol Proses
    const btn = document.getElementById('btnProcess');
    btn.classList.add('ready');
    btn.innerText = `KONFIRMASI: ${KingdomDB.formatRupiah(value)}`;
    
    // 5. AUTO SCROLL KE BAWAH (Smooth)
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

/* --- C. MODAL LOGIC --- */
window.openModal = function(type) {
    currentTransType = type;
    const modal = document.getElementById('transModal');
    const btn = document.getElementById('btnProcess');
    
    modal.style.display = 'flex';
    
    // Reset UI State
    document.querySelectorAll('.btn-topup-option').forEach(el => el.classList.remove('selected'));
    document.getElementById('transAmount').value = '';
    document.getElementById('transferTarget').value = '';
    document.getElementById('voucherCode').value = '';
    
    // Tampilkan area sesuai tipe
    const topupArea = document.getElementById('topupOptionsArea');
    const manualArea = document.getElementById('manualInputArea');
    const transferInput = document.getElementById('transferInputArea');
    const voucherInput = document.getElementById('voucherInputArea');
    const amountWrapper = document.getElementById('amountInputWrapper');

    // Default: Hide all
    topupArea.style.display = 'none';
    manualArea.style.display = 'none';
    transferInput.style.display = 'none';
    voucherInput.style.display = 'none';
    amountWrapper.style.display = 'none';
    
    // Default Button State
    btn.classList.add('ready'); // Default nyala untuk manual input
    btn.innerText = "PROSES SEKARANG ➤";

    if (type === 'deposit') {
        document.getElementById('modalTitle').innerText = "DEPOSIT DANA";
        topupArea.style.display = 'block'; // Tampilkan Grid Pilihan
        btn.classList.remove('ready'); // Matikan tombol sampai user memilih
        btn.innerText = "PILIH NOMINAL DI ATAS";
    } 
    else if (type === 'withdraw') {
        document.getElementById('modalTitle').innerText = "TARIK TUNAI";
        manualArea.style.display = 'block';
        amountWrapper.style.display = 'block';
    }
    else if (type === 'transfer') {
        document.getElementById('modalTitle').innerText = "TRANSFER SULTAN";
        manualArea.style.display = 'block';
        transferInput.style.display = 'block';
        amountWrapper.style.display = 'block';
    }
    else if (type === 'voucher') {
        document.getElementById('modalTitle').innerText = "KLAIM VOUCHER";
        manualArea.style.display = 'block';
        voucherInput.style.display = 'block';
    }
};

window.closeTransModal = function() {
    document.getElementById('transModal').style.display = 'none';
};

/* --- D. TRANSACTION PROCESSING --- */
window.processTransaction = function() {
    const date = new Date().toLocaleString();

    // 1. DEPOSIT (Ambil dari hidden value)
    if (currentTransType === 'deposit') {
        const val = parseInt(document.getElementById('selectedTopUpValue').value);
        if (!val || val <= 0) { showToast("Pilih nominal dulu!", "error"); return; }
        
        currentUser.saldo += val;
        currentUser.walletHistory.push({ type: 'in', category: 'Deposit', desc: 'Top Up ATM', amount: val, date: date });
        finishTrans("Deposit Berhasil!");
    }

    // 2. VOUCHER
    else if (currentTransType === 'voucher') {
        const code = document.getElementById('voucherCode').value.toUpperCase().trim();
        if (!code) { showToast("Masukkan kode!", "error"); return; }
        
        const res = KingdomDB.redeemVoucher(currentUser.username, code);
        if(res.success) finishTrans(res.msg, "gold");
        else showToast(res.msg, "error");
    }

    // 3. MANUAL (Transfer/Withdraw)
    else {
        const amount = parseInt(document.getElementById('transAmount').value);
        if (!amount || amount <= 0) { showToast("Nominal tidak valid!", "error"); return; }

        if (currentTransType === 'withdraw') {
            if (currentUser.saldo < amount) { showToast("Saldo kurang!", "error"); return; }
            currentUser.saldo -= amount;
            currentUser.walletHistory.push({ type: 'out', category: 'Withdraw', desc: 'Penarikan', amount: amount, date: date });
            finishTrans("Penarikan Sukses.");
        }
        
        else if (currentTransType === 'transfer') {
            const targetName = document.getElementById('transferTarget').value.trim();
            if (!targetName) { showToast("Isi tujuan!", "error"); return; }
            if (currentUser.saldo < amount) { showToast("Saldo kurang!", "error"); return; }

            const users = KingdomDB.getUsers();
            const targetUser = users.find(u => u.username === targetName);
            if (!targetUser) { showToast("User tidak ditemukan!", "error"); return; }

            // Eksekusi P2P
            currentUser.saldo -= amount;
            currentUser.walletHistory.push({ type: 'out', category: 'Transfer', desc: `Ke @${targetName}`, amount: amount, date: date });
            
            targetUser.saldo += amount;
            targetUser.walletHistory.push({ type: 'in', category: 'Transfer', desc: `Dari @${currentUser.username}`, amount: amount, date: date });
            
            // Save Target
            const tIdx = users.findIndex(u => u.username === targetUser.username);
            users[tIdx] = targetUser;
            localStorage.setItem('kingdom_users', JSON.stringify(users));

            finishTrans(`Terkirim ke ${targetName}!`);
        }
    }
};

function finishTrans(msg, type="success") {
    KingdomDB.saveUser(currentUser);
    // Update Session
    localStorage.setItem('kingdom_logged_in', JSON.stringify(currentUser));
    
    showToast(msg, type);
    closeTransModal();
    renderWalletUI();
}

// Helper Toast
function showToast(msg, type) {
    // Panggil fungsi global.js jika ada, atau alert biasa
    if (window.showToastGlobal) window.showToastGlobal(msg, type);
    else alert(msg);
}