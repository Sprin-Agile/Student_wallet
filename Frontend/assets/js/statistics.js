
const savedColor = localStorage.getItem('sw_Color') || '#4facfe';
document.documentElement.style.setProperty('--primary', savedColor);
document.documentElement.style.setProperty('--primary-dark', savedColor);
document.documentElement.style.setProperty('--user-theme', savedColor);
document.documentElement.style.setProperty('--user-theme-light', savedColor + '1A');

document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    let currentTheme = localStorage.getItem('sw_Theme') || 'light';
    const currentUser = localStorage.getItem('sw_currentUser');
    let currentMode = 'expense'; // Chế độ mặc định

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
    if (menuToggle) menuToggle.addEventListener('click', () => { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); });
    if (overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); });

    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle ? themeToggle.querySelector('i') : null;

    if (themeToggle) {
        if (currentTheme === 'dark' && icon) icon.classList.replace('bx-moon', 'bx-sun');
        themeToggle.addEventListener('click', () => {
            currentTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', currentTheme === 'dark' ? 'dark' : '');
            localStorage.setItem('sw_Theme', currentTheme);
            if (icon) icon.classList.replace(currentTheme === 'dark' ? 'bx-moon' : 'bx-sun', currentTheme === 'dark' ? 'bx-sun' : 'bx-moon');
            applyGlobalTheme();
            updateChartTheme();
        });
    }

    let transactions = [];
    let wallets = [];
    Chart.register(ChartDataLabels);
    let statsChart = null;
    const chartCtxElement = document.getElementById('expensePieChart');

    if (chartCtxElement) {
        chartCtxElement.parentElement.style.display = 'block';
        chartCtxElement.parentElement.style.height = '400px';

        statsChart = new Chart(chartCtxElement.getContext('2d'), {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 2, 
                    borderColor: 'var(--bg-panel)'
                }]
            },
            options: {
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'right', 
                        labels: { 
                            color: '#1f2937', 
                            usePointStyle: true, 
                            padding: 20, 
                            font: { size: 15, weight: '600', family: "'Poppins', sans-serif" } 
                        } 
                    },
                    datalabels: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('vi-VN').format(context.parsed) + ' đ';
                                    let total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                                    label += ' (' + Math.round((context.parsed / total) * 100) + '%)';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // ========== HÀM XỬ LÝ DỮ LIỆU ==========

    function parseVNdate(dateStr) {
        if (!dateStr) return new Date();
        const parts = dateStr.split('/');
        return parts.length === 3 ? new Date(parts[2], parts[1] - 1, parts[0]) : new Date(dateStr);
    }

    function getFilteredTransactions(type = null) {
        const filterEl = document.getElementById('pie-time-filter');
        const filter = filterEl ? filterEl.value : 'month';
        
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentWeekStart = new Date(now);
        const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
        currentWeekStart.setDate(now.getDate() - dayOfWeek);
        currentWeekStart.setHours(0,0,0,0);

        return transactions.filter(t => {
            // Lọc theo type nếu có
            if (type && t.type !== type) return false;

            const tDate = parseVNdate(t.date);
            let include = false;

            if (filter === 'all') {
                include = true;
            } else if (filter === 'month' && tDate >= currentMonthStart && tDate <= now) {
                include = true;
            } else if (filter === 'week' && tDate >= currentWeekStart && tDate <= now) {
                include = true;
            } else if (filter === 'custom') {
                const startRaw = document.getElementById('pie-start-date')?.value;
                const endRaw = document.getElementById('pie-end-date')?.value;
                let passStart = true, passEnd = true;
                if (startRaw && tDate < new Date(startRaw).setHours(0,0,0,0)) passStart = false;
                if (endRaw && tDate > new Date(endRaw).setHours(23,59,59,999)) passEnd = false;
                if (passStart && passEnd) include = true;
            }

            return include;
        });
    }

    /**
     * Lấy dữ liệu chi tiêu theo category
     */
    function getExpenseData() {
        const expenseTransactions = getFilteredTransactions('expense');
        const data = {};
        let total = 0;

        expenseTransactions.forEach(t => {
            data[t.category] = (data[t.category] || 0) + t.amount;
            total += t.amount;
        });

        return { 
            byCategory: data, 
            total, 
            labels: Object.keys(data), 
            values: Object.values(data),
            income: 0
        };
    }

    /**
     * Lấy dữ liệu thu nhập theo category
     */
    function getIncomeData() {
        const incomeTransactions = getFilteredTransactions('income');
        const data = {};
        let total = 0;

        incomeTransactions.forEach(t => {
            data[t.category] = (data[t.category] || 0) + t.amount;
            total += t.amount;
        });

        return { 
            byCategory: data, 
            total, 
            labels: Object.keys(data), 
            values: Object.values(data),
            expense: 0
        };
    }

    /**
     * Lấy dữ liệu tổng hợp (chi tiêu + thu nhập)
     */
    function getSummaryData() {
        const filteredTransactions = getFilteredTransactions();
        
        let totalIncome = 0;
        let totalExpense = 0;

        filteredTransactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else if (t.type === 'expense') {
                totalExpense += t.amount;
            }
        });

        const balance = totalIncome - totalExpense;

        return {
            income: totalIncome,
            expense: totalExpense,
            balance: balance,
            labels: totalIncome > 0 || totalExpense > 0 ? ['Thu nhập', 'Chi tiêu'] : [],
            values: totalIncome > 0 || totalExpense > 0 ? [totalIncome, totalExpense] : []
        };
    }

    // ========== HÀM CẬP NHẬT BIỂU ĐỒ ==========

    function updateChartDisplay() {
        if (!statsChart) return;

        let chartData = {};
        let colors = [];

        if (currentMode === 'expense') {
            chartData = getExpenseData();
            colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#64748b'];
        } else if (currentMode === 'income') {
            chartData = getIncomeData();
            colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#cffafe'];
        } else if (currentMode === 'summary') {
            chartData = getSummaryData();
            colors = ['#10b981', '#ef4444']; // Xanh cho thu, đỏ cho chi
        }

        // Cập nhật biểu đồ
        statsChart.data.labels = chartData.labels || [];
        statsChart.data.datasets[0].data = chartData.values || [];
        statsChart.data.datasets[0].backgroundColor = colors.slice(0, chartData.labels.length);

        updateChartTheme();

        // Hiển thị/ẩn canvas và empty state
        const chartContainer = document.getElementById('expensePieChart').parentElement;
        const emptyState = document.getElementById('pie-empty-state');

        if (chartData.labels.length === 0) {
            if (chartContainer) chartContainer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            if (chartContainer) chartContainer.style.display = 'block';
            if (emptyState) emptyState.style.display = 'none';
        }
    }

    /**
     * Cập nhật hiển thị/ẩn các stat cards dựa trên mode
     * - expense: chỉ hiển thị Tổng Chi
     * - income: chỉ hiển thị Tổng Thu  
     * - summary: hiển thị cả Tổng Thu, Tổng Chi, Số dư
     */
    function updateUIByMode() {
        const incomeCard = document.getElementById('stat-income-card');
        const expenseCard = document.getElementById('stat-expense-card');
        const balanceCard = document.getElementById('stat-balance-card');
        const statsCardContainer = document.querySelector('.statistics-stat-cards');

        if (currentMode === 'expense') {
            if (incomeCard) incomeCard.style.display = 'none';
            if (expenseCard) expenseCard.style.display = 'block';
            if (balanceCard) balanceCard.style.display = 'none';
            if (statsCardContainer) statsCardContainer.classList.remove('summary-mode');
        } 
        else if (currentMode === 'income') {
            if (incomeCard) incomeCard.style.display = 'block';
            if (expenseCard) expenseCard.style.display = 'none';
            if (balanceCard) balanceCard.style.display = 'none';
            if (statsCardContainer) statsCardContainer.classList.remove('summary-mode');
        } 
        else if (currentMode === 'summary') {
            if (incomeCard) incomeCard.style.display = 'block';
            if (expenseCard) expenseCard.style.display = 'block';
            if (balanceCard) balanceCard.style.display = 'block';
            if (statsCardContainer) statsCardContainer.classList.add('summary-mode');
        }
    }

    /**
     * Cập nhật giá trị các stat cards dựa trên dữ liệu mode hiện tại
     */
    function updateCardValues() {
        if (currentMode === 'expense') {
            const data = getExpenseData();
            document.getElementById('stat-expense-val').textContent = '-' + new Intl.NumberFormat('vi-VN').format(data.total) + ' đ';
        } 
        else if (currentMode === 'income') {
            const data = getIncomeData();
            document.getElementById('stat-income-val').textContent = '+' + new Intl.NumberFormat('vi-VN').format(data.total) + ' đ';
        } 
        else if (currentMode === 'summary') {
            const data = getSummaryData();
            document.getElementById('stat-income-val').textContent = '+' + new Intl.NumberFormat('vi-VN').format(data.income) + ' đ';
            document.getElementById('stat-expense-val').textContent = '-' + new Intl.NumberFormat('vi-VN').format(data.expense) + ' đ';
            
            // Tính tổng số dư giống như trang tổng quan
            const mainName = localStorage.getItem('sw_BookName') || 'Ví chính';
            const mainBalance = parseInt(localStorage.getItem('sw_Balance')) || 0;
            const allWallets = wallets.some(w => w.id === 'w_main') ? wallets : [{id: 'w_main', name: mainName, type: 'Tiền mặt', initial_balance: mainBalance}, ...wallets];

            let totalAssetsOnly = 0;
            allWallets.forEach(w => {
                if (w.type === 'Nợ') return;
                const wTrans = transactions.filter(t => t.walletId === w.id || (w.id === 'w_main' && t.walletId === 'w_main'));
                const bal = (w.initial_balance || 0) + wTrans.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
                totalAssetsOnly += bal;
            });
            
            const balanceEl = document.getElementById('stat-balance-val');
            const balanceText = totalAssetsOnly >= 0 ? '+' : '';
            balanceEl.textContent = balanceText + new Intl.NumberFormat('vi-VN').format(totalAssetsOnly) + ' đ';
            balanceEl.className = totalAssetsOnly >= 0 ? 'text-green' : 'text-red';
        }
    }

    function updateStatCards() {
        updateUIByMode();
        updateCardValues();
    }

    function updateSavingStatus() {
        const mainName = localStorage.getItem('sw_BookName') || 'Ví chính';
        const mainBalance = parseInt(localStorage.getItem('sw_Balance')) || 0;
        const allWallets = wallets.some(w => w.id === 'w_main') ? wallets : [{id: 'w_main', name: mainName, type: 'Tiền mặt', initial_balance: mainBalance}, ...wallets];

        let totalAssetsOnly = 0;
        allWallets.forEach(w => {
            if (w.type === 'Nợ') return;
            const wTrans = transactions.filter(t => t.walletId === w.id || (w.id === 'w_main' && t.walletId === 'w_main'));
            const bal = (w.initial_balance || 0) + wTrans.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
            totalAssetsOnly += bal;
        });

        const savingContainer = document.getElementById('saving-status-container');
        const savingHeading = document.querySelector('.statistics-saving-heading');

        if (savingContainer && savingHeading) {
            savingContainer.style.display = 'block';
            if (totalAssetsOnly >= 0) {
                savingHeading.innerHTML = `<i class='bx bx-wallet'></i> Tổng tài sản hiện tại: <strong id="saving-val" style="color: #10b981;">+${new Intl.NumberFormat('vi-VN').format(totalAssetsOnly)} đ</strong>`;
            } else {
                savingHeading.innerHTML = `<i class='bx bx-wallet'></i> Tổng tài sản hiện tại: <strong id="saving-val" style="color: #ef4444;">${new Intl.NumberFormat('vi-VN').format(totalAssetsOnly)} đ</strong>`;
            }
        }
    }

    function updateTitle() {
        const titleEl = document.getElementById('stats-title');
        if (!titleEl) return;

        const titles = {
            expense: 'Thống Kê Chi Tiêu Cá Nhân',
            income: 'Thống Kê Thu Nhập Cá Nhân',
            summary: 'Thống Kê Tổng Hợp'
        };
        titleEl.textContent = titles[currentMode] || titles.expense;
    }

    function updateAllStats() {
        updateTitle();
        updateStatCards();
        updateChartDisplay();
        updateSavingStatus();
    }

    // ========== LOAD DỮ LIỆU ==========

    async function loadDataForStats() {
        if (!currentUser) return;
        try {
            const [resTrans, resWallets] = await Promise.all([
                fetch(`${API_URL}/get_transactions`, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUser })
                }),
                fetch(`${API_URL}/get_wallets`, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUser })
                })
            ]);
            if (resTrans.ok && resWallets.ok) {
                transactions = await resTrans.json();
                wallets = await resWallets.json();
                updateAllStats();
            }
        } catch (error) { 
            console.error("Lỗi:", error); 
        }
    }

    // ========== EVENT LISTENERS ==========

    // Mode buttons
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            updateAllStats();
        });
    });

    // Filter changes
    const filterEl = document.getElementById('pie-time-filter');
    const customDateRangeEl = document.getElementById('custom-date-range');
    const startDateEl = document.getElementById('pie-start-date');
    const endDateEl = document.getElementById('pie-end-date');

    if (filterEl) {
        filterEl.addEventListener('change', () => {
            if (customDateRangeEl) {
                customDateRangeEl.style.display = filterEl.value === 'custom' ? 'flex' : 'none';
            }
            updateAllStats();
        });
    }

    if (startDateEl) startDateEl.addEventListener('change', updateAllStats);
    if (endDateEl) endDateEl.addEventListener('change', updateAllStats);

    // Notification
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

    function updateChartTheme() {
        if (statsChart) {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const textColor = isDark ? '#f8fafc' : '#1e293b';
            statsChart.options.plugins.legend.labels.color = textColor;
            statsChart.data.datasets[0].borderColor = isDark ? '#1e293b' : '#ffffff';
            statsChart.update();
        }
    }

    // Khởi động
    loadDataForStats();
});