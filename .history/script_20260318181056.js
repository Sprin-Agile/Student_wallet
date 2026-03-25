document.addEventListener('DOMContentLoaded', () => {
    // 1. Hiển thị ngày hiện tại
    const dateElement = document.getElementById('current-date');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = new Date().toLocaleDateString('vi-VN', options);

    // 2. Dark Mode Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;
    const icon = themeToggle.querySelector('i');

    themeToggle.addEventListener('click', () => {
        const isDark = root.getAttribute('data-theme') === 'dark';
        if (isDark) {
            root.removeAttribute('data-theme');
            icon.classList.replace('bx-sun', 'bx-moon');
        } else {
            root.setAttribute('data-theme', 'dark');
            icon.classList.replace('bx-moon', 'bx-sun');
        }
        updateChartTheme(isDark ? '#94a3b8' : '#6b7280', isDark ? '#334155' : '#e5e7eb');
    });

    // 3. Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // 4. Fake Data: Lịch sử giao dịch
    const transactions = [
        { date: '18/03/2026', category: 'Ăn uống 🍜', note: 'Ăn trưa Phúc Long', amount: -55000, type: 'expense' },
        { date: '17/03/2026', category: 'Học phí/Sách vở 📚', note: 'Mua giáo trình JS', amount: -150000, type: 'expense' },
        { date: '16/03/2026', category: 'Khác 📦', note: 'Mẹ gửi tiền tiêu', amount: 2000000, type: 'income' },
        { date: '15/03/2026', category: 'Tiền trọ 🏠', note: 'Đóng tiền điện', amount: -200000, type: 'expense' },
    ];

    const tbody = document.getElementById('transaction-list');
    
    // Hàm format tiền tệ VNĐ
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Hàm render bảng giao dịch
    const renderTransactions = () => {
        tbody.innerHTML = '';
        transactions.forEach(t => {
            const amountClass = t.type === 'income' ? 'text-green' : 'text-red';
            const amountPrefix = t.type === 'income' ? '+' : '';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.date}</td>
                <td><span class="cat-badge">${t.category}</span></td>
                <td>${t.note}</td>
                <td class="text-right ${amountClass}"><strong>${amountPrefix}${formatMoney(Math.abs(t.amount))}</strong></td>
            `;
            tbody.appendChild(tr);
        });
    };
    renderTransactions();

    // 5. Xử lý Form Thêm giao dịch (Micro-interaction)
    const form = document.getElementById('transaction-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const type = document.querySelector('input[name="trans-type"]:checked').value;
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').options[document.getElementById('category').selectedIndex].text;
        const note = document.getElementById('note').value || 'Không có ghi chú';
        
        // Thêm data giả vào đầu mảng
        const today = new Date().toLocaleDateString('vi-VN');
        const real