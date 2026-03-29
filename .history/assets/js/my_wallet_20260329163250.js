// 1. BIẾN TOÀN CỤC ĐỂ QUẢN LÝ BIỂU ĐỒ
let wdChartInstance = null;

// 2. THIẾT LẬP MÀU CHỦ ĐẠO NGAY KHI TẢI TRANG
const savedColor = localStorage.getItem('sw_Color');
if (savedColor) {
    document.documentElement.style.setProperty('--primary', savedColor);
    document.documentElement.style.setProperty('--primary-dark', savedColor);
    document.documentElement.style.setProperty('--user-theme', savedColor);
    document.documentElement.style.setProperty('--user-theme-light', savedColor + '1A'); 
}

document.addEventListener('DOMContentLoaded', () => {

    // 3. HIỂN THỊ NGÀY THÁNG HIỆN TẠI
    const dateElement = document.getElementById('current-date');
    if(dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    // 4. HÀM ĐỊNH DẠNG TIỀN TỆ VNĐ
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // 5. HÀM HIỂN THỊ DANH SÁCH VÍ (ĐÃ TÍCH HỢP CLICK MỞ CHI TIẾT)
    function renderWallets() {
        const container = document.getElementById('wallets-list-container');
        if(!container) return;
        
        // Tính toán số dư từ giao dịch (Ví chính)
        const savedTrans = localStorage.getItem('studentWalletData');
        let transactions = savedTrans ? JSON.parse(savedTrans) : [];
        let totalIncome = 0; 
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            if (t.type === 'expense') totalExpense += t.amount;
        });
        const mainBalance = totalIncome - totalExpense;

        // Lấy danh sách ví phụ người dùng tạo thêm
        const savedWallets = localStorage.getItem('studentWalletList');
        let customWallets = savedWallets ? JSON.parse(savedWallets) : [];

        let totalCustomBalance = 0;
        let totalDebt = 0;

        customWallets.forEach(w => {
            if(w.type === 'Nợ') {
                totalDebt += w.balance;
            } else {
                totalCustomBalance += w.balance;
            }
        });

        // Cập nhật các thẻ thống kê tài sản ở trên cùng
        let totalAssets = mainBalance + totalCustomBalance; 
        let netWorth = totalAssets - totalDebt;             

        const netWorthVal = document.getElementById('net-worth-val');
        const assetsVal = document.getElementById('assets-val');
        const debtsVal = document.getElementById('debts-val');
        if(netWorthVal) netWorthVal.textContent = formatMoney(netWorth);
        if(assetsVal) assetsVal.textContent = formatMoney(totalAssets); 
        if(debtsVal) debtsVal.textContent = formatMoney(totalDebt);
        
        container.innerHTML = ''; 

        // RENDER VÍ MẶC ĐỊNH
        const defaultIcon = localStorage.getItem('sw_Icon') || 'bx-wallet';
        const defaultName = localStorage.getItem('sw_BookName') || 'Ví chính';

        container.innerHTML += `
            <div class="wallet-card-main" onclick="openDetailModal('${defaultName}', ${mainBalance}, 'Tiền mặt', '${defaultIcon}')" style="border: 1px solid var(--primary); border-left: 6px solid var(--primary);">
                <div class="icon-box"><i class='bx ${defaultIcon}'></i></div>
                <div class="w-details">
                    <span style="background: var(--user-theme-light); color: var(--primary); padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">Mặc định</span>
                    <h4 style="margin: 6px 0 2px; font-size: 1.1rem; color: var(--text-main);">${defaultName}</h4>
                    <p style="color: var(--primary); font-size: 1.2rem; font-weight: bold; margin: 0;">${formatMoney(mainBalance)}</p>
                </div>
            </div>
        `;

        // RENDER CÁC VÍ PHỤ (TÙY CHỈNH)
        const iconsMap = {
            'Tiền mặt': 'bx-money',
            'Thẻ': 'bx-credit-card',
            'Đầu tư': 'bx-line-chart',
            'Nợ': 'bx-receipt'
        };

        customWallets.forEach(w => {
            const isDebt = w.type === 'Nợ';
            const colorCode = isDebt ? '#ef4444' : 'var(--primary)';
            const iconClass = iconsMap[w.type] || 'bx-wallet';
            
            container.innerHTML += `
                <div class="wallet-card-main" onclick="openDetailModal('${w.name}', ${w.balance}, '${w.type}', '${iconClass}')" style="border: 1px solid var(--border); border-left: 6px solid ${colorCode};">
                    <div class="icon-box" style="color: ${colorCode};"><i class='bx ${iconClass}'></i></div>
                    <div class="w-details">
                        <span style="background: var(--user-theme-light); padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;">${w.type}</span>
                        <h4 style="margin: 6px 0 2px; font-size: 1.1rem;">${w.name}</h4>
                        <p style="color: ${colorCode}; font-size: 1.2rem; font-weight: bold; margin: 0;">${formatMoney(w.balance)}</p>
                    </div>
                </div>
            `;
        });
    }

    renderWallets();

    // 6. LOGIC MỞ MODAL THÊM VÍ MỚI
    const btnOpenModal = document.getElementById('btn-open-wallet-modal');
    const modalWallet = document.getElementById('wallet-modal-popup');
    const step1 = document.getElementById('modal-step-1');
    const step2 = document.getElementById('modal-step-2');
    const typeBoxes = document.querySelectorAll('.type-box');

    if(btnOpenModal && modalWallet) {
        btnOpenModal.addEventListener('click', () => {
            modalWallet.classList.add('active');
            step1.style.display = 'block';
            step2.style.display = 'none';
            typeBoxes.forEach(b => b.classList.remove('selected'));
        });

        window.addEventListener('click', (e) => {
            if (e.target === modalWallet) modalWallet.classList.remove('active');
        });
    }

    typeBoxes.forEach(box => {
        box.addEventListener('click', function() {
            typeBoxes.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            setTimeout(() => {
                step1.style.display = 'none';
                step2.style.display = 'block';
                document.getElementById('inp-w-name').focus();
            }, 300);
        });
    });

    // 7. LƯU VÍ MỚI VÀO LOCALSTORAGE
    const btnSaveNewWallet = document.getElementById('btn-save-new-wallet');
    if(btnSaveNewWallet) {
        btnSaveNewWallet.addEventListener('click', () => {
            const walletName = document.getElementById('inp-w-name').value;
            const walletBalance = parseFloat(document.getElementById('inp-w-balance').value) || 0;
            const selectedBox = document.querySelector('.type-box.selected');
            const walletType = selectedBox ? selectedBox.getAttribute('data-wallet') : 'Khác';

            if(walletName.trim() === '') return alert('Vui lòng nhập tên ví!');

            const savedWallets = localStorage.getItem('studentWalletList');
            let customWallets = savedWallets ? JSON.parse(savedWallets) : [];
            customWallets.push({ id: Date.now(), name: walletName, type: walletType, balance: walletBalance });

            localStorage.setItem('studentWalletList', JSON.stringify(customWallets));
            modalWallet.classList.remove('active');
            renderWallets();
        });
    }

    // 8. ĐIỀU KHIỂN SIDEBAR MOBILE
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if(menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // 9. HIỂN THỊ THÔNG BÁO (DROPDOWN)
    const notifBtn = document.getElementById('notification-btn');
    const notifDropdown = document.getElementById('notification-dropdown');
    if(notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            notifDropdown.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) notifDropdown.classList.remove('show');
        });
    }

    // 10. CHẾ ĐỘ SÁNG/TỐI (DARK MODE)
    const themeToggle = document.getElementById('theme-toggle');
    if(themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (localStorage.getItem('sw_Theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if(icon) icon.classList.replace('bx-moon', 'bx-sun');
        }
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                if(icon) icon.classList.replace('bx-sun', 'bx-moon');
                localStorage.setItem('sw_Theme', 'light'); 
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                if(icon) icon.classList.replace('bx-moon', 'bx-sun');
                localStorage.setItem('sw_Theme', 'dark'); 
            }
        });
    }
});

// --- CÁC HÀM XỬ LÝ CHI TIẾT VÍ (MỚI TÍCH HỢP) ---

// Mở bảng chi tiết khi nhấn vào một cái ví
function openDetailModal(name, balance, type, icon) {
    const modal = document.getElementById('walletDetailModal');
    if(!modal) return;

    modal.style.display = 'flex';
    document.getElementById('modal-name').innerText = name;
    document.getElementById('modal-balance').innerText = new Intl.NumberFormat('vi-VN').format(balance) + 'đ';
    document.getElementById('modal-type').innerText = type;
    document.getElementById('modal-icon').className = 'bx ' + icon;
    
    switchDetailTab('analytic'); // Mặc định mở tab Phân tích
    initDetailChart(balance);    // Vẽ biểu đồ dựa trên số dư
    renderDetailTransactions(); // Hiện lịch sử giao dịch
}

// Đóng bảng chi tiết
function closeDetailModal() {
    document.getElementById('walletDetailModal').style.display = 'none';
}

// Chuyển đổi giữa tab "Phân tích" và "Chi tiết" trong Modal
function switchDetailTab(tab) {
    const container = document.getElementById('wd-switch-detail');
    if(!container) return;

    container.setAttribute('data-active', tab);
    // Xóa active cũ
    document.querySelectorAll('#btn-analytic-det, #btn-detail-det, #tab-analytic-det, #tab-detail-det').forEach(el => el.classList.remove('active'));
    // Thêm active mới
    document.getElementById('btn-' + tab + '-det').classList.add('active');
    document.getElementById('tab-' + tab + '-det').classList.add('active');
}

// Khởi tạo biểu đồ Chart.js
function initDetailChart(balance) {
    const ctx = document.getElementById('wdChart').getContext('2d');
    if(wdChartInstance) wdChartInstance.destroy(); // Xóa biểu đồ cũ nếu có

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#7b61ff';

    wdChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
            datasets: [{
                label: 'Biến động',
                data: [balance*0.05, balance*0.12, balance*0.08, balance*0.2], // Dữ liệu giả lập
                backgroundColor: primaryColor,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { grid: { display: false }, border: {display: false} }
            }
        }
    });
}

// Hiển thị lịch sử giao dịch trong Modal Chi tiết
function renderDetailTransactions() {
    const listDiv = document.getElementById('wd-tx-list');
    const allTx = JSON.parse(localStorage.getItem('studentWalletData')) || [];
    
    if(allTx.length === 0) {
        listDiv.innerHTML = '<div style="text-align:center; padding:30px; color:#94a3b8;">Chưa có giao dịch nào.</div>';
    } else {
        // Lấy 5 giao dịch gần nhất
        listDiv.innerHTML = [...allTx].reverse().slice(0, 5).map(tx => `
            <div class="wd-tx-item" style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px; border-radius: 15px; margin-bottom: 10px;">
                <div style="text-align: left;">
                    <strong style="display:block; color: #1e293b;">${tx.category}</strong>
                    <small style="color: #94a3b8;">${tx.date}</small>
                </div>
                <span class="${tx.type === 'income' ? 'text-green' : 'text-red'}" style="font-weight: 700;">
                    ${tx.type === 'income' ? '+' : '-'}${new Intl.NumberFormat('vi-VN').format(tx.amount)}đ
                </span>
            </div>
        `).join('');
    }
}