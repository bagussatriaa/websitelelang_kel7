/* =========================================
   🛍️ ADMIN STORE LOGIC (ULTIMATE V2.0)
   Menangani: Upload Kosmetik & Manajemen Voucher
   ========================================= */

let finalStoreImage = ''; // Wadah Base64 Gambar Item

document.addEventListener('DOMContentLoaded', () => {
    // 1. KEAMANAN
    checkAdminAccess();

    // 2. SETUP KOSMETIK (ITEMS)
    setupStorePreview();
    setupStoreImageUpload();
    setupStoreSubmit();
    
    // 3. SETUP VOUCHER
    setupVoucherSubmit();

    // 4. LOAD DATA AWAL
    renderStoreTable();
    renderVoucherTable();
});

/* --- A. FUNGSI KEAMANAN --- */
function checkAdminAccess() {
    const session = JSON.parse(localStorage.getItem('kingdom_logged_in'));
    if (!session || session.role !== 'admin') {
        alert("⛔ AKSES DITOLAK.");
        window.location.href = '../auth/login.html';
        throw new Error("Unauthorized");
    }
}

/* =========================================
   BAGIAN 1: MANAJEMEN KOSMETIK (ITEM)
   ========================================= */

function setupStorePreview() {
    // Nama Item
    document.getElementById('itemName').addEventListener('input', function(e) {
        document.getElementById('previewName').innerText = e.target.value || 'Nama Item';
    });

    // Harga
    document.getElementById('itemPrice').addEventListener('input', function(e) {
        const val = parseInt(e.target.value) || 0;
        document.getElementById('previewPrice').innerText = KingdomDB.formatRupiah(val);
    });

    // Limited Checkbox
    document.getElementById('checkLimited').addEventListener('change', function(e) {
        const stockArea = document.getElementById('stockInputArea');
        const badge = document.getElementById('previewStock');
        
        if (this.checked) {
            stockArea.style.display = 'block';
            badge.style.display = 'inline-block';
            badge.innerText = "Limited: " + (document.getElementById('itemStock').value || 0);
        } else {
            stockArea.style.display = 'none';
            badge.style.display = 'none';
        }
    });

    document.getElementById('itemStock').addEventListener('input', function(e) {
        if (document.getElementById('checkLimited').checked) {
            document.getElementById('previewStock').innerText = "Limited: " + e.target.value;
        }
    });
}

function setupStoreImageUpload() {
    const imgInput = document.getElementById('itemImg');
    const previewBorder = document.getElementById('previewBorderDisplay');

    imgInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB Limit
                alert("⚠️ File terlalu besar! Maksimal 1MB.");
                this.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                finalStoreImage = e.target.result;
                previewBorder.src = finalStoreImage;
                previewBorder.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });
}

function setupStoreSubmit() {
    document.getElementById('addStoreItemForm').addEventListener('submit', function(e) {
        e.preventDefault();

        if (!finalStoreImage) { alert("⚠️ Wajib upload gambar item!"); return; }

        const name = document.getElementById('itemName').value;
        const type = document.getElementById('itemType').value;
        const price = parseInt(document.getElementById('itemPrice').value);
        const desc = document.getElementById('itemDesc').value;
        const isLimited = document.getElementById('checkLimited').checked;
        
        let stock = null;
        if (isLimited) {
            stock = parseInt(document.getElementById('itemStock').value);
            if (!stock || stock < 1) { alert("⚠️ Stok minimal 1!"); return; }
        }

        const newItem = {
            id: type + '-' + Date.now(), 
            name: name,
            type: type,
            price: price,
            image: finalStoreImage,
            desc: desc,
            isLimited: isLimited,
            stock: stock
        };

        KingdomDB.addStoreItem(newItem);
        alert(`✅ ${name} berhasil ditambahkan!`);
        
        this.reset();
        resetPreview();
        renderStoreTable();
    });
}

function renderStoreTable() {
    const tbody = document.getElementById('storeTableBody');
    const items = KingdomDB.getStoreItems(); 

    tbody.innerHTML = '';
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#666;">Toko kosong.</td></tr>`;
        return;
    }

    [...items].reverse().forEach(item => {
        let stockLabel = item.isLimited ? `<span style="color:#ff4444; font-weight:bold;">${item.stock} unit</span>` : '∞';
        
        tbody.innerHTML += `
            <tr>
                <td><img src="${item.image}" style="width:40px; height:40px; object-fit:contain;"></td>
                <td style="font-weight:bold; color:white;">${item.name}</td>
                <td class="text-gold">${KingdomDB.formatRupiah(item.price)}</td>
                <td>${stockLabel}</td>
                <td><button onclick="deleteItem('${item.id}')" class="btn-small-danger">Hapus</button></td>
            </tr>
        `;
    });
}

window.deleteItem = function(id) {
    if (confirm("Hapus item ini dari toko? (User yang sudah beli tetap memilikinya)")) {
        let items = KingdomDB.getStoreItems();
        const newItems = items.filter(i => i.id !== id);
        localStorage.setItem('kingdom_store', JSON.stringify(newItems));
        renderStoreTable();
    }
};

function resetPreview() {
    finalStoreImage = '';
    document.getElementById('previewBorderDisplay').style.display = 'none';
    document.getElementById('stockInputArea').style.display = 'none';
    document.getElementById('previewName').innerText = "Nama Item";
    document.getElementById('previewPrice').innerText = "Rp 0";
}

/* =========================================
   BAGIAN 2: MANAJEMEN VOUCHER (NEW)
   ========================================= */

function setupVoucherSubmit() {
    document.getElementById('addVoucherForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const code = document.getElementById('vCode').value.toUpperCase().trim();
        const type = document.getElementById('vType').value;
        const value = parseFloat(document.getElementById('vValue').value);

        if(!code || !value) { alert("Data tidak lengkap!"); return; }

        // Ambil Data Voucher Lama
        let vouchers = JSON.parse(localStorage.getItem('kingdom_vouchers')) || [];
        
        // Cek Duplikat
        if (vouchers.find(v => v.code === code)) {
            alert("⚠️ Kode voucher ini sudah ada!");
            return;
        }

        const newVoucher = {
            code: code,
            type: type,
            value: value,
            active: true
        };

        vouchers.push(newVoucher);
        localStorage.setItem('kingdom_vouchers', JSON.stringify(vouchers));

        alert(`🎟️ Voucher ${code} berhasil diterbitkan!`);
        this.reset();
        document.getElementById('previewVoucher').innerText = "KODE";
        renderVoucherTable();
    });
}

function renderVoucherTable() {
    const tbody = document.getElementById('voucherTableBody');
    const vouchers = JSON.parse(localStorage.getItem('kingdom_vouchers')) || []; // Default DB vouchers jika belum ada di LS

    tbody.innerHTML = '';
    if (vouchers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#666;">Belum ada voucher aktif.</td></tr>`;
        return;
    }

    [...vouchers].reverse().forEach(v => {
        let valDisplay = v.type === 'balance' ? KingdomDB.formatRupiah(v.value) : (v.value * 100) + "% OFF";
        let typeDisplay = v.type === 'balance' ? 'Saldo Cash' : 'Diskon Fee';
        let statusBadge = v.active ? '<span style="color:#00ff88">Aktif</span>' : '<span style="color:red">Nonaktif</span>';

        tbody.innerHTML += `
            <tr>
                <td style="font-weight:bold; color:var(--gold-primary); letter-spacing:1px;">${v.code}</td>
                <td>${typeDisplay}</td>
                <td style="font-weight:bold; color:white;">${valDisplay}</td>
                <td>${statusBadge}</td>
                <td><button onclick="deleteVoucher('${v.code}')" class="btn-small-danger">Hapus</button></td>
            </tr>
        `;
    });
}

window.deleteVoucher = function(code) {
    if (confirm(`Hapus voucher ${code}? User tidak akan bisa mengklaimnya lagi.`)) {
        let vouchers = JSON.parse(localStorage.getItem('kingdom_vouchers')) || [];
        const newVouchers = vouchers.filter(v => v.code !== code);
        localStorage.setItem('kingdom_vouchers', JSON.stringify(newVouchers));
        renderVoucherTable();
    }
};