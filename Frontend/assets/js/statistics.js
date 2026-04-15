
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
    let expensePieChart = null;
    const pieCtxElement = document.getElementById('expensePieChart');

    if (pieCtxElement) {
        pieCtxElement.parentElement.style.display = 'block';
        pieCtxElement.parentElement.style.height = '400px';

        expensePieChart = new Chart(pieCtxElement.getContext('2d'), {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#64748b'],
                    borderWidth: 2, borderColor: 'var(--bg-panel)'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#1f2937', usePointStyle: true, padding: 20, font: { size: 15, weight: '600', family: "'Poppins', sans-serif" } } },
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

    async function loadDataForStats() {
        if (!currentUser) return;
        try {
            const [resTrans, resWallets] = await Promise.all([
                fetch(`${API_URL}/get_transactions`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUser })
                }),
                fetch(`${API_URL}/get_wallets`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUser })
                })
            ]);
            if (resTrans.ok && resWallets.ok) {
                transactions = await resTrans.json();
                wallets = await resWallets.json();
                updatePieChart();
            }
        } catch (error) { console.error("Lỗi:", error); }
    }

    function parseVNdate(dateStr) {
        if (!dateStr) return new Date();
        const parts = dateStr.split('/');
        return parts.length === 3 ? new Date(parts[2], parts[1] - 1, parts[0]) : new Date(dateStr);
    }

    function updatePieChart() {
        if (!expensePieChart) return;
        const filterEl = document.getElementById('pie-time-filter');
        const filter = filterEl ? filterEl.value : 'all';
        const customDateRange = document.getElementById('custom-date-range');
        if (customDateRange) customDateRange.style.display = (filter === 'custom') ? 'flex' : 'none';

        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentWeekStart = new Date(now);
        const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
        currentWeekStart.setDate(now.getDate() - dayOfWeek);
        currentWeekStart.setHours(0,0,0,0);

        const expenseData = {};
        let totalExpenseFiltered = 0, totalIncomeFiltered = 0;

        transactions.forEach(t => {
            const tDate = parseVNdate(t.date);
            let include = false;

            if (filter === 'all') include = true;
            else if (filter === 'month' && tDate >= currentMonthStart && tDate <= now) include = true;
            else if (filter === 'week' && tDate >= currentWeekStart && tDate <= now) include = true;
            else if (filter === 'custom') {
                const startRaw = document.getElementById('pie-start-date')?.value;
                const endRaw = document.getElementById('pie-end-date')?.value;
                let passStart = true, passEnd = true;
                if (startRaw && tDate < new Date(startRaw).setHours(0,0,0,0)) passStart = false;
                if (endRaw && tDate > new Date(endRaw).setHours(23,59,59,999)) passEnd = false;
                if (passStart && passEnd) include = true;
            }

            if (include) {
                if (t.type === 'expense') {
                    expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
                    totalExpenseFiltered += t.amount;
                } else if (t.type === 'income') {
                    totalIncomeFiltered += t.amount;
                }
            }
        });

        const pieEmptyState = document.getElementById('pie-empty-state');
        const pieCanvasContainer = document.getElementById('expensePieChart').parentElement;
        if (totalExpenseFiltered === 0) {
            if (pieEmptyState) pieEmptyState.style.display = 'block';
            if (pieCanvasContainer) pieCanvasContainer.style.display = 'none';
        } else {
            if (pieEmptyState) pieEmptyState.style.display = 'none';
            if (pieCanvasContainer) pieCanvasContainer.style.display = 'block';
        }

        expensePieChart.data.labels = Object.keys(expenseData);
        expensePieChart.data.datasets[0].data = Object.values(expenseData);

        updateChartTheme();

        if (document.getElementById('stat-income-val')) document.getElementById('stat-income-val').textContent = '+' + new Intl.NumberFormat('vi-VN').format(totalIncomeFiltered) + ' đ';
        if (document.getElementById('stat-expense-val')) document.getElementById('stat-expense-val').textContent = '-' + new Intl.NumberFormat('vi-VN').format(totalExpenseFiltered) + ' đ';

        const mainName = localStorage.getItem('sw_BookName') || 'Ví chính';
        const mainBalance = parseInt(localStorage.getItem('sw_Balance')) || 0;
        const allWallets = wallets.some(w => w.id === 'w_main') ? wallets : [{id: 'w_main', name: mainName, type: 'Tiền mặt', initial_balance: mainBalance}, ...wallets];

        let totalAssetsOnly = 0;
        allWallets.forEach(w => {
            if (w.type === 'Nợ') return; // Không cộng dồn các khoản Nợ
            // Lấy tất cả giao dịch thuộc về ví này (không bị ảnh hưởng bởi bộ lọc thời gian)
            const wTrans = transactions.filter(t => t.walletId === w.id || (w.id === 'w_main' && t.walletId === 'w_main'));
            const bal = (w.initial_balance || 0) + wTrans.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
            totalAssetsOnly += bal;
        });

        // --- CẬP NHẬT GIAO DIỆN HIỂN THỊ ---
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
        if (expensePieChart) {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const textColor = isDark ? '#f8fafc' : '#1e293b';
            expensePieChart.options.plugins.legend.labels.color = textColor;
            expensePieChart.data.datasets[0].borderColor = isDark ? '#1e293b' : '#ffffff';
            expensePieChart.update();
        }
    }

    document.getElementById('pie-time-filter')?.addEventListener('change', updatePieChart);
    document.getElementById('pie-start-date')?.addEventListener('change', updatePieChart);
    document.getElementById('pie-end-date')?.addEventListener('change', updatePieChart);

    loadDataForStats();
});