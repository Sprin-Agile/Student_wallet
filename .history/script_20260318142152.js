// --- State & Config ---
let transactions = JSON.parse(localStorage.getItem('student_wallet_data')) || [];
let currentType = 'expense';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons(); // Khởi tạo icon
    document.getElementById('date').valueAsDate = new Date();
    renderApp();
});

// --- UI Interaction ---
function toggleType(type) {
    currentType = type;
    const btnInc = document.getElementById('btn-inc');
    const btnExp = document.getElementById('btn-exp');

    if (type === 'income') {
        btnInc.classList.add('active', 'text-emerald-600');
        btnExp.classList.remove('active', 'text-rose-600');
    } else {
        btnExp.classList.add('active', 'text-rose-600');
        btnInc.classList.remove('active', 'text-emerald-600');
    }
}

// --- Form Logic ---
document.getElementById('form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const amount = document.getElementById('amount');
    const desc = document.getElementById('desc');
    const date = document.getElementById('date');
    const category = document.getElementById('category');
    const btnSave = document.getElementById('btn-save');

    // Validation
    let isValid = true;
    if (!amount.value || amount.value <= 0) {
        document.getElementById('err-amount').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('err-amount').style.display = 'none';
    }

    if (!desc.value.trim()) {
        document.getElementById('err-desc').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('err-desc').style.display = 'none';
    }

    if (!isValid) return;

    // Loading effect
    btnSave.innerHTML = `<span class="animate-spin mr-2">◌</span> Đang lưu...`;
    btnSave.classList.add('loading');

    setTimeout(() => {
        const data = {
            id: Date.now(),
            type: currentType,
            amount: parseFloat(amount.value),
            desc: desc.value,
            date: date.value,
            category: category.value
        };

        transactions.unshift(data);
        saveAndRender();
        resetForm();
        showToast("Lưu giao dịch thành công!");
        
        btnSave.innerHTML = `Lưu giao dịch`;
        btnSave.classList.remove('loading');
    }, 600);
});

function deleteItem(id) {
    // Thêm hiệu ứng fadeOut trước khi xóa
    const element = document.getElementById(`item-${id}`);
    element.classList.add('animate__fadeOutRight');
    
    setTimeout(() => {
        transactions = transactions.filter(t => t.id !== id);
        saveAndRender();
        showToast("Đã xóa giao dịch", "bg-rose-600");
    }, 400);
}

function resetForm() {
    document.getElementById('form').reset();
    document.getElementById('date').valueAsDate = new Date();
    toggleType('expense');
}

// --- Render & Storage ---
function saveAndRender() {
    localStorage.setItem('student_wallet_data', JSON.stringify(transactions));
    renderApp();
}

function renderApp() {
    const list = document.getElementById('list-container');
    let income = 0, expense = 0;

    list.innerHTML = '';

    if (transactions.length === 0) {
        list.innerHTML = `
            <div class="text-center py-20 opacity-30">
                <i data-lucide="layers" class="mx-auto w-12 h-12 mb-2"></i>
                <p>Chưa có dữ liệu</p>
            </div>`;
    }

    transactions.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;

        const div = document.createElement('div');
        div.id = `item-${t.id}`;
        div.className = 'transaction-item group';
        div.innerHTML = `
            <div class="flex items-center space-x-4">
                <div class="p-2.5 rounded-xl ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}">
                    <i data-lucide="${t.type === 'income' ? 'arrow-up-right' : 'arrow-down-left'}" class="w-5 h-5"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-800 leading-tight">${t.desc}</h4>
                    <p class="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">${t.category} • ${t.date}</p>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <span class="font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}">
                    ${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}đ
                </span>
                <button onclick="deleteItem(${t.id})" class="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        list.appendChild(div);
    });

    document.getElementById('total-income').innerText = income.toLocaleString() + 'đ';
    document.getElementById('total-expense').innerText = expense.toLocaleString() + 'đ';
    document.getElementById('balance').innerText = (income - expense).toLocaleString() + 'đ';

    lucide.createIcons();
}

function showToast(msg, color = "bg-slate-800") {
    const toast = document.getElementById('toast');
    toast.className = `toast ${color}`;
    document.getElementById('toast-msg').innerText = msg;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('animate__fadeOutRight');
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('animate__fadeOutRight');
        }, 500);
    }, 3000);
}