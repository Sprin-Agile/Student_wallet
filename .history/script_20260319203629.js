document.addEventListener('DOMContentLoaded', () => {

    //hien thi ngay thang
    const dateElement = document.getElementById('current-date');
    const todayDate = new Date();
    const options = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
    dateElement.textContent = todayDate.toLocaleDateString('vi-VN', options);

    // --- MENU MOBILE TOGGLE (Mới thêm) ---
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    // Mở/Đóng menu khi bấm nút Hamburger
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    // UX cực mượt: Đóng menu khi bấm ra ngoài vùng xám (overlay)
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    //mode dark light
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

    //quan ly danh muc 
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


    // data & logic tinh toan 
    const savedData = localStorage.getItem('studentWalletData');
    let transactions = savedData ? JSON.parse(savedData) : [
        { id: 1, date: todayDate.toLocaleDateString('vi-VN'), category: 'Bố mẹ gửi 💸', note: 'Tiền sinh hoạt tháng demo', amount: 3000000, type: 'income' },
        { id: 2, date: todayDate.toLocaleDateString('vi-VN'), category: 'Tiền trọ 🏠', note: 'Đóng tiền phòng demo', amount: 1500000, type: 'expense' }
    ];

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    function updateDashboard() {
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            if (t.type === 'expense') totalExpense += t.amount;
        });

        const balance = totalIncome - totalExpense;

        document.getElementById('total-balance').textContent = formatMoney(balance);
        document.getElementById('total-income').textContent = '+' + formatMoney(totalIncome);
        document.getElementById('total-expense').textContent = '-' + formatMoney(totalExpense);

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

        mainChart.data.datasets[0].data = [totalIncome];
        mainChart.data.datasets[1].data = [totalExpense];
        mainChart.update();
    }


    // form them giao dich
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

        // luu ngay khi them hoac chi
        localStorage.setItem('studentWalletData', JSON.stringify(transactions));
        
        updateDashboard();
        
        form.reset();
        document.getElementById('type-expense').checked = true;
        updateCategoryDropdown('expense');
    });


    // bieu do
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