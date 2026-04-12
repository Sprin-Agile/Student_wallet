
const savedColor = localStorage.getItem('sw_Color') || '#4facfe';
document.documentElement.style.setProperty('--primary', savedColor);
document.documentElement.style.setProperty('--primary-dark', savedColor);
document.documentElement.style.setProperty('--user-theme', savedColor);
document.documentElement.style.setProperty('--user-theme-light', savedColor + '1A');

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('sw_currentUser');
    const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    // --- SIDEBAR & MENU ---
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (menuToggle) menuToggle.addEventListener('click', () => { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); });
    if (overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); });

    // ---  NÚT THÔNG BÁO ---
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

    // --- CHẾ ĐỘ DARK MODE ---
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('i');
        if (localStorage.getItem('sw_Theme') === 'dark') {
            root.setAttribute('data-theme', 'dark');
            if (themeIcon) themeIcon.classList.replace('bx-moon', 'bx-sun');
        }
        themeToggle.addEventListener('click', () => {
            const isDark = root.getAttribute('data-theme') === 'dark';
            if (isDark) {
                root.removeAttribute('data-theme');
                localStorage.setItem('sw_Theme', 'light');
                if (themeIcon) themeIcon.classList.replace('bx-sun', 'bx-moon');
            } else {
                root.setAttribute('data-theme', 'dark');
                localStorage.setItem('sw_Theme', 'dark');
                if (themeIcon) themeIcon.classList.replace('bx-moon', 'bx-sun');
            }
            updateChartTheme(isDark ? '#94a3b8' : '#6b7280', isDark ? '#334155' : '#e5e7eb');
        });
    }

    // --- CÀI ĐẶT BIỂU ĐỒ BAR CHART  ---
    Chart.register(ChartDataLabels);
    let mainChart = null;
    const ctx = document.getElementById('mainChart');
    if (ctx) {
        mainChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Tổng quan hiện tại'],
                datasets: [
                    { label: 'Tổng Tiền Vào', data: [0], backgroundColor: '#10b981', borderRadius: 8, barPercentage: 0.9, categoryPercentage: 0.8 },
                    { label: 'Tổng Tiền Ra', data: [0], backgroundColor: '#ef4444', borderRadius: 8, barPercentage: 0.9, categoryPercentage: 0.8 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, layout: { padding: { top: 30 } },
                plugins: {
                    legend: { position: 'top', labels: { color: '#6b7280', usePointStyle: true, padding: 20 } },
                    datalabels: {
                        anchor: 'end', align: 'top', color: (context) => context.dataset.backgroundColor,
                        font: { weight: 'bold', size: 13, family: 'Poppins' },
                        formatter: (value) => value === 0 ? '' : new Intl.NumberFormat('vi-VN').format(value) + ' đ'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grace: '500%',
                        ticks: {
                            color: '#6b7280',
                            callback: function(value) {
                                if (value === 0) return '0';
                                if (value >= 1000000) return (value / 1000000).toLocaleString('vi-VN') + 'M';
                                if (value >= 1000) return (value / 1000).toLocaleString('vi-VN') + 'k';
                                return value;
                            }
                        },
                        grid: { color: '#e5e7eb' }
                    },
                    x: { grid: { display: false }, ticks: { color: '#6b7280', font: {size: 14} } }
                }
            }
        });
    }

    function updateChartTheme(textColor, gridColor) {
        if(!mainChart) return;
        mainChart.options.plugins.legend.labels.color = textColor;
        mainChart.options.scales.x.ticks.color = textColor;
        mainChart.options.scales.y.ticks.color = textColor;
        mainChart.options.scales.y.grid.color = gridColor;
        mainChart.update();
    }

    const categorySelect = document.getElementById('category');
    const typeRadios = document.querySelectorAll('input[name="trans-type"]');
    const categories = {
        expense: ['Ăn uống 🍜', 'Tiền trọ 🏠', 'Học phí/Sách vở 📚', 'Di chuyển 🛵', 'Giải trí 🎮', 'Khác 📦'],
        income: ['Bố mẹ gửi 💸', 'Lương làm thêm 💼', 'Học bổng 🎓', 'Lì xì/Thưởng 🧧', 'Khác 📦']
    };

    function updateCategoryDropdown(type) {
        if (!categorySelect) return;
        categorySelect.innerHTML = '';
        categories[type].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }

    if (typeRadios.length > 0) {
        typeRadios.forEach(radio => radio.addEventListener('change', (e) => updateCategoryDropdown(e.target.value)));
        updateCategoryDropdown('expense');
    }

    // --- TẢI DỮ LIỆU TỪ MYSQL ---
    async function updateDashboard() {
        if (!currentUser) return;
        try {
            const [resTrans, resWallets, resGoal] = await Promise.all([
                fetch(`${API_URL}/get_transactions`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: currentUser}) }),
                fetch(`${API_URL}/get_wallets`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: currentUser}) }),
                fetch(`${API_URL}/get_goal`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: currentUser}) })
            ]);

            const transactions = await resTrans.json();
            let wallets = await resWallets.json();
            const goal = await resGoal.json();

            let totalIncome = 0, totalExpense = 0, totalAssetsOnly = 0;

            const mainName = localStorage.getItem('sw_BookName') || 'Ví chính';
            const mainIcon = localStorage.getItem('sw_Icon') || 'bx-wallet';
            const mainBalance = parseFloat(localStorage.getItem('sw_Balance')) || 0;

            if (!wallets.some(w => w.id === 'w_main')) {
                wallets.unshift({ id: 'w_main', name: mainName, type: 'Tiền mặt', icon: mainIcon, initial_balance: mainBalance });
            }

            transactions.forEach(t => {
                if (t.type === 'income') totalIncome += t.amount;
                if (t.type === 'expense') totalExpense += t.amount;
            });

            wallets.forEach(w => {
                let wBalance = parseFloat(w.initial_balance) || 0;
                const wTrans = transactions.filter(t => t.walletId === w.id || (w.id === 'w_main' && t.walletId === 'w_main'));

                wTrans.forEach(t => {
                    if (t.type === 'income') wBalance += t.amount;
                    if (t.type === 'expense') wBalance -= t.amount;
                });

                if (w.type !== 'Nợ') totalAssetsOnly += wBalance;
            });

            if (document.getElementById('total-balance')) document.getElementById('total-balance').textContent = formatMoney(totalAssetsOnly);
            if (document.getElementById('total-income')) document.getElementById('total-income').textContent = '+' + formatMoney(totalIncome);
            if (document.getElementById('total-expense')) document.getElementById('total-expense').textContent = '-' + formatMoney(totalExpense);

            const tbody = document.getElementById('transaction-list');
            if (tbody) {
                tbody.innerHTML = '';
                const recentTrans = [...transactions].reverse().slice(0, 5);
                recentTrans.forEach(t => {
                    const isIncome = t.type === 'income';
                    const walletInfo = wallets.find(w => w.id === t.walletId) || wallets[0];
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${t.date}</td>
                        <td><span class="cat-badge">${t.category}</span>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 3px;">
                                <i class='bx ${walletInfo.icon || 'bx-wallet'}'></i> ${walletInfo.name}
                            </div>
                        </td>
                        <td>${t.note || '-'}</td>
                        <td class="text-right ${isIncome ? 'text-green' : 'text-red'}"><strong>${isIncome ? '+' : '-'}${formatMoney(t.amount)}</strong></td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            if (mainChart) {
                mainChart.data.datasets[0].data = [totalIncome];
                mainChart.data.datasets[1].data = [totalExpense];
                mainChart.update();
            }

            const progressContainer = document.getElementById('goal-progress-container');
            if (goal && goal.name) {
                document.getElementById('goal-display-name').textContent = goal.name;
                const percent = Math.min(((totalAssetsOnly / goal.target_amount) * 100), 100).toFixed(1);
                const progressBar = document.getElementById('goal-progress-bar');
                if (progressBar) progressBar.style.width = percent + '%';
                const goalStatus = document.getElementById('goal-status-text');
                if (goalStatus) goalStatus.textContent = `${formatMoney(totalAssetsOnly)} / ${formatMoney(goal.target_amount)} (${percent}%)`;
                if (progressContainer) progressContainer.style.display = 'block';
            }

        } catch (e) {
            console.error("Lỗi tải dashboard:", e);
        }
    }

    const txForm = document.getElementById('transaction-form');
    if (txForm) {
        txForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const type = document.querySelector('input[name="trans-type"]:checked').value;
            const amount = parseInt(document.getElementById('amount').value);
            const category = categorySelect ? categorySelect.value : 'Khác 📦';
            const note = document.getElementById('note').value || 'Không có ghi chú';

            if (!amount || amount <= 0) return alert("Vui lòng nhập số tiền!");

            try {
                await fetch(`${API_URL}/add_transaction`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        username: currentUser, category: category, walletId: 'w_main',
                        note: note, amount: amount, type: type
                    })
                });

                txForm.reset();
                document.getElementById('type-expense').checked = true;
                updateCategoryDropdown('expense');
                updateDashboard();
            } catch(err) { console.error(err); }
        });
    }

    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
        goalForm.onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('goal-name').value;
            const amount = parseInt(document.getElementById('goal-amount').value);
            if (!amount || amount <= 0) return alert("Nhập số tiền mục tiêu!");

            await fetch(`${API_URL}/add_goal`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username: currentUser, name: name, amount: amount })
            });
            alert("Đã lưu mục tiêu tiết kiệm!");
            goalForm.reset();
            updateDashboard();
        };
    }

    updateDashboard();
});