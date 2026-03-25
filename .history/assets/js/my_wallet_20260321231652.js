
const savedColor = localStorage.getItem('sw_Color');
if (savedColor) {
    document.documentElement.style.setProperty('--primary', savedColor);
    document.documentElement.style.setProperty('--primary-dark', savedColor);
    document.documentElement.style.setProperty('--user-theme', savedColor);
    document.documentElement.style.setProperty('--user-theme-light', savedColor + '1A'); 
}

document.addEventListener('DOMContentLoaded', () => {

    const dateElement = document.getElementById('current-date');
    if(dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // --- 2. HÀM TÍNH TOÁN VÀ HIỂN THỊ VÍ ---
    function renderWallets() {
        const container = document.getElementById('wallets-list-container');
        if(!container) return;
        
        const savedTrans = localStorage.getItem('studentWalletData');
        let transactions = savedTrans ? JSON.parse(savedTrans) : [];
        let totalIncome = 0; 
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            if (t.type === 'expense') totalExpense += t.amount;
        });
        const mainBalance = totalIncome - totalExpense;

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

        let totalAssets = mainBalance + totalCustomBalance; 
        let netWorth = totalAssets - totalDebt;             

        // Cập nhật thống kê
        const netWorthVal = document.getElementById('net-worth-val');
        const assetsVal = document.getElementById('assets-val');
        const debtsVal = document.getElementById('debts-val');
        if(netWorthVal) netWorthVal.textContent = formatMoney(netWorth);
        if(assetsVal) assetsVal.textContent = formatMoney(totalAssets); 
        if(debtsVal) debtsVal.textContent = formatMoney(totalDebt);
        
        container.innerHTML = ''; 

        // IN VÍ CHÍNH (Giao diện thẻ ví xịn xò có viền, bóng, sọc đậm)
        const defaultIcon = localStorage.getItem('sw_Icon') || 'bx-football';
        const defaultName = localStorage.getItem('sw_BookName') || 'Tiền mặt (Ví chính)';

        container.innerHTML += `
            <div class="wallet-card-main" style="border: 1px solid var(--primary); border-left: 6px solid var(--primary);">
                <div class="icon-box"><i class='bx ${defaultIcon}'></i></div>
                <div class="w-details">
                    <span style="background: var(--user-theme-light); color: var(--primary); padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">Mặc định</span>
                    <h4 style="margin: 6px 0 2px; font-size: 1.1rem; color: var(--text-main);">${defaultName}</h4>
                    <p style="color: var(--primary); font-size: 1.2rem; font-weight: bold; margin: 0;">${formatMoney(mainBalance)}</p>
                </div>
            </div>
        `;

        // IN CÁC VÍ TÙY CHỈNH
        const icons = {
            'Tiền mặt': 'bx-money',
            'Thẻ': 'bx-credit-card',
            'Đầu tư': 'bx-line-chart',
            'Nợ': 'bx-receipt'
        };

        customWallets.forEach(w => {
            const isDebt = w.type === 'Nợ';
            
            // NẾU LÀ NỢ THÌ MÀU ĐỎ, CÒN LẠI LẤY MÀU CHỦ ĐẠO
            const colorCode = isDebt ? 'var(--accent-red)' : 'var(--primary)';
            const borderLeftColor = isDebt ? 'var(--accent-red)' : 'var(--primary)';
            const iconBg = isDebt ? 'rgba(239, 68, 68, 0.1)' : 'var(--user-theme-light)';
            const iconColor = isDebt ? 'var(--accent-red)' : 'var(--primary)';
            const spanBg = isDebt ? 'rgba(239, 68, 68, 0.1)' : 'var(--user-theme-light)';
            
            container.innerHTML += `
                <div class="wallet-card-main" style="border: 1px solid var(--border); border-left: 6px solid ${borderLeftColor};">
                    <div class="icon-box" style="background: ${iconBg}; color: ${iconColor};"><i class='bx ${icons[w.type] || 'bx-wallet'}'></i></div>
                    <div class="w-details">
                        <span style="background: ${spanBg}; color: ${colorCode}; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">${w.type}</span>
                        <h4 style="margin: 6px 0 2px; font-size: 1.1rem; color: var(--text-main);">${w.name}</h4>
                        <p style="color: ${colorCode}; font-size: 1.2rem; font-weight: bold; margin: 0;">${formatMoney(w.balance)}</p>
                    </div>
                </div>
            `;
        });
    }

    renderWallets();

    // --- 3. XỬ LÝ MODAL HỘP NỔI THÊM VÍ ---
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
            if (e.target === modalWallet) {
                modalWallet.classList.remove('active');
            }
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

    const btnSaveNewWallet = document.getElementById('btn-save-new-wallet');
    if(btnSaveNewWallet) {
        btnSaveNewWallet.addEventListener('click', () => {
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

            document.getElementById('inp-w-name').value = '';
            document.getElementById('inp-w-balance').value = '';
            modalWallet.classList.remove('active');

            renderWallets();
        });
    }

    // --- 4. MENU MOBILE ---
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

    // --- 5. ĐÓNG MỞ THÔNG BÁO ---
    const notifBtn = document.getElementById('notification-btn');
    const notifDropdown = document.getElementById('notification-dropdown');

    if(notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            notifDropdown.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
                notifDropdown.classList.remove('show');
            }
        });
    }

    // --- 6. MODE DARK / LIGHT ---
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;
    
    if(themeToggle) {
        const icon = themeToggle.querySelector('i');

        if (localStorage.getItem('sw_Theme') === 'dark') {
            root.setAttribute('data-theme', 'dark');
            if(icon) icon.classList.replace('bx-moon', 'bx-sun');
        }

        themeToggle.addEventListener('click', () => {
            const isDark = root.getAttribute('data-theme') === 'dark';
            if (isDark) {
                root.removeAttribute('data-theme');
                if(icon) icon.classList.replace('bx-sun', 'bx-moon');
                localStorage.setItem('sw_Theme', 'light'); 
            } else {
                root.setAttribute('data-theme', 'dark');
                if(icon) icon.classList.replace('bx-moon', 'bx-sun');
                localStorage.setItem('sw_Theme', 'dark'); 
            }
        });
    }
});