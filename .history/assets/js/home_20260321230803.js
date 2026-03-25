const savedColor = localStorage.getItem('sw_Color');
if (savedColor) {
    document.documentElement.style.setProperty('--primary', savedColor);
    document.documentElement.style.setProperty('--primary-dark', savedColor);
    document.documentElement.style.setProperty('--user-theme', savedColor);
    document.documentElement.style.setProperty('--user-theme-light', savedColor + '1A'); 
}
document.addEventListener('DOMContentLoaded', () => {

    // Hiển thị ngày tháng
    const dateElement = document.getElementById('current-date');
    const todayDate = new Date();
    const options = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
    dateElement.textContent = todayDate.toLocaleDateString('vi-VN', options);

    // --- MENU MOBILE ---
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // --- đóng mở thông báo ---
    const notifBtn = document.getElementById('notification-btn');
    const notifDropdown = document.getElementById('notification-dropdown');

    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        notifDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
            notifDropdown.classList.remove('show');
        }
    });

    // --- MODE DARK LIGHT ---
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

    // --- QUẢN LÝ DANH MỤC ---
    const categorySelect = document.getElementById('category');
    const typeRadios = document.querySelectorAll('input[name="trans-type"]');
    
    const categories = {
        expense: ['Ăn uống 🍜', 'Tiền trọ 🏠', 'Học phí/Sách vở 📚', 'Di chuyển 🛵', 'Giải trí 🎮', 'Khác 📦'],
        income: ['Bố mẹ gửi 💸', 'Lương làm thêm 💼', 'Học bổng 🎓', 'Lì xì/Thưởng 🧧', 'Khác 📦']
    };

    function updateCategoryDropdown(type) {
        categorySelect.innerHTML = '';
        categories[type].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }

    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateCategoryDropdown(e.target.value);
        });
    });

    updateCategoryDropdown('expense');

    // --- DATA & LOGIC TÍNH TOÁN ---
    const savedData = localStorage.getItem('studentWalletData');
    let transactions = [];

    if (savedData) {
        // Nếu đã có dữ liệu giao dịch từ trước thì lấy ra dùng
        transactions = JSON.parse(savedData);
    } else {
        // Kiểm tra xem có phải người dùng mới từ trang index chuyển qua không
        const isNewAccount = localStorage.getItem('sw_NewAccount');
        
        if (isNewAccount === 'true') {
            // Lấy số dư ban đầu từ index, nếu không nhập thì mặc định là 0
            const initialBalance = parseFloat(localStorage.getItem('sw_Balance')) || 0;
            
            if (initialBalance > 0) {
                // Khởi tạo giao dịch đầu tiên là "Số dư ban đầu"
                transactions = [
                    { 
                        id: Date.now(), 
                        date: todayDate.toLocaleDateString('vi-VN'), 
                        category: 'Khác 📦', 
                        note: 'Số dư ban đầu', 
                        amount: initialBalance, 
                        type: 'income' 
                    }
                ];
            }
            
            // Xóa cờ tạo mới và lưu lại vào data chính để các lần F5 sau không bị lặp lại
            localStorage.removeItem('sw_NewAccount');
            localStorage.setItem('studentWalletData', JSON.stringify(transactions));
        } else {
            // Dữ liệu mẫu hiển thị nếu lỡ vào thẳng index.html mà không qua onboarding
            transactions = [
                { id: 1, date: todayDate.toLocaleDateString('vi-VN'), category: 'Bố mẹ gửi 💸', note: 'Tiền sinh hoạt tháng', amount: 3000000, type: 'income' },
                { id: 2, date: todayDate.toLocaleDateString('vi-VN'), category: 'Tiền trọ 🏠', note: 'Đóng tiền phòng', amount: 1500000, type: 'expense' }
            ];
        }
    }

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // --- QUẢN LÝ MỤC TIÊU TIẾT KIỆM ---
    const goalForm = document.getElementById('goal-form');
    const goalNameInput = document.getElementById('goal-name');
    const goalAmountInput = document.getElementById('goal-amount');
    const progressContainer = document.getElementById('goal-progress-container');
    const progressBar = document.getElementById('goal-progress-bar');
    const goalDisplayName = document.getElementById('goal-display-name');
    const goalStatusText = document.getElementById('goal-status-text');

    let savedGoal = JSON.parse(localStorage.getItem('studentWalletGoal'));

    function updateGoalDisplay(currentBalance) {
        if (savedGoal) {
            progressContainer.style.display = 'block';
            goalDisplayName.textContent = savedGoal.name;
            goalNameInput.value = savedGoal.name;
            goalAmountInput.value = savedGoal.amount;

            let percentage = (currentBalance / savedGoal.amount) * 100;
            if (percentage < 0) percentage = 0; 
            if (percentage > 100) percentage = 100;

            progressBar.style.width = percentage + '%';
            goalStatusText.textContent = `${formatMoney(currentBalance)} / ${formatMoney(savedGoal.amount)} (${percentage.toFixed(1)}%)`;
            
            if (percentage >= 100) {
                progressBar.style.background = 'var(--primary)'; 
            } else {
                progressBar.style.background = 'var(--accent-green)';
            }
        } else {
            progressContainer.style.display = 'none';
        }
    }

    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        savedGoal = {
            name: goalNameInput.value,
            amount: parseInt(goalAmountInput.value)
        };
        
        localStorage.setItem('studentWalletGoal', JSON.stringify(savedGoal));
        updateDashboard(); // Gọi lại updateDashboard để đồng bộ tiến độ
        alert('Đã lưu mục tiêu thành công!');
    });

    // --- CẬP NHẬT giá trị tổng quan ---
    function updateDashboard() {
        let totalIncome = 0;
        let totalExpense = 0;

        // 1. Tính toán từ Ví chính (Lịch sử giao dịch bao gồm cả Số dư ban đầu)
        transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            if (t.type === 'expense') totalExpense += t.amount;
        });

        const mainBalance = totalIncome - totalExpense;

        // 2. Cộng thêm tiền từ các Ví phụ (nếu có)
        const savedWallets = JSON.parse(localStorage.getItem('studentWalletList')) || [];
        let extraBalance = 0;
        savedWallets.forEach(w => {
            if (w.type !== 'Nợ') extraBalance += w.balance; 
        });

        // 3. Tổng số dư thực tế
        const totalBalance = mainBalance + extraBalance;

        // Hiển thị ra màn hình
        document.getElementById('total-balance').textContent = formatMoney(totalBalance);
        document.getElementById('total-income').textContent = '+' + formatMoney(totalIncome);
        document.getElementById('total-expense').textContent = '-' + formatMoney(totalExpense);

        // Render lịch sử giao dịch
        const tbody = document.getElementById('transaction-list');
        tbody.innerHTML = '';
        const recentTrans = [...transactions].reverse().slice(0, 5);
        
        recentTrans.forEach(t => {
            const isIncome = t.type === 'income';
            const amountClass = isIncome ? 'text-green' : 'text-red';
            const amountPrefix = isIncome ? '+' : '-';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.date}</td>
                <td><span class="cat-badge">${t.category}</span></td>
                <td>${t.note}</td>
                <td class="text-right ${amountClass}"><strong>${amountPrefix}${formatMoney(t.amount)}</strong></td>
            `;
            tbody.appendChild(tr);
        });

        // Cập nhật biểu đồ
        mainChart.data.datasets[0].data = [totalIncome];
        mainChart.data.datasets[1].data = [totalExpense];
        mainChart.update();

        // Cập nhật mục tiêu với TỔNG SỐ DƯ mới
        updateGoalDisplay(totalBalance);
    }

    // --- FORM THÊM GIAO DỊCH ---
    const form = document.getElementById('transaction-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        const type = document.querySelector('input[name="trans-type"]:checked').value;
        const amount = parseInt(document.getElementById('amount').value);
        const category = categorySelect.value;
        const note = document.getElementById('note').value || 'Không có ghi chú';
        
        const newTrans = {
            id: Date.now(),
            date: new Date().toLocaleDateString('vi-VN'),
            category: category,
            note: note,
            amount: amount,
            type: type
        };
        
        transactions.push(newTrans);
        localStorage.setItem('studentWalletData', JSON.stringify(transactions));
        
        updateDashboard();
        
        form.reset();
        document.getElementById('type-expense').checked = true;
        updateCategoryDropdown('expense');
    });

    // --- BIỂU ĐỒ ---
    Chart.register(ChartDataLabels);

    const ctx = document.getElementById('mainChart').getContext('2d');
    let mainChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Tổng quan hiện tại'],
            datasets: [
                {
                    label: 'Tổng Tiền Vào',
                    data: [0], 
                    backgroundColor: '#10b981',
                    borderRadius: 8,
                    barPercentage: 0.9, 
                    categoryPercentage: 0.8 
                },
                {
                    label: 'Tổng Tiền Ra',
                    data: [0], 
                    backgroundColor: '#ef4444',
                    borderRadius: 8,
                    barPercentage: 0.9, 
                    categoryPercentage: 0.8 
                }
            ]
        },
     
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 30 } },
            plugins: {
                legend: { position: 'top', labels: { color: '#6b7280', usePointStyle: true, padding: 20 } },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: (context) => context.dataset.backgroundColor,
                    font: { weight: 'bold', size: 13, family: 'Poppins' },
                    formatter: function(value) {
                        if (value === 0) return '';
                        return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
                    }
                }
            },
            scales: {
                y: { 
                    min: 0,
                    max: 10000000, 
                    ticks: { 
                        stepSize: 1000000, 
                        color: '#6b7280',
                        callback: function(value) {
                            if (value === 0) return '0';
                            return (value / 1000000) + 'M'; 
                        }
                    },
                    grid: { color: '#e5e7eb' }
                },
                x: { grid: { display: false }, ticks: { color: '#6b7280', font: {size: 14} } }
            }
        }
    });

   
    updateDashboard();

    function updateChartTheme(textColor, gridColor) {
        mainChart.options.plugins.legend.labels.color = textColor;
        mainChart.options.scales.x.ticks.color = textColor;
        mainChart.options.scales.y.ticks.color = textColor;
        mainChart.options.scales.y.grid.color = gridColor;
        mainChart.update();
    }
});