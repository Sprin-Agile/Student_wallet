document.addEventListener('DOMContentLoaded', () => {

    // 1. Hiển thị ngày tháng
    const dateElement = document.getElementById('current-date');
    const todayDate = new Date();
    dateElement.textContent = todayDate.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });

    // 2. Format tiền tệ
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // 3. HÀM TÍNH TOÁN VÀ HIỂN THỊ VÍ
    function renderWallets() {
        const container = document.getElementById('wallets-list-container');
        
        // --- A. Lấy dữ liệu giao dịch từ trang chủ để tính Ví Chính ---
        const savedTrans = localStorage.getItem('studentWalletData');
        let transactions = savedTrans ? JSON.parse(savedTrans) : [];
        let totalIncome = 0; 
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            if (t.type === 'expense') totalExpense += t.amount;
        });
        const mainBalance = totalIncome - totalExpense;

        // --- B. Lấy dữ liệu các ví tạo thêm ---
        const savedWallets = localStorage.getItem('studentWalletList');
        let customWallets = savedWallets ? JSON.parse(savedWallets) : [];

        // --- C. Tính tổng tài sản ---
        let totalCustomBalance = 0;
        let totalDebt = 0;

        customWallets.forEach(w => {
            if(w.type === 'Nợ') {
                totalDebt += w.balance;
            } else {
                totalCustomBalance += w.balance;
            }
        });

        // Tài sản ròng = Tiền ví chính + Tiền ví phụ - Nợ
        let netWorth = mainBalance + totalCustomBalance - totalDebt;

        // Cập nhật các con số thống kê trên cùng
        document.getElementById('net-worth-val').textContent = formatMoney(netWorth);
        document.getElementById('assets-val').textContent = formatMoney(totalIncome + totalCustomBalance); 
        document.getElementById('debts-val').textContent = formatMoney(totalDebt);
        
        // --- D. In các thẻ (card) ví ra màn hình ---
        container.innerHTML = ''; // Xóa sạch để in lại từ đầu

        // 1. In Ví Chính (Giao diện mới)
        container.innerHTML += `
            <div class="wallet-card-main">
                <div class="icon-box"><i class='bx bx-football'></i></div>
                <div class="w-details">
                    <span>Mặc định</span>
                    <h4>Tiền mặt (Ví chính)</h4>
                    <p>${formatMoney(mainBalance)}</p>
                </div>
            </div>
        `;

        // 2. In các ví người dùng tự tạo (Giao diện mới)
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

    // Chạy hàm hiển thị khi vừa load trang
    renderWallets();

    // 4. XỬ LÝ MODAL THÊM VÍ MỚI
    const btnOpenModal = document.getElementById('btn-open-wallet-modal');
    const modalWallet = document.getElementById('wallet-modal-popup');
    const btnCloseModal = document.getElementById('close-modal-x');
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

    // Đóng modal
    btnCloseModal.addEventListener('click', () => {
        modalWallet.classList.remove('active');
    });

    // Chọn loại ví (Chuyển từ bước 1 sang bước 2)
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

    // --- LƯU VÍ MỚI VÀO HỆ THỐNG ---
    document.getElementById('btn-save-new-wallet').addEventListener('click', () => {
        const walletName = document.getElementById('inp-w-name').value;
        const walletBalance = parseFloat(document.getElementById('inp-w-balance').value) || 0;
        
        // Lấy loại ví đang được chọn (Thẻ, Tiền mặt, Nợ...)
        const selectedBox = document.querySelector('.type-box.selected');
        const walletType = selectedBox ? selectedBox.getAttribute('data-wallet') : 'Khác';

        if(walletName.trim() === '') {
            alert('Vui lòng nhập tên ví!');
            return;
        }

        // Lấy danh sách ví cũ
        const savedWallets = localStorage.getItem('studentWalletList');
        let customWallets = savedWallets ? JSON.parse(savedWallets) : [];

        // Thêm ví mới vào mảng
        customWallets.push({
            id: Date.now(),
            name: walletName,
            type: walletType,
            balance: walletBalance
        });

        // Lưu lại vào LocalStorage
        localStorage.setItem('studentWalletList', JSON.stringify(customWallets));

        // Reset form và đóng form
        document.getElementById('inp-w-name').value = '';
        document.getElementById('inp-w-balance').value = '';
        modalWallet.classList.remove('active');

        // Cập nhật lại giao diện ngay lập tức
        renderWallets();
    });
});