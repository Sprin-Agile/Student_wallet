
const savedColor = localStorage.getItem('sw_Color') || '#4facfe';
document.documentElement.style.setProperty('--primary', savedColor);
document.documentElement.style.setProperty('--primary-dark', savedColor);
document.documentElement.style.setProperty('--user-theme', savedColor);
document.documentElement.style.setProperty('--user-theme-light', savedColor + '1A');

document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    let currentTheme = localStorage.getItem('sw_Theme') || 'light';
    const currentUser = localStorage.getItem('sw_currentUser');

    function applyGlobalTheme() {
        if (currentTheme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }

        const logo = document.querySelector('.logo');
        if (logo) {
            logo.style.setProperty('color', savedColor, 'important');
            logo.querySelectorAll('span, i').forEach(el => el.style.setProperty('color', savedColor, 'important'));
        }
    }
    applyGlobalTheme();

    const dateElement = document.getElementById('current-date');
    if (dateElement) dateElement.textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });

    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', () => { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); });
        overlay.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); });
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        themeToggle.addEventListener('click', () => {
            currentTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', currentTheme === 'dark' ? 'dark' : '');
            localStorage.setItem('sw_Theme', currentTheme);
            if (icon) icon.classList.replace(currentTheme === 'dark' ? 'bx-moon' : 'bx-sun', currentTheme === 'dark' ? 'bx-sun' : 'bx-moon');
            applyGlobalTheme();
        });
    }

    let transactions = [];
    let wallets = [];

    const categories = {
        expense: ['Ăn uống 🍜', 'Tiền trọ 🏠', 'Học phí/Sách vở 📚', 'Di chuyển 🛵', 'Giải trí 🎮', 'Khác 📦'],
        income: ['Bố mẹ gửi 💸', 'Lương làm thêm 💼', 'Học bổng 🎓', 'Lì xì/Thưởng 🧧', 'Khác 📦']
    };

    function updateDropdown(type) {
        const categorySelect = document.getElementById('category');
        if (categorySelect) categorySelect.innerHTML = categories[type].map(c => `<option value="${c}">${c}</option>`).join('');
    }

    async function loadData() {
        if (!currentUser) return;
        try {
            const [resTrans, resWallets] = await Promise.all([
                fetch(`${API_URL}/get_transactions`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: currentUser}) }),
                fetch(`${API_URL}/get_wallets`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: currentUser}) })
            ]);
            transactions = await resTrans.json();
            wallets = await resWallets.json();
            render();
            updateWalletSelect();
        } catch (e) { console.error("Lỗi:", e); }
    }

    function updateWalletSelect() {
        const walletSelect = document.getElementById('wallet-select');
        if (!walletSelect) return;
        const dbMainWallet = wallets.find(w => w.id === 'w_main');
        const mainName = dbMainWallet ? dbMainWallet.name : (localStorage.getItem('sw_BookName') || 'Ví chính');

        let html = `<option value="" disabled selected>-- Chọn ví giao dịch --</option>`;
        html += `<option value="w_main">${mainName} (Mặc định)</option>`;

        wallets.forEach(w => {
            if(w.id !== 'w_main') html += `<option value="${w.id}">${w.name} (${w.type})</option>`;
        });
        walletSelect.innerHTML = html;
    }

    const notifBtn = document.getElementById('notification-btn');
    const notifDropdown = document.getElementById('notification-dropdown');
    if (notifBtn && notifDropdown) {
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

    function render() {
        let inc = 0, exp = 0;
        const list = document.getElementById('transaction-list');
        const emptyState = document.getElementById('empty-state');
        if (!list) return;
        list.innerHTML = '';

        const mainName = localStorage.getItem('sw_BookName') || 'Ví chính';
        const sortedTrans = [...transactions].reverse();

        sortedTrans.forEach(t => {
            if (t.type === 'income') inc += t.amount; else exp += t.amount;
            const isIncome = t.type === 'income';
            let wInfo = wallets.find(w => w.id === t.walletId);
            let displayWalletName = wInfo ? wInfo.name : mainName;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.date}</td>
                <td><span class="cat-badge">${t.category}</span><br><small style="color:var(--text-muted)">${displayWalletName}</small></td>
                <td>${t.note || '-'}</td>
                <td class="text-right ${isIncome ? 'text-green' : 'text-red'}"><strong>${isIncome ? '+' : '-'}${new Intl.NumberFormat('vi-VN').format(t.amount)} ₫</strong></td>
                <td style="text-align: center;"><button class="btn-delete" data-id="${t.id}"><i class='bx bx-trash'></i></button></td>
            `;
            list.appendChild(tr);
        });

        document.getElementById('total-income').innerText = '+' + new Intl.NumberFormat('vi-VN').format(inc) + ' ₫';
        document.getElementById('total-expense').innerText = '-' + new Intl.NumberFormat('vi-VN').format(exp) + ' ₫';

        const mainBalance = parseInt(localStorage.getItem('sw_Balance')) || 0;
        const allWallets = wallets.some(w => w.id === 'w_main') ? wallets : [{id: 'w_main', name: mainName, type: 'Tiền mặt', initial_balance: mainBalance}, ...wallets];

        let totalAssetsOnly = 0;
        allWallets.forEach(w => {
            if (w.type === 'Nợ') return;
            const wTrans = transactions.filter(t => t.walletId === w.id || (w.id === 'w_main' && t.walletId === 'w_main'));
            const bal = (w.initial_balance || 0) + wTrans.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
            totalAssetsOnly += bal;
        });
        document.getElementById('total-balance').innerText = new Intl.NumberFormat('vi-VN').format(totalAssetsOnly) + ' ₫';

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = async function() {
                if(confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
                    await fetch(`${API_URL}/delete_transaction`, {
                        method: 'POST', headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ id: parseInt(this.getAttribute('data-id')), username: currentUser })
                    });
                    loadData();
                }
            };
        });

        emptyState.style.display = transactions.length === 0 ? 'block' : 'none';
    }

    updateDropdown('expense');
    loadData();

    const modal = document.getElementById('modal-overlay');
    document.getElementById('open-modal').onclick = () => modal.classList.add('active');
    document.getElementById('close-modal').onclick = () => modal.classList.remove('active');

    document.querySelectorAll('input[name="trans-type"]').forEach(radio => radio.addEventListener('change', (e) => updateDropdown(e.target.value)));

    const form = document.getElementById('transaction-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const amount = parseInt(document.getElementById('amount').value);
            if (!amount || amount <= 0) return alert("Vui lòng nhập số tiền!");
            const walletSelect = document.getElementById('wallet-select');
            const selectedWallet = walletSelect ? walletSelect.value : '';
            if (!selectedWallet) return alert("Bạn ơi, vui lòng chọn ví giao dịch nhé!");
            await fetch(`${API_URL}/add_transaction`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username: currentUser,
                    category: document.getElementById('category').value,
                    walletId: selectedWallet, // Đẩy ID ví đã chọn vào DB
                    note: document.getElementById('note').value,
                    amount: amount,
                    type: document.querySelector('input[name="trans-type"]:checked').value
                })
            });

            loadData();
            modal.classList.remove('active');
            form.reset();
            updateDropdown('expense');
            if(walletSelect) walletSelect.value = "";
        };
    }
});