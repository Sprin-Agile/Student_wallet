
const savedColor = localStorage.getItem('sw_Color') || '#4facfe';
document.documentElement.style.setProperty('--primary', savedColor);
document.documentElement.style.setProperty('--primary-dark', savedColor);
document.documentElement.style.setProperty('--user-theme', savedColor);
document.documentElement.style.setProperty('--user-theme-light', savedColor + '1A');

let myPieChart = null;

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

        const cards = document.querySelectorAll('.card, .income-card, .expense-card, .balance-card, .wallet-card-item');
        cards.forEach(card => {
            if (currentTheme === 'dark') {
                card.style.setProperty('background', '#1e1e1e', 'important');
                card.style.setProperty('color', '#ffffff', 'important');
                card.style.setProperty('border', '1px solid #333', 'important');
            } else {
                card.style.setProperty('background', '#ffffff', 'important');
                card.style.setProperty('color', '#333', 'important');
                card.style.setProperty('border', '1px solid #edf2f7', 'important');
            }
        });

        const netWorthVal = document.getElementById('net-worth-val');
        if (netWorthVal) netWorthVal.style.setProperty('color', savedColor, 'important');
    }
    applyGlobalTheme();

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            currentTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', currentTheme === 'dark' ? 'dark' : '');
            localStorage.setItem('sw_Theme', currentTheme);
            applyGlobalTheme();
        });
    }

    const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    async function calculateAndRender() {
        const container = document.getElementById('wallets-list-container');
        if (!container || !currentUser) return;

        const [resTrans, resWallets] = await Promise.all([
            fetch('http://127.0.0.1:5000/get_transactions', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: currentUser}) }),
            fetch('http://127.0.0.1:5000/get_wallets', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: currentUser}) })
        ]);

        const transactions = await resTrans.json();
        const wallets = await resWallets.json();

        container.innerHTML = '';
        let netWorth = 0, totalAssets = 0, totalDebts = 0;

        const mainName = localStorage.getItem('sw_BookName') || 'Ví chính';
        const mainIcon = localStorage.getItem('sw_Icon') || 'bx-wallet';
        const mainBalance = parseInt(localStorage.getItem('sw_Balance')) || 0;
        const mainWallet = { id: 'w_main', name: mainName, initial_balance: mainBalance, type: 'Tiền mặt', icon: mainIcon };

        let allWallets = wallets.some(w => w.id === 'w_main') ? wallets : [mainWallet, ...wallets];

        allWallets.sort((a, b) => {
            if (a.id === 'w_main') return -1;
            if (b.id === 'w_main') return 1;
            
            return a.id.localeCompare(b.id);
        });

        allWallets.forEach(wallet => {
            const walletTx = transactions.filter(t => t.walletId === wallet.id || (wallet.id === 'w_main' && t.walletId === 'w_main'));
            const income = walletTx.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0);
            const expense = walletTx.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
            const balance = (wallet.initial_balance || 0) + income - expense;

            if (wallet.type === 'Nợ') { totalDebts += Math.abs(balance); netWorth -= balance; }
            else { totalAssets += balance; netWorth += balance; }

            const card = document.createElement('div');
            card.className = 'wallet-card-item';
            card.style.borderLeft = `5px solid ${wallet.type === 'Nợ' ? 'var(--accent-red)' : 'var(--user-theme)'}`;
            card.onclick = () => openWalletDetail(wallet, balance, transactions);

            const isMain = wallet.id === 'w_main';
            card.innerHTML = `
                <i class='bx ${wallet.icon || 'bx-wallet'}' style="color: var(--user-theme); background: var(--user-theme-light);"></i>
                <div class="wallet-info" style="flex: 1;">
                    <span class="badge-main" style="${isMain ? 'background: var(--user-theme-light); color: var(--user-theme);' : 'background:#f1f5f9; color:#64748b;'}">${isMain ? 'Mặc định' : wallet.type}</span>
                    <h4 style="margin: 5px 0 2px;">${wallet.name}</h4>
                </div>
                <div style="font-weight: 700; font-size: 1.1rem; color: ${wallet.type === 'Nợ' ? 'var(--accent-red)' : 'var(--user-theme)'};">
                    ${formatMoney(balance)}
                </div>
            `;
            container.appendChild(card);
        });

        if (document.getElementById('net-worth-val')) document.getElementById('net-worth-val').textContent = formatMoney(netWorth);
        if (document.getElementById('assets-val')) document.getElementById('assets-val').textContent = formatMoney(totalAssets);
        if (document.getElementById('debts-val')) document.getElementById('debts-val').textContent = formatMoney(totalDebts);

        applyGlobalTheme();
    }

    function openWalletDetail(wallet, currentBalance, allTx) {
        const detailModal = document.getElementById('walletDetailModal');
        const topCard = detailModal.querySelector('.wd-top-card');

        if (topCard) {
            topCard.style.padding = "12px 15px";
            topCard.style.margin = "10px 20px";
            topCard.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 35px; height: 35px; background: ${savedColor}1A; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                            <i class='bx ${wallet.icon || 'bx-wallet'}' style="font-size: 20px; color: ${savedColor};"></i>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; line-height: 1;">${wallet.type}</div>
                            <div style="font-size: 15px; font-weight: 700; color: ${savedColor};">${wallet.name}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 16px; font-weight: 800; color: ${savedColor};">${formatMoney(currentBalance)}</div>
                    </div>
                </div>
            `;
        }

        detailModal.classList.add('active');
        const tabAn = document.getElementById('tab-analytic');

        tabAn.innerHTML = `
            <div style="position: relative; display: flex; background: rgba(128,128,128,0.15); border-radius: 20px; padding: 4px; margin-bottom: 20px;">
                <div id="inc-exp-slider" style="position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px); background: #ef4444; border-radius: 16px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1; box-shadow: 0 2px 10px rgba(239, 68, 68, 0.3);"></div>
                <button id="btn-sub-exp" style="flex: 1; border: none; background: transparent; color: white; padding: 10px; font-size: 12px; font-weight: 700; cursor: pointer; z-index: 2; transition: 0.3s;">CHI TIÊU</button>
                <button id="btn-sub-inc" style="flex: 1; border: none; background: transparent; color: var(--text-muted); padding: 10px; font-size: 12px; font-weight: 700; cursor: pointer; z-index: 2; transition: 0.3s;">THU NHẬP</button>
            </div>
            <div style="height: 180px; max-width: 180px; margin: 0 auto; position: relative;"><canvas id="wdChart"></canvas></div>
            <div id="analysis-list" style="margin-top:15px; max-height: 120px; overflow-y: auto;"></div>
        `;

        const btnExp = document.getElementById('btn-sub-exp');
        const btnInc = document.getElementById('btn-sub-inc');
        const slider = document.getElementById('inc-exp-slider');

        btnExp.onclick = () => {
            slider.style.left = '4px';
            slider.style.background = '#ef4444';
            slider.style.boxShadow = '0 2px 10px rgba(239, 68, 68, 0.3)';
            btnExp.style.color = 'white';
            btnInc.style.color = 'var(--text-muted)';
            renderAnalysisChart(wallet.id, 'expense', allTx);
        };

        btnInc.onclick = () => {
            slider.style.left = 'calc(50%)';
            slider.style.background = '#10b981';
            slider.style.boxShadow = '0 2px 10px rgba(16, 185, 129, 0.3)';
            btnInc.style.color = 'white';
            btnExp.style.color = 'var(--text-muted)';
            renderAnalysisChart(wallet.id, 'income', allTx);
        };

        switchTab('analytic');
        renderAnalysisChart(wallet.id, 'expense', allTx);
        renderHistory(wallet.id, allTx);
    }

    function renderAnalysisChart(walletId, mode, allTx) {
        const walletTx = allTx.filter(t => (t.walletId === walletId || (!t.walletId && walletId === 'w_main')) && t.type === mode);
        const dataMap = {};
        walletTx.forEach(t => dataMap[t.category] = (dataMap[t.category] || 0) + t.amount);
        const values = Object.values(dataMap);
        const total = values.reduce((a, b) => a + b, 0);

        if (myPieChart) myPieChart.destroy();
        const ctx = document.getElementById('wdChart');
        if (ctx) {
            myPieChart = new Chart(ctx.getContext('2d'), {
                type: 'pie',
                plugins: [ChartDataLabels],
                data: {
                    labels: Object.keys(dataMap),
                    datasets: [{ data: values, backgroundColor: ['#ef4444', '#f59e0b', '#ec4899', savedColor, '#3b82f6'] }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        datalabels: { color: '#fff', font: { weight: 'bold', size: 10 }, formatter: (val) => total > 0 ? ((val / total) * 100).toFixed(0) + "%" : "" },
                        legend: { display: false }
                    }
                }
            });
        }

        const analysisList = document.getElementById('analysis-list');
        if (analysisList) {
            analysisList.innerHTML = Object.keys(dataMap).map(cat => `
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); font-size:12px;">
                    <span>${cat}</span><span style="font-weight:700; color:${mode === 'income' ? '#10b981' : '#ef4444'}">${formatMoney(dataMap[cat])}</span>
                </div>`).join('');
        }
    }

    function renderHistory(walletId, allTx) {
        const listDiv = document.getElementById('wd-tx-list');
        if (!listDiv) return;
        const txs = allTx.filter(t => t.walletId === walletId || (!t.walletId && walletId === 'w_main')).reverse();
        listDiv.innerHTML = txs.map(t => `
            <div class="wd-tx-item">
                <div><div class="wd-tx-title">${t.category}</div><div class="wd-tx-date">${t.date}</div></div>
                <div class="wd-tx-amount" style="color:${t.type === 'income' ? '#10b981' : '#ef4444'}">
                    ${t.type === 'income' ? '+' : '-'}${formatMoney(t.amount)}
                </div>
            </div>`).join('');
    }

    function switchTab(tab) {
        const sw = document.getElementById('wd-switch');
        if (sw) sw.setAttribute('data-active', tab);
        document.querySelectorAll('.wd-tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.wd-switch-btn').forEach(b => b.classList.remove('active'));
        const targetTab = document.getElementById(`tab-${tab}`);
        const targetBtn = document.getElementById(`btn-${tab}`);
        if (targetTab) targetTab.classList.add('active');
        if (targetBtn) targetBtn.classList.add('active');
    }

    const btnAnalytic = document.getElementById('btn-analytic');
    if (btnAnalytic) btnAnalytic.onclick = () => switchTab('analytic');
    const btnDetail = document.getElementById('btn-detail');
    if (btnDetail) btnDetail.onclick = () => switchTab('detail');

    document.getElementById('close-detail-modal').onclick = () => document.getElementById('walletDetailModal').classList.remove('active');

    // --- MODAL TẠO VÍ ---
    const createModal = document.getElementById('wallet-modal-popup');
    const step1 = document.getElementById('modal-step-1');
    const step2 = document.getElementById('modal-step-2');

    document.getElementById('btn-open-wallet-modal').onclick = () => {
        createModal.style.display = 'flex';
        step1.style.display = 'block';
        step2.style.display = 'none';
        document.querySelectorAll('.type-box').forEach(b => b.classList.remove('selected'));
    };

    document.getElementById('close-create-modal').onclick = () => createModal.style.display = 'none';

    document.querySelectorAll('.type-box').forEach(box => {
        box.onclick = () => {
            document.querySelectorAll('.type-box').forEach(b => b.classList.remove('selected'));
            box.classList.add('selected');
            setTimeout(() => {
                step1.style.display = 'none';
                step2.style.display = 'block';
                document.getElementById('modal-title-wallet').textContent = `Cài đặt ví ${box.getAttribute('data-wallet')}`;
            }, 200);
        };
    });

    document.getElementById('btn-save-new-wallet').onclick = async () => {
        const name = document.getElementById('inp-w-name').value.trim();
        const balance = parseInt(document.getElementById('inp-w-balance').value) || 0;
        const selectedType = document.querySelector('.type-box.selected')?.getAttribute('data-wallet') || 'Tiền mặt';
        const icons = { 'Tiền mặt': 'bx-money', 'Thẻ': 'bx-credit-card', 'Đầu tư': 'bx-line-chart', 'Nợ': 'bx-receipt' };

        if (!name) return alert('Vui lòng nhập tên ví!');

        await fetch('http://127.0.0.1:5000/add_wallet', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: 'w_' + Date.now(), username: currentUser, name, type: selectedType, icon: icons[selectedType], initialBalance: balance })
        });

        createModal.style.display = 'none';
        document.getElementById('inp-w-name').value = '';
        document.getElementById('inp-w-balance').value = '';
        calculateAndRender();
    };

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

    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', () => { sidebar.classList.add('active'); overlay.classList.add('active'); });
        overlay.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); });
    }

    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    calculateAndRender();
});