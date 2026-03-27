// ==========================================
// 1. CÀI ĐẶT MÀU CHỦ ĐẠO TỪ LOCALSTORAGE
// ==========================================
const savedColor = localStorage.getItem('sw_Color');
if (savedColor) {
    document.documentElement.style.setProperty('--primary', savedColor);
    document.documentElement.style.setProperty('--user-theme', savedColor);
}

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 2. LOGIC GIAO DIỆN CHUNG (TƯƠNG TỰ HOME)
    // ==========================================
    
    // Đóng mở Menu Mobile (Sidebar)
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // Nút chuyển đổi chế độ Sáng/Tối (Dark/Light Mode)
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;

    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        
        if (localStorage.getItem('sw_Theme') === 'dark') {
            root.setAttribute('data-theme', 'dark');
            if (icon) icon.classList.replace('bx-moon', 'bx-sun');
        }

        themeToggle.addEventListener('click', () => {
            const isDark = root.getAttribute('data-theme') === 'dark';
            if (isDark) {
                root.removeAttribute('data-theme');
                if (icon) icon.classList.replace('bx-sun', 'bx-moon');
                localStorage.setItem('sw_Theme', 'light');
            } else {
                root.setAttribute('data-theme', 'dark');
                if (icon) icon.classList.replace('bx-moon', 'bx-sun');
                localStorage.setItem('sw_Theme', 'dark');
            }
        });
    }

    // ==========================================
    // 3. LOGIC XỬ LÝ GIAO DỊCH (TRANSACTION)
    // ==========================================
    
    const modal = document.getElementById('modal-overlay');
    const form = document.getElementById('transaction-form');
    const categorySelect = document.getElementById('category');
    
    // Lấy dữ liệu từ localStorage
    let transactions = JSON.parse(localStorage.getItem('studentWalletData')) || [];

    const categories = {
        expense: ['Ăn uống 🍜', 'Tiền trọ 🏠', 'Học phí/Sách vở 📚', 'Di chuyển 🛵', 'Giải trí 🎮', 'Khác 📦'],
        income: ['Bố mẹ gửi 💸', 'Lương làm thêm 💼', 'Học bổng 🎓', 'Lì xì/Thưởng 🧧', 'Khác 📦']
    };

    function updateDropdown(type) {
        if (categorySelect) {
            categorySelect.innerHTML = categories[type].map(c => `<option value="${c}">${c}</option>`).join('');
        }
    }

    function render() {
        let inc = 0, exp = 0;
        const list = document.getElementById('transaction-list');
        const emptyState = document.getElementById('empty-state');
        const table = document.getElementById('trans-table');
        
        if (!list) return;
        list.innerHTML = '';

        // Xử lý Empty State
        if (transactions.length === 0) {
            emptyState.style.display = 'block';
            table.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            table.style.display = 'table';
        }

        // Đổ dữ liệu
        const sortedTransactions = [...transactions].reverse();

        sortedTransactions.forEach(t => {
            if (t.type === 'income') inc += t.amount;
            else exp += t.amount;

            const isIncome = t.type === 'income';
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td style="padding: 15px; border-bottom: 1px solid var(--border); color: var(--text-main);">${t.date}</td>
                <td style="padding: 15px; border-bottom: 1px solid var(--border); font-weight: 500; color: var(--text-main);">${t.category}</td>
                <td style="padding: 15px; border-bottom: 1px solid var(--border); color: var(--text-muted);">${t.note || '-'}</td>
                <td style="padding: 15px; border-bottom: 1px solid var(--border); text-align: right; color: ${isIncome ? '#10b981' : '#ef4444'}; font-weight: 600;">
                    ${isIncome ? '+' : '-'}${new Intl.NumberFormat('vi-VN').format(t.amount)} ₫
                </td>
                <td style="padding: 15px; border-bottom: 1px solid var(--border); text-align: center;">
                    <button class="btn-delete" data-id="${t.id}" title="Xóa">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            `;
            list.appendChild(tr);
        });

        // Tính toán và Cập nhật Thống kê
        const balance = inc - exp;
        
        if (document.getElementById('total-income')) document.getElementById('total-income').innerText = new Intl.NumberFormat('vi-VN').format(inc) + ' ₫';
        if (document.getElementById('total-expense')) document.getElementById('total-expense').innerText = new Intl.NumberFormat('vi-VN').format(exp) + ' ₫';
        
        const balanceEl = document.getElementById('total-balance');
        if (balanceEl) {
            balanceEl.innerText = new Intl.NumberFormat('vi-VN').format(balance) + ' ₫';
            balanceEl.style.color = balance < 0 ? '#ef4444' : 'white';
        }

        // Gắn sự kiện cho các nút Xóa
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if(confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
                    transactions = transactions.filter(tx => tx.id !== id);
                    localStorage.setItem('studentWalletData', JSON.stringify(transactions));
                    render();
                }
            });
        });
    }

    // Khởi tạo mặc định
    updateDropdown('expense');
    render();

    // Xử lý Form
    document.getElementById('open-modal').onclick = () => modal.classList.add('active');
    document.getElementById('close-modal').onclick = () => modal.classList.remove('active');

    document.querySelectorAll('input[name="trans-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => updateDropdown(e.target.value));
    });

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const type = document.querySelector('input[name="trans-type"]:checked').value;
            const amount = parseInt(document.getElementById('amount').value);
            
            if (!amount || amount <= 0) {
                alert("Vui lòng nhập số tiền hợp lệ!");
                return;
            }
            
            const newEntry = {
                id: Date.now(),
                date: new Date().toLocaleDateString('vi-VN'),
                category: categorySelect.value,
                note: document.getElementById('note').value,
                amount: amount,
                type: type
            };

            transactions.push(newEntry);
            localStorage.setItem('studentWalletData', JSON.stringify(transactions));
            
            render();
            modal.classList.remove('active');
            form.reset();
            updateDropdown('expense'); 
        };
    }
});