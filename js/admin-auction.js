/* =========================================
   🛠️ ADMIN AUCTION LOGIC (ULTIMATE V2.0)
   Menangani: Input Barang, Reserve Price, & Upload System
   ========================================= */

let finalImageBase64 = ''; // Wadah gambar sementara

document.addEventListener('DOMContentLoaded', () => {
    // 1. SECURITY CHECK (Garda Depan)
    checkAdminAccess();

    // 2. INITIALIZE LISTENERS
    setupLivePreview();
    setupImageUpload();
    setupFormSubmit();
});

/* --- A. FUNGSI KEAMANAN --- */
function checkAdminAccess() {
    const session = JSON.parse(localStorage.getItem('kingdom_logged_in'));
    
    // Cek Sesi & Role
    if (!session || session.role !== 'admin') {
        alert("⛔ AKSES DITOLAK: Halaman ini rahasia negara.");
        window.location.href = '../auth/login.html';
        throw new Error("Unauthorized Access"); // Hentikan script
    }
}

/* --- B. LIVE PREVIEW SYSTEM (Real-time Typing) --- */
function setupLivePreview() {
    // 1. Judul Barang
    document.getElementById('itemName').addEventListener('input', function(e) {
        const val = e.target.value;
        document.getElementById('previewTitle').innerText = val || 'Nama Barang';
    });

    // 2. Kategori
    document.getElementById('itemCat').addEventListener('change', function(e) {
        document.querySelector('.preview-cat').innerText = e.target.value;
    });

    // 3. Harga Open Bid
    document.getElementById('itemPrice').addEventListener('input', function(e) {
        const val = parseInt(e.target.value) || 0;
        document.getElementById('previewPrice').innerText = KingdomDB.formatRupiah(val);
    });

    // 4. Badge Akses (VIP/VVIP)
    const radioButtons = document.querySelectorAll('input[name="access"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            updateBadgePreview(this.value);
        });
    });
}

function updateBadgePreview(accessLevel) {
    const badge = document.getElementById('previewBadge');
    
    // Reset Style
    badge.style.display = 'none';
    badge.className = 'preview-badge'; 

    if (accessLevel === 'vip') {
        badge.style.display = 'block';
        badge.innerText = 'VIP';
        badge.style.background = 'gold';
        badge.style.color = 'black';
    } else if (accessLevel === 'vvip') {
        badge.style.display = 'block';
        badge.innerText = 'VVIP';
        badge.style.background = '#ff4500';
        badge.style.color = 'white';
    }
}

/* --- C. IMAGE UPLOAD ENGINE (Base64) --- */
function setupImageUpload() {
    const imgInput = document.getElementById('itemImg');
    const previewImg = document.getElementById('previewImageDisplay');
    const noImgText = document.getElementById('previewNoImage');

    imgInput.addEventListener('change', function() {
        const file = this.files[0];
        
        if (file) {
            // Validasi Ukuran (Max 2MB agar localStorage tidak penuh)
            if (file.size > 2 * 1024 * 1024) {
                alert("⚠️ File terlalu besar! Maksimal 2MB.");
                this.value = ''; 
                return;
            }

            const reader = new FileReader();
            
            reader.onload = function(e) {
                finalImageBase64 = e.target.result;
                
                // Tampilkan di Preview Card
                previewImg.src = finalImageBase64;
                previewImg.style.display = 'block';
                noImgText.style.display = 'none';
            }
            
            reader.readAsDataURL(file);
        }
    });
}

/* --- D. SUBMIT TO DATABASE --- */
function setupFormSubmit() {
    document.getElementById('addItemForm').addEventListener('submit', function(e) {
        e.preventDefault();

        // 1. Validasi Gambar
        if (!finalImageBase64) {
            alert("⚠️ Harap upload foto barang!");
            return;
        }

        // 2. Ambil Data Input
        const name = document.getElementById('itemName').value;
        const category = document.getElementById('itemCat').value;
        const price = parseInt(document.getElementById('itemPrice').value);
        const reservePrice = parseInt(document.getElementById('itemReserve').value) || 0; // NEW FEATURE
        const access = document.querySelector('input[name="access"]:checked').value;
        const durationHours = parseInt(document.getElementById('itemDuration').value);

        // 3. Validasi Logic Harga
        if (reservePrice > 0 && reservePrice < price) {
            alert("⚠️ Reserve Price tidak boleh lebih rendah dari Open Bid!");
            return;
        }

        // 4. Hitung Waktu Habis
        const endTime = new Date(Date.now() + (durationHours * 60 * 60 * 1000)).toISOString();

        // 5. Konstruksi Objek Barang
        const newItem = {
            // ID akan digenerate otomatis oleh KingdomDB.addItem
            name: name,
            category: category,
            price: price,           // Harga Awal
            currentBid: price,      // Bid saat ini (start)
            reservePrice: reservePrice, // Harga Rahasia (NEW)
            highestBidder: '-',     
            image: finalImageBase64,
            access: access,         // public/vip/vvip
            status: 'active',       
            endTime: endTime,
            bids: []                
        };

        // 6. Simpan ke LocalStorage via DB Helper
        const success = KingdomDB.addItem(newItem);

        if (success) {
            // Sukses Visual
            alert(`✅ BERHASIL!\n"${name}" kini tayang di pelelangan global.`);
            
            // Reset Form & Preview
            this.reset();
            resetPreviewState();
        } else {
            alert("❌ Gagal menyimpan data. Cek console.");
        }
    });
}

function resetPreviewState() {
    finalImageBase64 = '';
    document.getElementById('previewTitle').innerText = 'Nama Barang';
    document.getElementById('previewPrice').innerText = 'Rp 0';
    document.getElementById('previewImageDisplay').style.display = 'none';
    document.getElementById('previewNoImage').style.display = 'block';
    
    // Reset Badge
    document.getElementById('previewBadge').style.display = 'none';
    
    // Reset Radio ke Public
    const publicRadio = document.querySelector('input[value="public"]');
    if(publicRadio) publicRadio.checked = true;
}

// Global Logout Function
window.logoutAdmin = function() {
    if(confirm("Tutup sesi admin?")) {
        localStorage.removeItem('kingdom_logged_in');
        window.location.href = '../auth/login.html';
    }
};