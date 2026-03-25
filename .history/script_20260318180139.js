// Khởi tạo các Elements DOM
const form = document.getElementById('walletForm');
const amountInput = document.getElementById('amount');
const descInput = document.getElementById('desc');
const dateInput = document.getElementById('date');
const categoryInput = document.getElementById('category');
const btnCancel = document.getElementById('btnCancel');
const transactionList = document.getElementById('transactionList');
const emptyState = document.getElementById('emptyState');
const toast = document.getElementById('toast');

// Load ngày hiện tại mặc định cho input date
dateInput.valueAsDate = new Date();

// --- 1. QUẢN LÝ DỮ LIỆU (LOCAL STORAGE) ---
function getTransactions() {
    const data = localStorage.getItem('transactions');
    return data ? JSON.parse(data) : [];
}

function saveTransaction(transaction) {
    const transactions = getTransactions();
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// --- 2. VALIDATION (REALTIME + SUBMIT) ---
function validateField(inputElement, errorElementId, validationLogic) {
    const formGroup = inputElement.closest('.form-group');
    if (!validationLogic()) {
        formGroup.classList.add('has-error');
        return false;
    } else {
        formGroup.classList.remove('has-error');
        return true;
    }
}

// Lắng nghe sự kiện input/change để validate realtime
amountInput.addEventListener('input', () => validateAmount());
dateInput.addEventListener('change', () => validateDate());
categoryInput.addEventListener('change', () => validateCategory());

function validateAmount() {
    return validateField(amountInput, 'amountError', () => {
        const val = Number(amountInput.value);
        return amountInput.value.trim() !== '' && !isNaN(val) && val > 0;
    });
}

function validateDate() {
    return validateField(dateInput, 'dateError', () => dateInput.value.trim() !== '');
}

function validateCategory() {
    return validateField(categoryInput, 'categoryError', () => categoryInput.value.trim() !== '');
}

function validateForm() {
    const isAmountValid = validateAmount();
    const isDateValid = validateDate();
    const isCategoryValid = validateCategory();
    return isAmountValid && isDateValid && isCategoryValid;
}

// --- 3. XỬ LÝ SỰ KIỆN FORM ---
form.addEventListener('submit', function(e) {
    e.preventDefault();

    if (!validateForm()) return;

    // Lấy value loại giao dịch
    const type = document.querySelector('input[name="type"]:checked').value;

    const newTransaction = {
        id: Date.now(), // ID duy nhất
        type: type,
        amount: Number(amountInput.value),
        description: descInput.value.trim(),
        date: dateInput.value,
        category: categoryInput.value
    };

    saveTransaction(newTransaction);
    showToast();
    resetForm();
    renderTransactions();
});

btnCancel.addEventListener('click', resetForm);

function resetForm() {
    form.reset();
    dateInput.valueAsDate = new Date(); // Đặt lại ngày hiện tại
    document.querySelectorAll('.form-group').forEach(group => group.classList.remove('has-error'));
}

// --- 4. GIAO DIỆN (TOAST & RENDER LIST) ---
function showToast() {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

function renderTransactions() {
    const transactions = getTransactions();
    transactionList.innerHTML = '';
    
    if (transactions.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        
        // Sắp xếp mới nhất lên đầu
        transactions.reverse().forEach(t => {
            const li = document.createElement('li');
            li.classList.add('transaction-item');
            
            // Format tiền tệ VNĐ
            const formattedAmount = new Intl.NumberFormat('vi-VN').format(t.amount) + 'đ';
            const amountClass = t.type === 'income' ? 'income' : 'expense';
            const sign = t.type === 'income' ? '+' : '-';
            
            // Format ngày dd/mm/yyyy
            const dateObj = new Date(t.date);
            const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
            
            li.innerHTML = `
                <div class="t-info">
                    <span class="t-category">${t.category}</span>
                    <span class="t-date-desc">${formattedDate} ${t.description ? '• ' + t.description : ''}</span>
                </div>
                <div class="t-amount ${amountClass}">${sign}${formattedAmount}</div>
            `;
            transactionList.appendChild(li);
        });
    }
}

// Khởi tạo render lần đầu khi mở trang
document.addEventListener('DOMContentLoaded', renderTransactions);