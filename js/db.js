/* =========================================
   🧠 KINGDOM CENTRAL DATABASE (ULTIMATE 2.0)
   Features: Voucher, Social, Auto-Bid, Reserve Price
   ========================================= */

const KingdomDB = {

    // 1. SISTEM RANK (KASTA)
    ranks: {
        peasant: { id: 'rank-peasant', name: 'Peasant', fee: 0.10, limit: 0, price: 0, image: 'assets/badges/rank-peasant.png' },
        knight:  { id: 'rank-knight',  name: 'Knight',  fee: 0.09, limit: 0, price: 10000000, image: 'assets/badges/rank-knight.png' },
        noble:   { id: 'rank-noble',   name: 'Noble',   fee: 0.08, limit: 0, price: 50000000, image: 'assets/badges/rank-noble.png' },
        duke:    { id: 'rank-duke',    name: 'Duke',    fee: 0.05, limit: 0, price: 200000000, image: 'assets/badges/rank-duke.png' },
        royal:   { id: 'rank-royal',   name: 'Royal',   fee: 0.04, limit: 0, price: 1000000000, image: 'assets/badges/rank-royal.png' },
        king:    { id: 'rank-king',    name: 'King',    fee: 0.03, limit: -5000000000, price: 5000000000, image: 'assets/badges/rank-king.png' },
        emperor: { id: 'rank-emperor', name: 'Emperor', fee: 0.02, limit: -100000000000, price: 25000000000, image: 'assets/badges/rank-emperor.png' }
    },

    // 2. DATA VOUCHER (PROMO CODE SYSTEM)
    vouchers: [
        { code: 'KINGDOM2025', type: 'balance', value: 50000000, active: true }, // Bonus Saldo 50 Juta
        { code: 'DISKONADMIN', type: 'fee_cut', value: 0.5, active: true }       // Diskon Fee 50%
    ],

    // 3. DATA AWAL (SEEDER)
    seedData: {
        users: [
            {
                username: 'admin', 
                password: '123', 
                name: 'Admin Kerajaan', 
                rank: 'rank-emperor', 
                role: 'admin', 
                saldo: 999999999999999, 
                verified: true, 
                avatar: 'assets/images/avatars/default.png', 
                activeBorder: 'border-gold', 
                inventory: ['border-gold', 'border-fire'], 
                badges: ['badge-admin'], 
                friends: [], // Fitur Sosial
                referralCode: 'ADM001',
                usedVouchers: [], // Mencegah double claim
                history: [], 
                walletHistory: [],
                settings: { ghostMode: true, showHistory: true, showNetWorth: false },
                createdAt: new Date().toISOString()
            },
            {
                username: 'sultan01', 
                password: '123', 
                name: 'Sultan Andara', 
                rank: 'rank-peasant', 
                role: 'user', 
                saldo: 100000000, 
                verified: true, 
                avatar: 'assets/images/avatars/default.png', 
                activeBorder: 'border-default', 
                inventory: ['border-default'], 
                badges: ['badge-newbie'], 
                friends: ['admin'], // Contoh teman
                referralCode: 'SUL888', // Kode Referral User
                usedVouchers: [],
                history: [], 
                walletHistory: [{ type: 'in', category: 'Bonus', desc: 'Welcome Bonus', amount: 100000000, date: new Date().toLocaleString() }],
                settings: { ghostMode: false, showHistory: true, showNetWorth: true },
                createdAt: new Date().toISOString()
            }
        ],
        
        items: [
            // Tambahan: reservePrice (Harga Rahasia)
            { id: 101, name: "Rolex Daytona Panda", category: "Arloji", price: 450000000, currentBid: 450000000, reservePrice: 600000000, highestBidder: "-", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=600&q=80", access: "public", status: "active", endTime: new Date(Date.now() + 86400000).toISOString(), bids: [] },
            { id: 102, name: "Pulau Pribadi Maldives", category: "Properti", price: 25000000000, currentBid: 25000000000, reservePrice: 30000000000, highestBidder: "-", image: "https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?auto=format&fit=crop&w=600&q=80", access: "vvip", status: "active", endTime: new Date(Date.now() + 172800000).toISOString(), bids: [] },
            { id: 103, name: "Lamborghini Aventador", category: "Kendaraan", price: 8000000000, currentBid: 8000000000, reservePrice: 9000000000, highestBidder: "-", image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=600&q=80", access: "vip", status: "active", endTime: new Date(Date.now() + 90000000).toISOString(), bids: [] },
            { id: 104, name: "Berlian Pink Star", category: "Perhiasan", price: 1500000000, currentBid: 1500000000, reservePrice: 2000000000, highestBidder: "-", image: "https://images.unsplash.com/photo-1615655406736-b37c4fabf923?auto=format&fit=crop&w=600&q=80", access: "public", status: "active", endTime: new Date(Date.now() + 40000000).toISOString(), bids: [] },
            { id: 105, name: "Lukisan 'The Void'", category: "Seni", price: 300000000, currentBid: 300000000, reservePrice: 0, highestBidder: "-", image: "https://images.unsplash.com/photo-1579783902614-a3fb39279c15?auto=format&fit=crop&w=600&q=80", access: "public", status: "active", endTime: new Date(Date.now() + 60000000).toISOString(), bids: [] },
            { id: 106, name: "Pedang Samurai Kuno", category: "Pusaka", price: 120000000, currentBid: 120000000, reservePrice: 200000000, highestBidder: "-", image: "https://images.unsplash.com/photo-1591375372334-e1d44111ee09?auto=format&fit=crop&w=600&q=80", access: "vip", status: "active", endTime: new Date(Date.now() + 120000000).toISOString(), bids: [] },
            { id: 107, name: "Super Yacht 50ft", category: "Kendaraan", price: 15000000000, currentBid: 15000000000, reservePrice: 20000000000, highestBidder: "-", image: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=600&q=80", access: "vvip", status: "active", endTime: new Date(Date.now() + 200000000).toISOString(), bids: [] },
            { id: 108, name: "Penthouse Jakarta", category: "Properti", price: 9000000000, currentBid: 9000000000, reservePrice: 10000000000, highestBidder: "-", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80", access: "public", status: "active", endTime: new Date(Date.now() + 100000000).toISOString(), bids: [] },
            { id: 109, name: "Patek Philippe Gold", category: "Arloji", price: 850000000, currentBid: 850000000, reservePrice: 1000000000, highestBidder: "-", image: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=600&q=80", access: "vip", status: "active", endTime: new Date(Date.now() + 50000000).toISOString(), bids: [] },
            { id: 110, name: "Kalung Emas Murni", category: "Perhiasan", price: 75000000, currentBid: 75000000, reservePrice: 0, highestBidder: "-", image: "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?auto=format&fit=crop&w=600&q=80", access: "public", status: "active", endTime: new Date(Date.now() + 30000000).toISOString(), bids: [] },
            { id: 111, name: "Vas Dinasti Ming", category: "Seni", price: 250000000, currentBid: 250000000, reservePrice: 0, highestBidder: "-", image: "https://images.unsplash.com/photo-1602103770457-3cb6bc3bd665?auto=format&fit=crop&w=600&q=80", access: "vip", status: "active", endTime: new Date(Date.now() + 45000000).toISOString(), bids: [] },
            { id: 112, name: "Private Jet G650", category: "Kendaraan", price: 95000000000, currentBid: 95000000000, reservePrice: 100000000000, highestBidder: "-", image: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=600&q=80", access: "vvip", status: "active", endTime: new Date(Date.now() + 300000000).toISOString(), bids: [] }
        ],
        
        storeItems: [
            { id: 'border-gold', name: 'Golden Frame', type: 'border', price: 25000000, image: 'assets/borders/gold.png', isLimited: false, stock: null, desc: 'Kemewahan standar.' },
            { id: 'border-diamond', name: 'Diamond Edge', type: 'border', price: 100000000, image: 'assets/borders/diamond.png', isLimited: false, stock: null, desc: 'Kilau abadi.' },
            { id: 'border-fire', name: 'Hellfire (GIF)', type: 'border', price: 500000000, image: 'assets/borders/fire.gif', isLimited: true, stock: 5, desc: 'Api animasi langka.' }
        ],

        achievements: [
            { id: 'achv-first', title: 'First Blood', desc: 'Menangkan lelang pertama.', image: 'assets/badges/badge-first.png' },
            { id: 'achv-whale', title: 'The Whale', desc: 'Belanja > 1 Miliar.', image: 'assets/badges/badge-whale.png' }
        ]
    },

    // 4. INIT (AUTO-UPDATE DATA LAMA)
    init: function() {
        console.log('💎 KINGDOM DB: Initializing 2.0...');
        
        // Cek User & Update Struktur jika perlu
        if (!localStorage.getItem('kingdom_users')) {
            localStorage.setItem('kingdom_users', JSON.stringify(this.seedData.users));
        }

        // Cek Item (Force update jika kosong)
        const currentItems = JSON.parse(localStorage.getItem('kingdom_items')) || [];
        if (currentItems.length === 0) {
            localStorage.setItem('kingdom_items', JSON.stringify(this.seedData.items));
        }

        // Simpan Voucher Code
        if (!localStorage.getItem('kingdom_vouchers')) {
            localStorage.setItem('kingdom_vouchers', JSON.stringify(this.vouchers));
        }

        if (!localStorage.getItem('kingdom_store')) localStorage.setItem('kingdom_store', JSON.stringify(this.seedData.storeItems));
        if (!localStorage.getItem('kingdom_achv')) localStorage.setItem('kingdom_achv', JSON.stringify(this.seedData.achievements));
    },

    // 5. CORE CRUD FUNCTIONS
    getUsers: function() { return JSON.parse(localStorage.getItem('kingdom_users')) || []; },
    
    getUser: function(username) {
        return this.getUsers().find(u => u.username === username);
    },

    saveUser: function(userData) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.username === userData.username);
        if (index !== -1) {
            users[index] = userData;
            localStorage.setItem('kingdom_users', JSON.stringify(users));
            // Update session
            const currentSession = JSON.parse(localStorage.getItem('kingdom_logged_in'));
            if (currentSession && currentSession.username === userData.username) {
                localStorage.setItem('kingdom_logged_in', JSON.stringify(userData));
            }
            return true;
        }
        return false;
    },

    createUser: function(newUser) {
        const users = this.getUsers();
        if (users.find(u => u.username === newUser.username)) return { success: false, msg: 'Username sudah ada!' };
        
        // Buat Kode Referral Unik (Misal: BUDI99)
        const refCode = newUser.username.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000);

        const userModel = {
            ...newUser,
            role: 'user', rank: 'rank-peasant', saldo: 10000000, 
            verified: false, bio: 'Pendatang baru.', 
            avatar: 'assets/images/avatars/default.png', activeBorder: 'border-default', 
            inventory: ['border-default'], badges: [], friends: [], 
            referralCode: refCode,
            history: [], 
            walletHistory: [{ type: 'in', category: 'Bonus', desc: 'Welcome Bonus', amount: 10000000, date: new Date().toLocaleString() }],
            settings: { ghostMode: false, showHistory: true, showNetWorth: true },
            createdAt: new Date().toISOString()
        };

        users.push(userModel);
        localStorage.setItem('kingdom_users', JSON.stringify(users));
        return { success: true, msg: 'Akun dibuat!' };
    },

    getItems: function() { return JSON.parse(localStorage.getItem('kingdom_items')) || []; },

    addItem: function(item) {
        const items = this.getItems();
        const lastId = items.length > 0 ? items[items.length - 1].id : 100;
        item.id = lastId + 1;
        item.bids = [];
        // Default reserve price jika tidak ada
        if(!item.reservePrice) item.reservePrice = 0; 
        
        items.push(item);
        localStorage.setItem('kingdom_items', JSON.stringify(items));
        return true;
    },

    placeBid: function(itemId, user, amount, isAuto = false) {
        const items = this.getItems();
        const index = items.findIndex(i => i.id == itemId);
        
        if (index !== -1) {
            const item = items[index];
            item.currentBid = amount;
            item.highestBidder = user.username;
            
            // Log tipe bid
            const logType = isAuto ? 'Auto-Bid' : 'Manual Bid';
            
            item.bids.push({ user: user.username, amount: amount, type: logType, time: new Date().toISOString() });
            localStorage.setItem('kingdom_items', JSON.stringify(items));
            return true;
        }
        return false;
    },

    // --- VOUCHER LOGIC ---
    redeemVoucher: function(username, code) {
        const vouchers = JSON.parse(localStorage.getItem('kingdom_vouchers')) || this.vouchers;
        const targetVoucher = vouchers.find(v => v.code === code && v.active === true);
        const user = this.getUser(username);

        if (!targetVoucher) return { success: false, msg: 'Kode tidak valid.' };
        if (user.usedVouchers && user.usedVouchers.includes(code)) return { success: false, msg: 'Kode sudah dipakai.' };

        // Eksekusi Benefit
        if (targetVoucher.type === 'balance') {
            user.saldo += targetVoucher.value;
            user.walletHistory.push({ type: 'in', category: 'Voucher', desc: `Redeem ${code}`, amount: targetVoucher.value, date: new Date().toLocaleString() });
        }

        // Tandai sudah dipakai
        if (!user.usedVouchers) user.usedVouchers = [];
        user.usedVouchers.push(code);
        
        this.saveUser(user);
        return { success: true, msg: 'Voucher berhasil diklaim!' };
    },

    // UTILS
    getStoreItems: function() { return JSON.parse(localStorage.getItem('kingdom_store')) || []; },
    buyItem: function(u, id) { /* Sama seperti sebelumnya */ 
        const user = this.getUser(u); const items = this.getStoreItems(); const idx = items.findIndex(i=>i.id===id);
        if(!user || idx===-1) return {success:false, msg:'Error'};
        const item = items[idx];
        if(user.saldo < item.price) return {success:false, msg:'Saldo kurang'};
        if(user.inventory && user.inventory.includes(id)) return {success:false, msg:'Sudah punya'};
        if(item.isLimited) { if(item.stock<=0) return {success:false, msg:'Habis'}; item.stock--; items[idx]=item; localStorage.setItem('kingdom_store', JSON.stringify(items)); }
        user.saldo -= item.price; if(!user.inventory) user.inventory=[]; user.inventory.push(id);
        user.walletHistory.push({ type: 'out', category: 'Shop', desc: `Beli ${item.name}`, amount: item.price, date: new Date().toLocaleString() });
        this.saveUser(user);
        return {success:true, msg:'Terbeli'};
    },
    addStoreItem: function(item) { const items = this.getStoreItems(); if(!item.id) item.id='item-'+Date.now(); items.push(item); localStorage.setItem('kingdom_store', JSON.stringify(items)); },
    formatRupiah: function(n) { return new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(n); },
    getRankInfo: function(id) { return this.ranks[Object.keys(this.ranks).find(k=>this.ranks[k].id===id)] || this.ranks.peasant; }
};

KingdomDB.init();