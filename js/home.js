// ===============================
// js/home.js (FINAL - CLEAN VERSION)
// ===============================

// Kalau KingdomDB error / kosong, fallback ke dummy
const FALLBACK_DUMMY = [
    {
        id: 1,
        name: "Emerald Skull of Aztec",
        category: "Relic",
        price: 3400000000,
        currentBid: 3800000000,
        image: "assets/images/items/skull.jpg",
        status: "active",
        access: "vvip",
        highestBidder: "Prince Vault"
    },
    {
        id: 2,
        name: "Rolex Daytona 1963",
        category: "Arloji",
        price: 1250000000,
        currentBid: 1500000000,
        image: "assets/images/items/watch1.jpg",
        status: "active",
        access: "vip",
        highestBidder: "Rex"
    },
    {
        id: 3,
        name: "Ferrari F40",
        category: "Kendaraan",
        price: 9200000000,
        currentBid: 9400000000,
        image: "assets/images/items/car.jpg",
        status: "active",
        access: "vvip",
        highestBidder: "BlackHammer"
    },
    {
        id: 4,
        name: "Private Island",
        category: "Properti",
        price: 12900000000,
        currentBid: 12900000000,
        image: "assets/images/items/island.jpg",
        status: "active",
        access: "vvip",
        highestBidder: "Queen Ophelia"
    }
];

document.addEventListener('DOMContentLoaded', () => initHomePage());

function initHomePage() {
    const grids = ['liveGrid', 'recommendationGrid', 'rareGrid', 'catWatchGrid', 'catCarGrid'];
    grids.forEach(showLoading);

    setTimeout(() => {

        let items = [];
        let users = [];

        try {
            items = KingdomDB.getItems() || FALLBACK_DUMMY;
            users = KingdomDB.getUsers() || [];
        } catch (err) {
            console.warn("KingdomDB gagal dipakai, fallback aktif", err);
            items = FALLBACK_DUMMY;
            users = [{ id: 1, saldo: 10000000 }];
        }

        updateServerStats(items, users);

        renderLiveSection(items);
        renderRecommendations(items);
        renderRareItems(items);
        renderCategorySection(items, 'Arloji', 'catWatchGrid');
        renderCategorySection(items, 'Kendaraan', 'catCarGrid');

    }, 700);
}

/* ================= LIVE SECTION ================= */

function renderLiveSection(allItems) {
    const container = document.getElementById('liveGrid');

    const liveItems = allItems
        .filter(i => i.status === 'active' && (i.access === 'vvip' || i.access === 'vip'))
        .sort((a, b) => b.currentBid - a.currentBid)
        .slice(0, 3);

    container.innerHTML = '';

    if (!liveItems.length) {
        container.innerHTML = `<p style="color:#666;grid-column:1/-1">Tidak ada Live Event.</p>`;
        return;
    }

    const narratorTexts = [
        bid => `🎙️ Penawaran ${formatRupiah(bid)} masuk!`,
        () => `🎙️ Siapa berani lebih tinggi?`,
        bidder => `🎙️ ${bidder} di posisi teratas!`,
        () => `🎙️ Barang panas! Last call!`
    ];

    liveItems.forEach(item => {
        const narrator = narratorTexts[Math.floor(Math.random() * narratorTexts.length)];
        const narratorText = narrator(item.currentBid, item.highestBidder);

        container.innerHTML += `
        <div class="auction-card glass-panel fade-in" style="border-color:#ff4444;">
            <div class="card-image-box">
                <div class="live-tag-wrapper">
                    <span class="live-dot-anim"></span> 
                    <span style="color:white;font-weight:bold;font-size:0.75rem;">LIVE</span>
                </div>
                <img src="${item.image}" onerror="this.src='assets/images/items/placeholder.png'">

                <div class="narrator-badge">${narratorText}</div>
            </div>

            <div class="card-info">
                <div class="card-cat" style="color:#ff4444;">🔥 DIPEREBUTKAN</div>
                <h3 class="card-title">${item.name}</h3>

                <div class="card-footer">
                    <span class="card-price-label">Posisi Sekarang</span>
                    <div class="card-price" style="color:#ff4444;">
                        ${formatRupiah(item.currentBid)}
                    </div>

                    <a href="auction-live.html?id=${item.id}">
                        <button class="btn-card-action"
                        style="background:#a00;color:white">
                        GABUNG
                        </button>
                    </a>
                </div>
            </div>
        </div>
        `;
    });
}

/* ================= RECOMMEND / RARE ================= */

function renderRecommendations(allItems) {
    const selected = [...allItems]
        .filter(i => i.status === 'active')
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);

    renderGenericGrid(selected, 'recommendationGrid');
}

function renderRareItems(allItems) {
    const rare = allItems
        .filter(i => i.status === 'active' && i.price >= 10000000000)
        .slice(0, 4);

    renderGenericGrid(rare, 'rareGrid');
}

/* ================= CATEGORY ================= */

function renderCategorySection(allItems, category, containerId) {
    const filtered = allItems
        .filter(i => i.status === 'active' && i.category === category)
        .slice(0, 4);

    renderGenericGrid(filtered, containerId);
}

/* ================= GENERIC ================= */

function renderGenericGrid(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!items.length) {
        container.innerHTML = `<p style="color:#666;">Stok kosong.</p>`;
        return;
    }

    items.forEach(item => {

        let badge = '';
        if (item.access === 'vvip') badge = `<div class="card-badge badge-vvip">👑 VVIP</div>`;
        else if (item.access === 'vip') badge = `<div class="card-badge badge-vip">⚜️ VIP</div>`;

        container.innerHTML += `
        <div class="auction-card glass-panel fade-in">
            <div class="card-image-box">
                ${badge}
                <img src="${item.image}" onerror="this.src='assets/images/items/placeholder.png'">
            </div>

            <div class="card-info">
                <div class="card-cat">${item.category}</div>
                <h3 class="card-title">${item.name}</h3>

                <div class="card-footer">
                    <span class="card-price-label">Penawaran</span>
                    <div class="card-price">${formatRupiah(item.currentBid)}</div>

                    <a href="auction-live.html?id=${item.id}">
                        <button class="btn-card-action">
                            LIHAT
                        </button>
                    </a>
                </div>
            </div>
        </div>
        `;
    });
}

/* ================= STATS ================= */

function updateServerStats(items, users) {
    const activeCount = items.filter(i => i.status === 'active').length;
    const valuation = items.reduce((a, b) => a + b.price, 0) +
                      users.reduce((a, b) => a + (b.saldo || 0), 0);

    animateCounter('statLive', activeCount);
    document.getElementById('statUsers').innerText = Math.max(users.length - 1, 7);
    document.getElementById('statValuation').innerText = formatCompactNumber(valuation);
}

/* ================= UTIL ================= */

function showLoading(id) {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = `
            <div class="loading-text">
                <div class="loader-diamond" 
                     style="width:20px;height:20px;margin:0 auto 10px;">
                </div>
                Memuat...
            </div>
        `;
    }
}

function animateCounter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;

    let current = 0;
    const step = Math.max(1, Math.ceil(target / 20));

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.innerText = current;
    }, 40);
}

function formatRupiah(num) {
    return "Rp " + (num || 0).toLocaleString("id-ID");
}

function formatCompactNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'M';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + ' jt';
    return num.toLocaleString("id-ID");
}
