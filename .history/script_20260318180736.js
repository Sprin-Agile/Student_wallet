document.addEventListener('DOMContentLoaded', () => {

    // 1. Sticky Navbar & Blur Effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

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
        // Cập nhật lại màu chart khi đổi theme
        updateChartColors(isDark ? '#94a3b8' : '#6b7280');
    });

    // 3. Scroll Reveal Animations (AOS alternative)
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // 4. Khởi tạo Biểu đồ Fake (Chart.js)
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#6b7280' } } }
    };

    // Pie Chart (Chi tiêu)
    const ctxExpense = document.getElementById('expenseChart').getContext('2d');
    let expenseChart = new Chart(ctxExpense, {
        type: 'doughnut',
        data: {
            labels: ['Ăn uống', 'Di chuyển', 'Học tập', 'Giải trí'],
            datasets: [{
                data: [40, 20, 25, 15],
                backgroundColor: ['#4facfe', '#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: { ...chartOptions, cutout: '70%' }
    });

    // Line Chart (Theo thời gian)
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    let trendChart = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
            datasets: [{
                label: 'Biến động số dư',
                data: [2000, 2500, 2200, 3000, 2800, 3500, 3250],
                borderColor: '#7b61ff',
                backgroundColor: 'rgba(123, 97, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4 // Làm cong đường line
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                y: { display: false },
                x: { grid: { display: false }, ticks: { color: '#6b7280' } }
            }
        }
    });

    // Hàm cập nhật màu chữ biểu đồ khi đổi Dark/Light mode
    function updateChartColors(color) {
        expenseChart.options.plugins.legend.labels.color = color;
        trendChart.options.plugins.legend.labels.color = color;
        trendChart.options.scales.x.ticks.color = color;
        expenseChart.update();
        trendChart.update();
    }
});