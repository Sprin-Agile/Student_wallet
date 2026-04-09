const savedColor = localStorage.getItem('sw_Color');
if (savedColor) {
    document.documentElement.style.setProperty('--primary', savedColor);
    document.documentElement.style.setProperty('--primary-dark', savedColor);
    document.documentElement.style.setProperty('--user-theme', savedColor);
    document.documentElement.style.setProperty('--user-theme-light', savedColor + '1A');
}

document.addEventListener('DOMContentLoaded', () => {

    const dateElement = document.getElementById('current-date');
    const todayDate = new Date();
    const options = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
    if (dateElement) dateElement.textContent = todayDate.toLocaleDateString('vi-VN', options);

    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
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

    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;
    const icon = themeToggle ? themeToggle.querySelector('i') : null;

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = root.getAttribute('data-theme') === 'dark';
            if (isDark) {
                root.removeAttribute('data-theme');
                if (icon) icon.classList.replace('bx-sun', 'bx-moon');
            } else {
                root.setAttribute('data-theme', 'dark');
                if (icon) icon.classList.replace('bx-moon', 'bx-sun');
            }
            updateChartTheme();
        });
    }

    let transactions = [];

    Chart.register(ChartDataLabels);
    const pieCtxElement = document.getElementById('expensePieChart');
    let expensePieChart = null;

    if (pieCtxElement) {
        const pieCtx = pieCtxElement.getContext('2d');
        expensePieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#64748b'],
                    borderWidth: 2,
                    borderColor: 'var(--bg-panel)'
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
                                    let dataset = context.chart.data.datasets[context.datasetIndex];
                                    let total = dataset.data.reduce((acc, current) => acc + current, 0);
                                    let percentage = Math.round((context.parsed / total) * 100) + '%';
                                    label += ' (' + percentage + ')';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // LẤY DỮ LIỆU TỪ MYSQL
    async function loadDataForStats() {
        const currentUser = localStorage.getItem('sw_currentUser');
        if (!currentUser) return;

        try {
            const response = await fetch('http://127.0.0.1:5000/get_transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser })
            });
            if (response.ok) {
                transactions = await response.json();
                updatePieChart();
            }
        } catch (error) {
            console.error("Lỗi:", error);
        }
    }

    function parseVNdate(dateStr) {
        if (!dateStr) return new Date();
        const parts = dateStr.split('/');
        if(parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
        return new Date(dateStr);
    }

    function updatePieChart() {
        const filterEl = document.getElementById('pie-time-filter');
        if (!filterEl || !expensePieChart) return;

        const filter = filterEl.value;
        const customDateRange = document.getElementById('custom-date-range');

        if (customDateRange) {
            customDateRange.style.display = (filter === 'custom') ? 'flex' : 'none';
        }

        const now = new Date();
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        currentWeekStart.setHours(0,0,0,0);

        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const expenseData = {};
        let totalExpenseFiltered = 0;
        let totalIncomeFiltered = 0;

        transactions.forEach(t => {
            const tDate = parseVNdate(t.date);
            let include = false;

            if (filter === 'all') {
                include = true;
            } else if (filter === 'month') {
                if (tDate >= currentMonthStart) include = true;
            } else if (filter === 'week') {
                if (tDate >= currentWeekStart) include = true;
            } else if (filter === 'custom') {
                const startRaw = document.getElementById('pie-start-date') ? document.getElementById('pie-start-date').value : null;
                const endRaw = document.getElementById('pie-end-date') ? document.getElementById('pie-end-date').value : null;
                let passStart = true;
                let passEnd = true;

                if (startRaw) {
                    const startD = new Date(startRaw);
                    startD.setHours(0,0,0,0);
                    if (tDate < startD) passStart = false;
                }
                if (endRaw) {
                    const endD = new Date(endRaw);
                    endD.setHours(23,59,59,999);
                    if (tDate > endD) passEnd = false;
                }
                if (passStart && passEnd) include = true;
            }

            if (include) {
                if (t.type === 'expense') {
                    if (!expenseData[t.category]) expenseData[t.category] = 0;
                    expenseData[t.category] += t.amount;
                    totalExpenseFiltered += t.amount;
                } else if (t.type === 'income') {
                    totalIncomeFiltered += t.amount;
                }
            }
        });

        const labels = Object.keys(expenseData);
        const data = Object.values(expenseData);

        const pieEmptyState = document.getElementById('pie-empty-state');
        const pieCanvasContainer = document.getElementById('expensePieChart').parentElement;

        if (totalExpenseFiltered === 0) {
            if (pieEmptyState) pieEmptyState.style.display = 'block';
            if (pieCanvasContainer) pieCanvasContainer.style.display = 'none';
        } else {
            if (pieEmptyState) pieEmptyState.style.display = 'none';
            if (pieCanvasContainer) pieCanvasContainer.style.display = 'flex';
        }

        expensePieChart.data.labels = labels;
        expensePieChart.data.datasets[0].data = data;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const legendColor = isDark ? '#f8fafc' : '#1e293b';
        const borderColor = isDark ? '#1e293b' : '#ffffff';

        expensePieChart.options.plugins.legend.labels.color = legendColor;
        expensePieChart.data.datasets[0].borderColor = borderColor;

        const incomeFmt = new Intl.NumberFormat('vi-VN').format(totalIncomeFiltered);
        const expenseFmt = new Intl.NumberFormat('vi-VN').format(totalExpenseFiltered);

        if (document.getElementById('stat-income-val')) document.getElementById('stat-income-val').textContent = '+' + incomeFmt + ' đ';
        if (document.getElementById('stat-expense-val')) document.getElementById('stat-expense-val').textContent = '-' + expenseFmt + ' đ';

        const savingContainer = document.getElementById('saving-status-container');
        const savingVal = document.getElementById('saving-val');

        if (savingContainer && savingVal) {
            if (totalIncomeFiltered > totalExpenseFiltered) {
                const savedAmount = totalIncomeFiltered - totalExpenseFiltered;
                savingVal.textContent = '+' + new Intl.NumberFormat('vi-VN').format(savedAmount) + ' đ';
                savingContainer.style.display = 'block';
            } else {
                savingContainer.style.display = 'none';
            }
        }

        expensePieChart.update();
    }

    const filterEl = document.getElementById('pie-time-filter');
    const startEl = document.getElementById('pie-start-date');
    const endEl = document.getElementById('pie-end-date');

    if (filterEl) filterEl.addEventListener('change', updatePieChart);
    if (startEl) startEl.addEventListener('change', updatePieChart);
    if (endEl) endEl.addEventListener('change', updatePieChart);

    function updateChartTheme() {
        if (expensePieChart) {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const textColor = isDark ? '#f8fafc' : '#1e293b';
            expensePieChart.options.plugins.legend.labels.color = textColor;
            expensePieChart.data.datasets[0].borderColor = isDark ? '#1e293b' : '#ffffff';
            expensePieChart.update();
        }
    }

    loadDataForStats();
});