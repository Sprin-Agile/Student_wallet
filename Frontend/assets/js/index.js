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
            const newUser = data.user || username;
            const oldUser = localStorage.getItem('sw_currentUser');
            if (oldUser !== newUser) {
                localStorage.removeItem('studentWalletList');
                localStorage.removeItem('sw_MyWallets');
                localStorage.removeItem('studentWalletData');
                localStorage.removeItem('studentWalletGoal');
                localStorage.removeItem('sw_Balance');
                localStorage.removeItem('sw_BookName');
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
        errorEl.innerText = "Lỗi: Không kết nối được với máy chủ Python!";
        console.error(error);
    }
}

async function finishSetup() {
    const bookName = document.getElementById('book-name').value || 'Ví cá nhân';
    const balance = parseInt(document.getElementById('account-balance').value) || 0;
    const color = document.getElementById('favorite-color').value;
    const icon = document.querySelector('input[name="wallet-icon"]:checked').value;

    localStorage.setItem('sw_BookName', bookName);
    localStorage.setItem('sw_Balance', balance);
    localStorage.setItem('sw_Color', color);
    localStorage.setItem('sw_Icon', icon);
    localStorage.setItem('sw_NewAccount', 'true');
    const currentUser = localStorage.getItem('sw_currentUser');
    if (balance > 0 && currentUser) {
        try {
            await fetch('http://127.0.0.1:5000/add_transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: currentUser,
                    amount: balance,
                    category: 'Khác 📦',
                    note: 'Số dư ban đầu',
                    type: 'income' // Phân loại là tiền thu (cộng vào ví)
                })
            });
        } catch (error) {
            console.error("Lỗi khi lưu số dư ban đầu:", error);
        }
    }

    nextStep(4);
}

function goToDashboard() {
    window.location.href = 'danh_muc_web/home.html';
}