document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal-overlay');
    const form = document.getElementById('transaction-form');
    const categorySelect = document.getElementById('category');
    
    let transactions = JSON.parse(localStorage.getItem('studentWalletData')) || [];

    const categories = {
        expense: ['Ăn uống 🍜', 'Tiền trọ 🏠', 'Học phí/Sách vở 📚', 'Di chuyển 🛵', 'Giải trí 🎮', 'Khác 📦'],
        income: ['Bố mẹ gửi 💸', 'Lương làm thêm 💼', 'Học bổng 🎓', 'Lì xì/Thưởng 🧧', 'Khác 📦']
    };

    function updateDropdown(type) {
        categorySelect.innerHTML = categories[type].map(c => `<option value="${c}">${c}</option>`).join('');
    }

    function render() {
        let inc = 0, exp = 0;
        const list = document.getElementById('transaction-list');
        list.innerHTML = '';

        transactions.forEach(t => {
            if (t.type === 'income') inc += t.amount;
            else exp += t.amount;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.date}</td>
                <td>${t.category}</td>
                <td class="sw-text-right ${t.type === 'income' ? 'sw-green' : 'sw-red'}">
                    ${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('vi-VN')}₫
                </td>
            `;
            list.prepend(tr);
        });

        document.getElementById('total-income').innerText = inc.toLocaleString('vi-VN') + '₫';
        document.getElementById('total-expense').innerText = exp.toLocaleString('vi-VN') + '₫';
    }

    document.getElementById('open-modal').onclick = () => modal.classList.add('active');
    document.getElementById('close-modal').onclick = () => modal.classList.remove('active');

    document.querySelectorAll('input[name="trans-type"]').forEach(r => {
        r.onchange = (e) => updateDropdown(e.target.value);
    });

    form.onsubmit = (e) => {
        e.preventDefault();
        const type = document.querySelector('input[name="trans-type"]:checked').value;
        const amount = parseInt(document.getElementById('amount').value);
        
        const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleDateString('vi-VN'),
            category: categorySelect.value,
            note: document.getElementById('note').value || 'Không có ghi chú',
            amount: amount,
            type: type
        };

        transactions.push(newEntry);
        localStorage.setItem('studentWalletData', JSON.stringify(transactions));
        
        render();
        modal.classList.remove('active');
        form.reset();
        updateDropdown('expense');
    };

    updateDropdown('expense');
    render();
});document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal-overlay');
    const form = document.getElementById('transaction-form');
    const categorySelect = document.getElementById('category');
    
    let transactions = JSON.parse(localStorage.getItem('studentWalletData')) || [];

    const categories = {
        expense: ['Ăn uống 🍜', 'Tiền trọ 🏠', 'Học phí/Sách vở 📚', 'Di chuyển 🛵', 'Giải trí 🎮', 'Khác 📦'],
        income: ['Bố mẹ gửi 💸', 'Lương làm thêm 💼', 'Học bổng 🎓', 'Lì xì/Thưởng 🧧', 'Khác 📦']
    };

    function updateDropdown(type) {
        categorySelect.innerHTML = categories[type].map(c => `<option value="${c}">${c}</option>`).join('');
    }

    function render() {
        let inc = 0, exp = 0;
        const list = document.getElementById('transaction-list');
        list.innerHTML = '';

        transactions.forEach(t => {
            if (t.type === 'income') inc += t.amount;
            else exp += t.amount;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.date}</td>
                <td>${t.category}</td>
                <td class="sw-text-right ${t.type === 'income' ? 'sw-green' : 'sw-red'}">
                    ${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('vi-VN')}₫
                </td>
            `;
            list.prepend(tr);
        });

        document.getElementById('total-income').innerText = inc.toLocaleString('vi-VN') + '₫';
        document.getElementById('total-expense').innerText = exp.toLocaleString('vi-VN') + '₫';
    }

    document.getElementById('open-modal').onclick = () => modal.classList.add('active');
    document.getElementById('close-modal').onclick = () => modal.classList.remove('active');

    document.querySelectorAll('input[name="trans-type"]').forEach(r => {
        r.onchange = (e) => updateDropdown(e.target.value);
    });

    form.onsubmit = (e) => {
        e.preventDefault();
        const type = document.querySelector('input[name="trans-type"]:checked').value;
        const amount = parseInt(document.getElementById('amount').value);
        
        const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleDateString('vi-VN'),
            category: categorySelect.value,
            note: document.getElementById('note').value || 'Không có ghi chú',
            amount: amount,
            type: type
        };

        transactions.push(newEntry);
        localStorage.setItem('studentWalletData', JSON.stringify(transactions));
        
        render();
        modal.classList.remove('active');
        form.reset();
        updateDropdown('expense');
    };

    updateDropdown('expense');
    render();
});