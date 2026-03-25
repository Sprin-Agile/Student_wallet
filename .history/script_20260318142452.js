// Quản lý dữ liệu
let data = JSON.parse(localStorage.getItem('student_wallet')) || [];
let currentType = 'expense';

// Khởi tạo app
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    document.getElementById('date').valueAsDate = new Date();
    render();
});

// Chuyển đổi Thu/Chi
function changeType(type) {
    currentType = type;
    const isInc = type === 'income';
    document.getElementById('btn-income').className = isInc ? 'type-btn active text-emerald-600' : 'type-btn';
    document.getElementById('btn-expense').className = !isInc ? 'type-btn active text-rose-600' : 'type-btn';
}

// Xử lý Form
document.getElementById('wallet-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const amountEl = document.getElementById('amount');
    const descEl = document.getElementById('desc');
    const dateEl = document.getElementById('date');
    const catEl = document.getElementById('category');

    let isValid = true;

    // Validate Amount
    if (!amountEl.value || amountEl.value <= 0) {
        document.getElementById('err-amount').classList.remove('hidden');
        isValid = false;
    } else {
        document.getElementById('err-amount').classList.add('hidden');
    }

    // Validate Description
    if (!descEl.value.trim()) {
        document.getElementById('err-desc').classList.remove('hidden');
        isValid = false;
    } else {
        document.getElementById('err-desc').classList.add('hidden');
    }

    if (!isValid) return;

    // Save Data
    const transaction = {
        id: Date.now(),
        type: currentType,
        amount: parseFloat(amountEl.value),
        description: descEl.value,
        date: dateEl.value,
        category: catEl.value
    };

    data.unshift(transaction);
    localStorage.setItem('student_wallet', JSON.stringify(data));
    
    render();
    resetForm();
    showToast("Đã lưu thành công!");
});

function deleteItem(id) {
    data = data.filter(item => item.id !== id);
    localStorage.setItem('student_wallet', JSON.stringify(data));
    render();
    showToast("Đã xóa giao dịch");
}

function resetForm() {
    document.getElementById('wallet-form').reset();
    document.getElementById('date').valueAsDate = new Date();
    changeType('expense');
}

function render() {
    const list = document.getElementById('history-list');
    let totalInc = 0, totalExp = 0;

    list.innerHTML = '';

    if (data.length === 0) {
        list.innerHTML = `<div class="text-center py-10 text-slate-400">Chưa có giao dịch nào.</div>`;
    }

    data.forEach(t => {
        if (t.type === 'income') totalInc += t.amount;
        else totalExp += t.amount;

        const row = document.createElement('div');
        row.className = 'item-row group';
        row.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}">
                    <i data-lucide="${t.type === 'income' ? 'trending-up' : 'trending-down'}" size="18"></i>
                </div>
                <div>
                    <p class="font-bold text-slate-800">${t.description}</p>
                    <p class="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">${t.category} • ${t.date}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}">
                    ${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}đ
                </span>
                <button onclick="deleteItem(${t.id})" class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                    <i data-lucide="trash-2" size="16"></i>
                </button>
            </div>
        `;
        list.appendChild(row);
    });

    // Update Dashboard
    document.getElementById('total-income').innerText = totalInc.toLocaleString() + 'đ';
    document.getElementById('total-expense').innerText = totalExp.toLocaleString() + 'đ';
    document.getElementById('total-balance').innerText = (totalInc - totalExp).toLocaleString() + 'đ';
    
    lucide.createIcons();
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `<i data-lucide="info" size="18"></i> ${msg}`;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => toast.remove(), 3000);
}