
function nextStep(stepNumber) {

    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
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

    // 2. Gọi đến máy chủ Python (Backend)
    try {
        const url = `http://127.0.0.1:5000/${action}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || "Thành công!");
            if (action === 'register') {
                nextStep(3);
            } else {
                window.location.href = 'danh_muc_web/home.html';
            }
        } else {
            errorEl.innerText = data.error;
        }
    } catch (error) {
        errorEl.innerText = "Lỗi: Không kết nối được với máy chủ Python!";
        console.error(error);
    }
}

// Xử lý lưu thông tin Cài đặt sổ sách (Bước 3 -> Bước 4)
function finishSetup() {
    const bookName = document.getElementById('book-name').value || 'Ví cá nhân';
    const balance = document.getElementById('account-balance').value || 0;
    const color = document.getElementById('favorite-color').value;
    const icon = document.querySelector('input[name="wallet-icon"]:checked').value;

    // Lưu các dữ liệu thiết lập vào LocalStorage
    localStorage.setItem('sw_BookName', bookName);
    localStorage.setItem('sw_Balance', balance);
    localStorage.setItem('sw_Color', color);
    localStorage.setItem('sw_Icon', icon);

    // Đánh dấu đây là tài khoản mới (để bên home.js biết đường tạo giao dịch số dư ban đầu)
    localStorage.setItem('sw_NewAccount', 'true');

    // Chuyển sang màn hình Chào mừng (Bước 4)
    nextStep(4);
}

// Nút chuyển từ Bước 4 vào Home
function goToDashboard() {
    window.location.href = 'danh_muc_web/home.html';
}