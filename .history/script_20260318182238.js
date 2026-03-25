document.addEventListener('DOMContentLoaded', () => {

    // --- 1. HIỂN THỊ NGÀY HÔM NAY ---
    const dateElement = document.getElementById('current-date');
    const todayDate = new Date();
    const options = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
    dateElement.textContent = todayDate.toLocaleDateString('vi-VN', options);

    // --- 2. DARK MODE BẬT/TẮT ---
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

    // --- 3. QUẢN LÝ DANH MỤC THÔNG MINH ---
    const categorySelect = document.getElementById('category');
    const typeRadios = document.querySelectorAll('input[name="trans-type"]');
    
    // Phân loại danh mục rõ ràng
    const categories = {
        expense: ['Ăn uống 🍜', 'Tiền trọ 🏠', 'Học phí/Sách vở 📚', 'Di chuyển 🛵', 'Giải trí 🎮', 'Khác 📦'],
        income: ['Bố mẹ gửi 💸', 'Lương làm thêm 💼', 'Học bổng 🎓', 'Lì xì/Thưởng 🧧', 'Khác 📦']
    };

    // Hàm cập nhật dropdown danh mục
    function updateCategoryDropdown(type) {
        categorySelect.innerHTML = '';
        categories[type].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }

    // Lắng nghe sự kiện chuyển đổi Thu/Chi
    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateCategoryDropdown(e.target.value);
        });
    });

    // Khởi tạo danh mục mặc định (Tiền chi)
    updateCategoryDropdown('expense');


    // --- 4. DATA STATE & LOGIC TÍNH TOÁN ---
    // Khởi tạo mảng giao dịch (có sẵn vài data demo)
    let transactions = [
        { id: 1, date: todayDate.toLocaleDateString('vi-VN'), category: 'Bố mẹ gửi 💸', note: 'Tiền sinh hoạt tháng', amount: 3000000, type: 'income' },
        { id: 2, date: todayDate.toLocaleDateString('vi-VN'), category: 'Tiền trọ 🏠', note: 'Đóng tiền phòng', amount: 1500000, type: 'expense' }
    ];

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Hàm cập nhật tất cả giao diện dựa trên data
    function updateDashboard() {
        // 4.1 Tính toán số dư
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            if (t.type === 'expense') totalExpense += t.amount;
        });

        const balance = totalIncome - totalExpense;

        // Cập nhật DOM
        document.getElementById('total-balance').textContent = formatMoney(balance);
        document.getElementById('total-income').textContent = '+' + formatMoney(totalIncome);
        document.getElementById('total-expense').textContent = '-' + formatMoney(totalExpense);

        // 4.2 Render lại bảng lịch sử
        const tbody = document.getElementById('transaction-list');
        tbody.innerHTML = '';
        
        // Lấy 5 giao dịch mới nhất để hiển thị
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

        // 4.3 Cập nhật biểu đồ (Tổng Thu vs Tổng Chi)
        mainChart.data.datasets[0].data = [totalIncome];
        mainChart.data.datasets[1].data = [totalExpense];
        mainChart.update();
    }


    // --- 5. XỬ LÝ FORM THÊM GIAO DỊCH ---
    const form = document.getElementById('transaction-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Ngăn load lại trang
        
        const type = document.querySelector('input[name="trans-type"]:checked').value;
        const amount = parseInt(document.getElementById('amount').value);
        const category = categorySelect.value;
        const note = document.getElementById('note').value || 'Không có ghi chú';
        
        // Tạo object giao dịch mới
        const newTrans = {
            id: Date.now(),
            date: new Date().toLocaleDateString('vi-VN'),
            category: category,
            note: note,
            amount: amount,
            type: type
        };
        
        // Thêm vào mảng data
        transactions.push(newTrans);
        
        // Cập nhật lại toàn bộ giao diện
        updateDashboard();
        
        // Reset form
        form.reset();
        document.getElementById('type-expense').checked = true;
        updateCategoryDropdown('expense');
    });


    // --- 6. KHỞI TẠO BIỂU ĐỒ (CHART.JS) ---
    // Đăng ký plugin hiển thị số liệu
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
                    barPercentage: 0.4
                },
                {
                    label: 'Tổng Tiền Ra',
                    data: [0], 
                    backgroundColor: '#ef4444',
                    borderRadius: 8,
                    barPercentage: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { top: 30 } // Tạo khoảng trống phía trên để số không bị cắt
            },
            plugins: {
                legend: { position: 'top', labels: { color: '#6b7280', usePointStyle: true, padding: 20 } },
                // Cấu hình hiện số trên đỉnh cột
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: (context) => context.dataset.backgroundColor, // Chữ cùng màu với cột
                    font: { weight: 'bold', size: 13, family: 'Poppins' },
                    formatter: function(value) {
                        if (value === 0) return ''; // Nếu bằng 0 thì ẩn đi cho gọn
                        return new Intl.NumberFormat('vi-VN').format(value) + ' đ'; // Format có dấu chấm
                    }
                }
            },
            scales: {
                y: { 
                    min: 0,
                    max: 10000000, // Cố định mốc tối đa là 10.000.000 (10 triệu)
                    ticks: { 
                        stepSize: 1000000, // Mỗi dòng kẻ cách nhau 1.000.000 (1 triệu)
                        color: '#6b7280',
                        callback: function(value) {
                            // Rút gọn trục Y thành 1M, 2M, 3M... cho đỡ rối mắt
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

    // Chạy lần đầu tiên để load data demo lên màn hình
    updateDashboard();

    // Cập nhật lại màu khi đổi Dark Mode
    function updateChartTheme(textColor, gridColor) {
        mainChart.options.plugins.legend.labels.color = textColor;
        mainChart.options.scales.x.ticks.color = textColor;
        mainChart.options.scales.y.ticks.color = textColor;
        mainChart.options.scales.y.grid.color = gridColor;
        mainChart.update();
}