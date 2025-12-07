/* =========================================
   🎛️ ADMIN LIVE CONTROL (GOD MODE LOGIC)
   Menangani: Remote Control, Narrator, & Security
   ========================================= */

let selectedItemId = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. SECURITY CHECK
    const session = JSON.parse(localStorage.getItem('kingdom_logged_in'));
    if (!session || session.role !== 'admin') {
        alert("⛔ AKSES DITOLAK");
        window.location.href = '../auth/login.html';
        return;
    }

    // 2. INIT SYSTEM
    logSystem("Connecting to Broadcast Server...");
    refreshRooms();
    
    // Auto refresh room list every 10 seconds (untuk cek status bid terbaru)
    setInterval(refreshRooms, 10000);
});

/* --- A. ROOM MANAGEMENT --- */
function refreshRooms() {
    const items = KingdomDB.getItems();
    const container = document.getElementById('roomListContainer');
    
    // Simpan scroll position biar gak loncat saat refresh
    const scrollPos = container.scrollTop;
    
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = '<p style="padding:20px; color:#666;">Tidak ada barang.</p>';
        return;
    }

    items.forEach(item => {
        // Indikator Status
        let statusClass = '';
        if(item.status === 'active') statusClass = 'live';
        if(item.status === 'sold') statusClass = 'sold';

        // Cek Active Selection
        const isActive = selectedItemId === item.id ? 'active' : '';

        const div = document.createElement('div');
        div.className = `room-item ${isActive}`;
        div.onclick = () => selectRoom(item.id);
        
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:bold; color:white; font-size:0.9rem;">
                    <span class="room-status-dot ${statusClass}"></span> ${item.name}
                </span>
                <span style="color:#666; font-size:0.75rem; font-family:monospace;">#${item.id}</span>
            </div>
            <div style="font-size:0.75rem; color:#888; margin-top:5px; display:flex; justify-content:space-between;">
                <span>Bid: <span style="color:var(--gold-primary)">${KingdomDB.formatRupiah(item.currentBid)}</span></span>
                <span>${item.highestBidder}</span>
            </div>
        `;
        container.appendChild(div);
    });

    // Restore scroll
    container.scrollTop = scrollPos;
}

function selectRoom(id) {
    selectedItemId = id;
    refreshRooms(); // Re-render untuk highlight selection
    
    const item = KingdomDB.getItems().find(i => i.id === id);
    if(!item) return;

    // Update Monitor UI
    document.getElementById('targetName').innerText = item.name;
    document.getElementById('targetBid').innerText = KingdomDB.formatRupiah(item.currentBid);
    document.getElementById('targetHolder').innerText = item.highestBidder;
    document.getElementById('targetImg').src = item.image;
    
    // Update Big Status
    const statusEl = document.getElementById('bigStatus');
    statusEl.className = 'big-status'; // Reset classes
    
    if(item.status === 'active') {
        statusEl.innerText = "LIVE";
        statusEl.classList.add('st-live');
    } else if(item.status === 'sold') {
        statusEl.innerText = "SOLD";
        statusEl.classList.add('st-sold');
    } else if(item.status === 'paused') {
        statusEl.innerText = "PAUSED";
        statusEl.style.color = "yellow";
    } else {
        statusEl.innerText = "READY";
        statusEl.style.color = "#555";
    }

    logSystem(`Channel #${id} selected. Waiting for command.`);
}

/* --- B. BROADCAST SIGNALS (CONTROLLER) --- */
window.broadcastSignal = function(status) {
    if(!selectedItemId) { alert("Pilih Room dulu!"); return; }

    // 1. Update DB Local (Agar persisten saat refresh)
    updateItemStatusInDB(selectedItemId, status === 'LIVE' ? 'active' : 'paused');

    // 2. Kirim Sinyal Realtime (Via Storage Event)
    // Format: ID|STATUS|TIMESTAMP
    const payload = `${selectedItemId}|${status}|${Date.now()}`;
    localStorage.setItem('auction_cmd_status', payload);

    // 3. Feedback Admin
    selectRoom(selectedItemId); // Update Monitor
    
    if (status === 'LIVE') logSystem("SIGNAL SENT: ▶ GO LIVE");
    if (status === 'PAUSED') logSystem("SIGNAL SENT: ⏸ PAUSE");
};

window.forceSold = function() {
    if(!selectedItemId) return;
    if(!confirm("⚠️ PERINGATAN KERAS:\n\nAksi ini akan menghentikan lelang dan memenangkan penawar tertinggi saat ini secara SAH.\n\nLanjutkan?")) return;

    // 1. Update DB
    updateItemStatusInDB(selectedItemId, 'sold');

    // 2. Kirim Sinyal
    const payload = `${selectedItemId}|SOLD|${Date.now()}`;
    localStorage.setItem('auction_cmd_status', payload);
    
    selectRoom(selectedItemId);
    logSystem("SIGNAL SENT: 🔨 FORCE SELL EXECUTED");
};

window.resetItem = function() {
    if(!selectedItemId) return;
    if(!confirm("RESET lelang ini ke harga awal? History bid akan hilang!")) return;
    
    let items = KingdomDB.getItems();
    const idx = items.findIndex(i => i.id === selectedItemId);
    if(idx !== -1) {
        items[idx].status = 'active';
        items[idx].currentBid = items[idx].price; // Reset ke harga open
        items[idx].highestBidder = '-';
        items[idx].bids = [];
        
        localStorage.setItem('kingdom_items', JSON.stringify(items));
        
        selectRoom(selectedItemId);
        logSystem("SYSTEM: Room reset to initial state.");
    }
};

/* --- C. NARRATOR & COMMUNICATION --- */
window.fillMsg = function(text) {
    document.getElementById('narratorInput').value = text;
};

window.sendNarratorMsg = function() {
    if(!selectedItemId) { alert("Pilih Room dulu!"); return; }
    
    const text = document.getElementById('narratorInput').value;
    if(!text) return;

    // Kirim Sinyal Chat
    // Format: ID|MSG|TIMESTAMP
    const payload = `${selectedItemId}|${text}|${Date.now()}`;
    localStorage.setItem('auction_cmd_chat', payload);
    
    document.getElementById('narratorInput').value = '';
    logSystem(`Narrator: "${text}"`);
};

window.sendMarquee = function() {
    const text = document.getElementById('marqueeInput').value;
    if(!text) return;

    // Kirim ke Global (Global.js yang dengar)
    localStorage.setItem('auction_signal_msg', text + '|' + Date.now());
    
    logSystem(`GLOBAL BROADCAST: "${text}"`);
    document.getElementById('marqueeInput').value = '';
    alert("Pengumuman dikirim ke seluruh server!");
};

/* --- D. SECURITY TOOLS (KICK) --- */
window.kickUser = function() {
    const target = document.getElementById('kickTarget').value.trim();
    if(!target) return;

    if(!confirm(`⚠️ TENDANG @${target} DARI SERVER?`)) return;

    // Kirim Sinyal Kick
    localStorage.setItem('admin_kick_signal', target + '|' + Date.now());
    
    logSystem(`SECURITY: KICK command sent for @${target}`);
    document.getElementById('kickTarget').value = '';
    alert("Target telah dieksekusi.");
};

/* --- UTILITIES --- */
function updateItemStatusInDB(id, status) {
    let items = KingdomDB.getItems();
    const idx = items.findIndex(i => i.id === id);
    if(idx !== -1) {
        items[idx].status = status;
        localStorage.setItem('kingdom_items', JSON.stringify(items));
    }
}

function logSystem(msg) {
    const term = document.getElementById('sysLog');
    const time = new Date().toLocaleTimeString();
    term.innerHTML += `> [${time}] ${msg}<br>`;
    term.scrollTop = term.scrollHeight;
}