
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

    let generalBudget = null;
    let specificBudgets = [];
    let transactions = [];
    let isCreatingGeneral = false;

    async function loadDataAndRender() {
        if (!currentUser) return;
        try {
            const [resBudgets, resTrans] = await Promise.all([
                fetch('http://127.0.0.1:5000/get_budgets', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: currentUser}) }),
                fetch('http://127.0.0.1:5000/get_transactions', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: currentUser}) })
            ]);

            const allBudgets = await resBudgets.json();
            transactions = await resTrans.json();

            generalBudget = allBudgets.find(b => b.is_general === 1 || b.is_general === true) || null;
            specificBudgets = allBudgets.filter(b => b.is_general === 0 || b.is_general === false);

            renderBudgets();
        } catch (error) { console.error("Lỗi tải dữ liệu ngân sách:", error); }
    }

    function renderBudgets() {
        const container = document.getElementById('budget-list-container');
        const headerBtn = document.getElementById('open-budget-modal-header');
        if (!container) return;
        container.innerHTML = '';

        if (!generalBudget) {
            if (headerBtn) headerBtn.style.display = 'none';
            container.innerHTML = `
                <div style="text-align:center; padding: 60px 20px; background: var(--card-bg, #fff); border-radius: 20px; border: 1px dashed var(--border);">
                    <i class='bx bx-wallet' style="font-size: 70px; color: ${savedColor}; margin-bottom:15px;"></i>
                    <h3 style="margin-bottom:10px;">Chưa có Ngân sách chung</h3>
                    <p style="color: var(--text-muted); margin-bottom: 25px; font-size: 14px;">Bạn cần thiết lập một Ngân sách tổng cho tháng này trước!</p>
                    <button onclick="openBudgetModal(true)" class="btn btn-primary" style="background: ${savedColor}; border: none; color: white; padding: 14px 30px; border-radius: 15px; font-weight: 600; cursor: pointer;">
                        Thiết lập Ngân sách Chung
                    </button>
                </div>`;
            return;
        }

        if (headerBtn) {
            headerBtn.style.display = 'flex';
            headerBtn.innerHTML = "<i class='bx bx-plus'></i> Thêm ngân sách riêng";
            headerBtn.onclick = () => openBudgetModal(false);
        }

        const genSpent = transactions.filter(t => t.type === 'expense' && t.id >= generalBudget.created_at).reduce((sum, t) => sum + t.amount, 0);
        const genPercent = ((genSpent / generalBudget.amount) * 100).toFixed(0);
        const genIsOver = genSpent > generalBudget.amount;

        container.innerHTML += `
            <div style="background: linear-gradient(135deg, ${savedColor}, ${savedColor}CC); padding: 25px; border-radius: 20px; color: white; margin-bottom: 30px; position: relative; box-shadow: var(--shadow-sm);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <div>
                        <h3 style="margin:0; font-size:20px;">${generalBudget.name || 'Ngân sách Tổng'}</h3>
                        <p style="margin:5px 0 0; opacity:0.9; font-size:13px;">Hạn mức: ${formatMoney(generalBudget.amount)}</p>
                    </div>
                    <div style="font-size:26px; font-weight:800;">${genPercent}%</div>
                </div>
                <div style="width:100%; height:12px; background:rgba(255,255,255,0.2); border-radius:6px; margin-bottom:15px;">
                    <div style="width:${Math.min(genPercent, 100)}%; height:100%; background:${genIsOver ? '#ef4444' : '#fff'}; border-radius:6px; transition:0.8s;"></div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:14px; font-weight:500;">
                    <div>
                        <div style="margin-bottom: 5px;">Đã dùng: ${formatMoney(genSpent)}</div>
                        <div style="color:${genIsOver ? '#ffb3b3' : '#fff'};">${genIsOver ? 'Vượt lố: ' : 'Còn dư: '} ${formatMoney(Math.abs(generalBudget.amount - genSpent))}</div>
                    </div>
                    <div onclick="deleteGeneralBudget()" title="Xóa ngân sách" style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; background:rgba(0,0,0,0.15); border-radius:10px; cursor:pointer; transition:0.3s;" onmouseover="this.style.background='rgba(0,0,0,0.3)'" onmouseout="this.style.background='rgba(0,0,0,0.15)'">
                        <i class='bx bx-trash' style="font-size:20px;"></i>
                    </div>
                </div>
            </div>
        `;

        if (specificBudgets.length > 0) {
            container.innerHTML += `<h3 style="margin-bottom: 15px; font-size: 1.1rem;">Ngân sách chi tiết</h3>`;
            specificBudgets.forEach((budget) => {
                const spent = transactions.filter(t => t.category === budget.category && t.type === 'expense' && t.id >= budget.created_at).reduce((sum, t) => sum + t.amount, 0);
                const percent = ((spent / budget.amount) * 100).toFixed(0);
                const isOver = spent > budget.amount;

                // --- ĐÃ SỬA: Đồng bộ nút Xóa cho cả các Ngân sách chi tiết ---
                container.innerHTML += `
                    <div class="budget-card" style="background: var(--card-bg, #fff); padding: 20px; border-radius: 20px; margin-bottom: 15px; border: 1px solid var(--border); box-shadow: var(--shadow-sm);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                            <div><h4 style="margin:0; font-size:16px;">${budget.category}</h4><small style="color:var(--text-muted);">Hạn mức: ${formatMoney(budget.amount)}</small></div>
                            <span style="font-weight:800; color:${isOver ? '#ef4444' : savedColor}; font-size: 18px;">${percent}%</span>
                        </div>
                        <div style="width:100%; height:10px; background:var(--border, #eee); border-radius:5px; overflow:hidden; margin-bottom:12px;">
                            <div style="width:${Math.min(percent, 100)}%; height:100%; background:${isOver ? '#ef4444' : savedColor};"></div>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:13px;">
                            <div>
                                <div style="color:var(--text-muted); margin-bottom:4px;">Đã dùng: ${formatMoney(spent)}</div>
                                <div style="font-weight:600; color:${isOver ? '#ef4444' : '#10b981'};">${isOver ? 'Vượt lố' : 'Còn lại'}: ${formatMoney(Math.abs(budget.amount - spent))}</div>
                            </div>
                            <div onclick="deleteSpecificBudget(${budget.id})" title="Xóa" style="display:flex; align-items:center; justify-content:center; width:32px; height:32px; background:rgba(239, 68, 68, 0.1); border-radius:8px; cursor:pointer; transition:0.3s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'">
                                <i class='bx bx-trash' style="color:#ef4444; font-size:18px;"></i>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    }

    const budgetModal = document.getElementById('budget-modal');
    window.openBudgetModal = (isGeneral) => {
        isCreatingGeneral = isGeneral;
        document.getElementById('name-group').style.display = isGeneral ? 'block' : 'none';
        document.getElementById('category-group').style.display = isGeneral ? 'none' : 'block';
        document.getElementById('modal-title').textContent = isGeneral ? "Thiết lập Ngân sách Chung" : "Thêm Ngân sách Riêng";
        budgetModal.style.display = 'flex';
    };

    document.getElementById('close-budget-modal').onclick = () => budgetModal.style.display = 'none';

    document.getElementById('budget-form').onsubmit = async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('budget-limit').value);
        if (!amount || amount <= 0) return alert('Nhập số tiền hợp lệ!');

        const payload = { username: currentUser, amount: amount, createdAt: Date.now(), isGeneral: isCreatingGeneral };
        if (isCreatingGeneral) {
            payload.name = document.getElementById('budget-name-input').value.trim();
            if (!payload.name) return alert('Vui lòng nhập tên ngân sách chung!');
        } else {
            payload.category = document.getElementById('budget-category').value;
        }

        await fetch('http://127.0.0.1:5000/add_budget', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
        document.getElementById('budget-form').reset();
        budgetModal.style.display = 'none';
        loadDataAndRender();
    };

    window.deleteGeneralBudget = async () => {
        if (confirm('CẢNH BÁO: Xóa Ngân sách chung sẽ xóa toàn bộ các Ngân sách riêng. Tiếp tục?')) {
            await fetch('http://127.0.0.1:5000/delete_budget', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ username: currentUser, all: true }) });
            loadDataAndRender();
        }
    };

    window.deleteSpecificBudget = async (id) => {
        if (confirm('Bạn có chắc chắn muốn xóa mục ngân sách này?')) {
            await fetch('http://127.0.0.1:5000/delete_budget', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: id, username: currentUser }) });
            loadDataAndRender();
        }
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


    loadDataAndRender();
});