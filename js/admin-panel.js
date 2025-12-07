let finalImg = '';
document.getElementById('itemImg').addEventListener('change', function() {
    const reader = new FileReader();
    reader.readAsDataURL(this.files[0]);
    reader.onload = (e) => finalImg = e.target.result;
});

document.getElementById('addItemForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if(!finalImg) { alert("Gambar wajib upload!"); return; }

    const newItem = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCat').value,
        price: parseInt(document.getElementById('itemPrice').value),
        currentBid: parseInt(document.getElementById('itemPrice').value),
        image: finalImg,
        access: document.querySelector('input[name="access"]:checked').value,
        endTime: new Date(Date.now() + (document.getElementById('itemDuration').value * 3600000)).toISOString(),
        status: 'active'
    };

    KingdomDB.addItem(newItem);
    alert("Barang berhasil diterbitkan!");
    window.location.reload();
});