document.addEventListener('DOMContentLoaded', () => {
    const savedColor = localStorage.getItem('sw_Color');
    if (savedColor) {
        document.documentElement.style.setProperty('--user-theme', savedColor);
        document.documentElement.style.setProperty('--user-theme-light', savedColor + '1A'); 
    }

    render();
});

function render() {
    const container = document.getElementById('list-container');
    if(!container) return;
    container.innerHTML = '';
    
    const mainName = localStorage.getItem('sw_BookName') || 'Ví chính';
    const mainBalance = localStorage.getItem('sw_Balance') || 0;
    const mainIcon = localStorage.getItem('sw_Icon') || 'bx-wallet';
    const mainWallet = document.createElement('div');
    mainWallet.className = 'wallet-card-item';
    mainWallet.style.borderLeft = '5px solid var(--user-theme)';
    mainWallet.innerHTML = `
        <i class='bx ${mainIcon}'></i>
        <div class="wallet-info">
            <span class="badge-main">Mặc định</span>
            <h4>${mainName}</h4>
            <p>${new Intl.NumberFormat('vi-VN').format(mainBalance)} ₫</p>
        </div>
    `;
    mainWallet.onclick = () => openModal(mainName, mainBalance, 'Tiền mặt', mainIcon);
    container.appendChild(mainWallet);
    
    const others = JSON.parse(localStorage.getItem('sw_MyWallets')) || [];
    others.forEach(w => {
        const subWallet = document.createElement('div');
        subWallet.className = 'wallet-card-item';
        subWallet.innerHTML = `
            <i class='bx ${w.icon}'></i>
            <div class="wallet-info">
                <span class="badge-main" style="background:#f1f5f9; color:#64748b;">${w.type}</span>
                <h4>${w.name}</h4>
                <p>${new Intl.NumberFormat('vi-VN').format(w.balance)} ₫</p>
            </div>
        `;
        subWallet.onclick = () => openModal(w.name, w.balance, w.type, w.icon);
        container.appendChild(subWallet);
    });
}

let currentType = "";
let currentIcon = "bx-wallet";

function goStep2(type, icon) {
    currentType = type;
    currentIcon = icon || "bx-wallet";
    document.getElementById('type-name').innerText = type;
    document.getElementById('step-1').style.display = 'none';
    document.getElementById('step-2').style.display = 'block';
    
    document.querySelectorAll('.icon-box').forEach(b => b.classList.remove('active'));
    const defaultIconBox = Array.from(document.querySelectorAll('.icon-box')).find(box => box.innerHTML.includes(currentIcon));
    if(defaultIconBox) defaultIconBox.classList.add('active');
}

function pickIcon(el, icon) {
    document.querySelectorAll('.icon-box').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    currentIcon = icon;
}

function finish() {
    const name = document.getElementById('w-name').value;
    const balance = document.getElementById('w-balance').value || 0;
    if(!name) return alert("Nhập tên ví bạn ơi!");
    
    let others = JSON.parse(localStorage.getItem('sw_MyWallets')) || [];
    others.push({ type: currentType, name, balance: Number(balance), icon: currentIcon });
    localStorage.setItem('sw_MyWallets', JSON.stringify(others));
    
    let totalExtra = Number(localStorage.getItem('sw_TotalInitial')) || 0;
    localStorage.setItem('sw_TotalInitial', totalExtra + Number(balance));
    
    alert("Tạo ví thành công!");
    location.reload();
}

let wdChartInstance = null;

function openModal(name, balance, type, icon) {
    document.getElementById('walletDetailModal').style.display = 'flex';
    document.getElementById('modal-name').innerText = name;
    document.getElementById('modal-balance').innerText = new Intl.NumberFormat('vi-VN').format(balance) + 'đ';
    document.getElementById('modal-type').innerText = type;
    document.getElementById('modal-icon').className = 'bx ' + icon;
    
    const now = new Date();
    document.getElementById('modal-month').innerText = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
    
    switchTab('analytic');

    const ctx = document.getElementById('wdChart').getContext('2d');
    if(wdChartInstance) wdChartInstance.destroy();
    const savedColor = localStorage.getItem('sw_Color') || '#7b61ff';
    wdChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
            datasets: [{
                label: 'Chi tiêu',
                data: [balance*0.1, balance*0.3, balance*0.2, balance*0.4],
                backgroundColor: savedColor,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { grid: { display: false }, border: {display: false} }
            }
        }
    });

    // In danh sách giao dịch mẫu
    const txListDiv = document.getElementById('wd-tx-list');
    const allTx = JSON.parse(localStorage.getItem('studentWalletData')) || [];
    
    txListDiv.innerHTML = '';
    if(allTx.length === 0) {
        txListDiv.innerHTML = '<div class="wd-empty-tx">Chưa có giao dịch nào ghi nhận trong hệ thống.</div>';
    } else {
        [...allTx].reverse().slice(0, 5).forEach(tx => {
            const isIncome = tx.type === 'income';
            txListDiv.innerHTML += `
                <div class="wd-tx-item">
                    <div class="wd-tx-left">
                        <span class="wd-tx-title">${tx.category} ${tx.note ? '- ' + tx.note : ''}</span>
                        <span class="wd-tx-date">${tx.date}</span>
                    </div>
                    <span class="wd-tx-amount ${isIncome ? 'text-green' : 'text-red'}">
                        ${isIncome ? '+' : '-'}${new Intl.NumberFormat('vi-VN').format(tx.amount)}đ
                    </span>
                </div>
            `;
        });
    }
}

function closeModal() {
    document.getElementById('walletDetailModal').style.display = 'none';
}

function switchTab(tab) {
    const container = document.getElementById('wd-switch');
    container.setAttribute('data-active', tab);
    document.getElementById('btn-analytic').classList.remove('active');
    document.getElementById('btn-detail').classList.remove('active');
    document.getElementById('btn-' + tab).classList.add('active');
    document.getElementById('tab-analytic').classList.remove('active');
    document.getElementById('tab-detail').classList.remove('active');
    document.getElementById('tab-' + tab).classList.add('active');
}

// Bấm ra ngoài vùng tối để đóng modal
window.onclick = function(event) {
    const modal = document.getElementById('walletDetailModal');
    if (event.target === modal) {
        closeModal();
    }
}