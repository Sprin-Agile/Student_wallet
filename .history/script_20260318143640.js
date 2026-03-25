// Khởi tạo các biến DOM
const form = document.getElementById('walletForm');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const descInput = document.getElementById('description');
const btnCancel = document.getElementById('btnCancel');
const transactionListEl = document.getElementById('transactionList');
const toast = document.getElementById('toast');

// Elements hiển thị lỗi
const amountError = document.getElementById('amountError');
const categoryError = document.getElementById('categoryError');
const dateError = document.getElementById('dateError');

// Lấy dữ liệu từ LocalStorage hoặc mảng rỗng
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Set ngày mặc định là hôm nay
const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
};

// ================= VALIDATION LOGIC =================

const clearError = (element) => element.textContent = '';
const setError = (element, message) => element.textContent = message;

const validateAmount = () => {
    const val = amountInput.value.trim();
    if (!val) {
        setError(amountError, 'Vui lòng nhập số tiền');
        return false;
    }
    if (Number(val) <= 0) {
        setError(amountError, 'Số tiền phải lớn hơn 0');
        return false;
    }
    clearError(amountError);
    return true;
};

const validateCategory = () => {
    if (!categoryInput.value) {
        setError(categoryError, 'Vui lòng chọn danh mục');
        return false;
    }
    clearError(categoryError);
    return true;
};

const validateDate = () => {
    if (!dateInput.value) {
        setError(dateError, 'Vui lòng chọn ngày giao dịch');
        return false;
    }
    clearError(dateError);
    return true;
};

// Real-time validation events
amountInput.addEventListener('input', validateAmount);
categoryInput.addEventListener('change', validateCategory);
dateInput.addEventListener('change', validateDate);

// ================= CORE FUNCTIONS =================

// Format tiền tệ VNĐ
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Format ngày (dd/mm/yyyy)
const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

// Hiển thị Toast
const showToast = () => {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
};

// Render danh sách giao dịch
const renderTransactions = () => {
    transactionListEl.innerHTML = '';

    if (transactions.length === 0) {
        transactionListEl.innerHTML = '<div class="empty-state">Chưa có giao dịch nào.</div>';
        return;
    }

    // Sắp xếp mới nhất lên đầu
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedTransactions.forEach(t => {
        const isIncome = t.type === 'income';
        const amountClass = isIncome ? 'amount-income' : 'amount-expense';
        const sign = isIncome ? '+' : '-';

        const itemHTML = `
            <div class="transaction-item">
                <div class="trans-info">
                    <span class="trans-category">${t.category}</span>
                    <span class="trans-date">${formatDate(t.date)}</span>
                    ${t.description ? `<span class="trans-desc">${t.description}</span>` : ''}
                </div>
                <div class="trans-amount ${amountClass}">
                    ${sign} ${formatCurrency(t.amount)}
                </div>
            </div>
        `;
        transactionListEl.insertAdjacentHTML('beforeend', itemHTML);
    });
};

// Reset Form
const resetForm = () => {
    form.reset();
    setToday();
    clearError(amountError);
    clearError(categoryError);
    clearError(dateError);
    document.getElementById('typeExpense').checked = true; // Default về Chi
};

// ================= EVENT LISTENERS =================

// Submit Form (Lưu)
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isAmountValid = validateAmount();
    const isCategoryValid = validateCategory();
    const isDateValid = validateDate();

    // Check tổng thể validation
    if (isAmountValid && isCategoryValid && isDateValid) {
        const type = document.querySelector('input[name="type"]:checked').value;
        
        const newTransaction = {
            id: Date.now(),
            type: type,
            amount: Number(amountInput.value),
            category: categoryInput.value,
            date: dateInput.value,
            description: descInput.value.trim()
        };

        // Lưu vào mảng và LocalStorage
        transactions.push(newTransaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));

        // Cập nhật UI
        renderTransactions();
        showToast();
        resetForm();
    }
});

// Nút Cancel
btnCancel.addEventListener('click', resetForm);

// Init on load
window.onload = () => {
    setToday();
    renderTransactions();
};