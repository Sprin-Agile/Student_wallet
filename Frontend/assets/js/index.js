let tempData = {};

document.addEventListener('DOMContentLoaded', () => {
    // 1. CHỌN MÀU
    const colorPicker = document.getElementById('favorite-color');
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            document.documentElement.style.setProperty('--primary', color);
            document.documentElement.style.setProperty('--primary-dark', color);
            document.documentElement.style.setProperty('--user-theme', color);
            document.documentElement.style.setProperty('--user-theme-light', color + '1A');
        });
    }

    // 2. KIỂM TRA MẬT KHẨU REAL-TIME
    const regPasswordInput = document.getElementById('reg-password');
    const regUsernameInput = document.getElementById('reg-username');
    const rulesBox = document.getElementById('password-rules');

    if (regPasswordInput && rulesBox) {
        regPasswordInput.addEventListener('focus', () => {
            rulesBox.style.display = 'block';
        });

        regPasswordInput.addEventListener('input', () => {
            const val = regPasswordInput.value;
            const username = regUsernameInput.value;

            const updateRule = (id, isValid) => {
                const li = document.getElementById(id);
                if(!li) return;
                const icon = li.querySelector('i');
                if (isValid) {
                    li.classList.remove('invalid'); li.classList.add('valid');
                    icon.className = 'bx bx-check';
                } else {
                    li.classList.remove('valid'); li.classList.add('invalid');
                    icon.className = 'bx bxs-error-circle';
                }
            };

            updateRule('rule-length', val.length >= 8 && val.length <= 60);
            updateRule('rule-lower', /[a-z]/.test(val));
            updateRule('rule-upper', /[A-Z]/.test(val));
            updateRule('rule-number', /[0-9]/.test(val));
            updateRule('rule-special', /[^A-Za-z0-9]/.test(val));
        });
    }
});

function nextStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById('step' + stepNumber).classList.add('active');
}

function toggleAuth(mode) {
    document.getElementById('login-error').innerText = '';
    document.getElementById('reg-error').innerText = '';
    if (mode === 'register') {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('register-section').style.display = 'block';
    } else {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('register-section').style.display = 'none';
    }
}

async function handleAuth(action) {
    const username = (action === 'login') ? document.getElementById('login-username').value : document.getElementById('reg-username').value;
    const password = (action === 'login') ? document.getElementById('login-password').value : document.getElementById('reg-password').value;
    const errorEl = document.getElementById(action === 'login' ? 'login-error' : 'reg-error');

    if (action === 'register') {
        const passwordConfirm = document.getElementById('reg-password-confirm').value;

        // Kiểm tra 6 điều kiện bắt buộc trước khi cho đăng ký
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        const isLengthValid = password.length >= 8 && password.length <= 60;

        if (!(hasLower && hasUpper && hasNumber && hasSpecial && isLengthValid )) {
            errorEl.innerText = "Vui lòng hoàn thành tất cả các điều kiện mật khẩu (Các dấu tick xanh)!";
            return;
        }
        if (password !== passwordConfirm) {
            errorEl.innerText = "Mật khẩu nhập lại không khớp!";
            return;
        }
    }

    try {
        const response = await fetch(`http://127.0.0.1:5000/${action}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            alert(data.message || "Thành công!");
            const newUser = data.user || username;
            const oldUser = localStorage.getItem('sw_currentUser');

            if (oldUser !== newUser) {
                localStorage.clear();
            }
            localStorage.setItem('sw_currentUser', newUser);

            if (action === 'register') {
                nextStep(3);
            } else {
                window.location.href = 'danh_muc_web/home.html';
            }
        } else {
            errorEl.innerText = data.error;
        }
    } catch (error) {
        errorEl.innerText = "Lỗi kết nối Server Python!";
    }
}

function finishSetup() {
    const bookName = document.getElementById('book-name').value.trim();
    if (!bookName) return alert("Bạn chưa nhập tên sổ kìa, vui lòng nhập nhé!");

    tempData = {
        bookName: bookName,
        accountName: bookName,
        iconSelected: document.querySelector('input[name="wallet-icon"]:checked').value,
        balance: parseInt(document.getElementById('account-balance').value) || 0,
        color: document.getElementById('favorite-color').value
    };

    const finalName = localStorage.getItem('sw_currentUser') || "bạn";
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `Tuyệt vời <strong>${finalName}</strong>! <br>Quản lí tài chính của bạn dễ dàng với Student Wallet.`;
    }

    // Đổi màu giao diện chào mừng theo màu đã chọn
    const step4H2 = document.querySelector('#step4 h2');
    const step4Btn = document.querySelector('#step4 .btn');
    const step4Logo = document.querySelector('#step4 .main-logo');

    if (step4H2) step4H2.style.color = tempData.color;
    if (step4Btn) step4Btn.style.background = tempData.color;
    if (step4Logo) {
        step4Logo.style.background = tempData.color;
        step4Logo.style.webkitTextFillColor = 'transparent';
        step4Logo.style.webkitBackgroundClip = 'text';
    }

    nextStep(4);
}

async function goToDashboard() {
    localStorage.setItem('sw_BookName', tempData.bookName);
    localStorage.setItem('sw_Icon', tempData.iconSelected);
    localStorage.setItem('sw_AccountName', tempData.accountName);
    localStorage.setItem('sw_Balance', tempData.balance);
    localStorage.setItem('sw_Color', tempData.color);
    localStorage.setItem('sw_NewAccount', 'true');


    window.location.href = 'danh_muc_web/home.html';
}

// --- HÀM BẬT/TẮT HIỂN THỊ MẬT KHẨU ---
function togglePassword(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        iconElement.classList.replace('bx-show', 'bx-hide'); // Đổi icon thành mắt nhắm
    } else {
        input.type = 'password';
        iconElement.classList.replace('bx-hide', 'bx-show'); // Đổi icon thành mắt mở
    }
}

