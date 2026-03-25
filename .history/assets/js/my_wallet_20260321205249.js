document.addEventListener('DOMContentLoaded', () => {

    // 1. Hiển thị ngày tháng
    const dateElement = document.getElementById('current-date');
    const todayDate = new Date();
    dateElement.textContent = todayDate.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });

    // 2. Format tiền tệ
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // 3. ĐỒNG BỘ SỐ TIỀN TỪ LỊCH SỬ GIAO DỊCH (GIỐNG TRANG CHỦ)
    function syncBalance() {
        const savedData = localStorage.getItem('studentWalletData');
        let transactions = savedData ? JSON.parse(savedData) : [];
        
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            if (t.type === 'expense') totalExpense += t.amount;
        });

        const currentBalance = totalIncome - totalExpense;

        // Cập nhật lên màn hình Ví tiền
        document.getElementById('net-worth-val').textContent = formatMoney(currentBalance);
        document.getElementById('assets-val').textContent = formatMoney(totalIncome); // Tạm tính tổng thu là tổng tài sản
        document.getElementById('debts-val').textContent = '0 đ'; // Nếu sau này có tính nợ thì update ở đây
        
        // Cập nhật cho "Ví chính (Tiền mặt)"
        document.getElementById('main-wallet-balance').textContent = formatMoney(currentBalance);
    }

    syncBalance();

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
            
            // Chuyển sang bước nhập thông tin
            setTimeout(() => {
                step1.style.display = 'none';
                step2.style.display = 'block';
                document.getElementById('inp-w-name').focus();
            }, 300);
        });
    });

    // Nút Lưu ví mới (Tạm thời chỉ đóng modal và báo thành công)
    document.getElementById('btn-save-new-wallet').addEventListener('click', () => {
        const walletName = document.getElementById('inp-w-name').value;
        if(walletName.trim() === '') {
            alert('Vui lòng nhập tên ví!');
            return;
        }
        alert('Tạo ví ' + walletName + ' thành công! (Tính năng lưu sẽ được cập nhật sau)');
        modalWallet.classList.remove('active');
    });
});