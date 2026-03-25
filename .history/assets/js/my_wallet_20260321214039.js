document.addEventListener('DOMContentLoaded', () => {

    const dateElement = document.getElementById('current-date');
    dateElement.textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // HÀM TÍNH TOÁN VÀ HIỂN THỊ VÍ
    function renderWallets() {
        const container = document.getElementById('wallets-list-container');
        if(!container) return;
        
        // 1. Lấy dữ liệu Ví chính (Bao gồm số dư ban đầu)
        const savedTrans = localStorage.getItem('studentWalletData');
        let transactions = savedTrans ? JSON.parse(savedTrans) : [];
        let totalIncome = 0; 
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            if (t.type === 'expense') totalExpense += t.amount;
        });
        const mainBalance = totalIncome - totalExpense;

        // 2. Lấy dữ liệu Ví phụ
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

        // 3. Tính toán Tổng
        let totalAssets = mainBalance + totalCustomBalance; // Tổng tài sản
        let netWorth = totalAssets - totalDebt;             // Tài sản ròng

        document.getElementById('net-worth-val').textContent = formatMoney(netWorth);
        document.getElementById('assets-val').textContent = formatMoney(totalAssets); 
        document.getElementById('debts-val').textContent = formatMoney(totalDebt);
        
        container.innerHTML = ''; 

        // 4. In Ví Chính
        const defaultIcon = localStorage.getItem('sw_Icon') || 'bx-football';
        const defaultName = localStorage.getItem('sw_BookName') || 'Tiền mặt (Ví chính)';

        container.innerHTML += `
            <div class="wallet-card-main" style="border-color: var(--primary);">
                <div class="icon-box"><i class='bx ${defaultIcon}'></i></div>
                <div class="w-details">
                    <span>Mặc định</span>
                    <h4>${defaultName}</h4>
                    <p>${formatMoney(mainBalance)}</p>
                </div>
            </div>
        `;

        // 5. In các ví người dùng tự tạo
        const icons = {
            'Tiền mặt': 'bx-money',
            'Thẻ': 'bx-credit-card',
            'Đầu tư': 'bx-line-chart',
            'Nợ': 'bx-receipt'
        };

        customWallets.forEach(w => {
            const colorClass = w.type === 'Nợ' ? 'text-red' : '';
            container.innerHTML += `
                <div class="wallet-card-main">
                    <div class="icon-box"><i class='bx ${icons[w.type] || 'bx-wallet'}'></i></div>
                    <div class="w-details">
                        <span>Tùy chỉnh</span>
                        <h4>${w.name}</h4>
                        <p class="${colorClass}">${formatMoney(w.balance)}</p>
                    </div>
                </div>
            `;
        });
    }

    // Chạy khi vừa vào trang
    renderWallets();

    // XỬ LÝ MODAL THÊM VÍ
    const btnOpenModal = document.getElementById('btn-open-wallet-modal');
    const modalWallet = document.getElementById('wallet-modal-popup');
    const step1 = document.getElementById('modal-step-1');
    const step2 = document.getElementById('modal-step-2');
    const typeBoxes = document.querySelectorAll('.type-box');

    // Mở modal
    btnOpenModal.addEventListener('click', () => {
        modalWallet.classList.add('active');
        step1.style.display = 'block';
        step2.style.display = 'none';
        typeBoxes.forEach(b => b.classList.remove('selected'));
    });

    // Đóng modal khi bấm ra ngoài vùng đen
    window.addEventListener('click', (e) => {
        if (e.target === modalWallet) {
            modalWallet.classList.remove('active');
        }
    });

    // Chọn loại ví
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

    // LƯU VÍ MỚI
    document.getElementById('btn-save-new-wallet').addEventListener('click', () => {
        const walletName = document.getElementById('inp-w-name').value;
        const walletBalance = parseFloat(document.getElementById('inp-w-balance').value) || 0;
        
        const selectedBox = document.querySelector('.type-box.selected');
        const walletType = selectedBox ? selectedBox.getAttribute('data-wallet') : 'Khác';

        if(walletName.trim() === '') {
            alert('Vui lòng nhập tên ví!');
            return;
        }

        const savedWallets = localStorage.getItem('studentWalletList');
        let customWallets = savedWallets ? JSON.parse(savedWallets) : [];

        customWallets.push({
            id: Date.now(),
            name: walletName,
            type: walletType,
            balance: walletBalance
        });

        localStorage.setItem('studentWalletList', JSON.stringify(customWallets));

        // Reset & đóng form
        document.getElementById('inp-w-name').value = '';
        document.getElementById('inp-w-balance').value = '';
        modalWallet.classList.remove('active');

        // Render lại danh sách ví
        renderWallets();
    });
});