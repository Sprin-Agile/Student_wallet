let tempData = {};

function nextStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById('step' + stepNumber).classList.add('active');
}

// Kiểm tra trống Tên sổ
function validateStep2() {
    const bookName = document.getElementById('book-name').value.trim();
    if (!bookName) {
        alert("Bạn chưa nhập tên sổ kìa, vui lòng nhập nhé!");
        return;
    }
    nextStep(3);
}

// Kiểm tra trống Tên tài khoản
function validateStep3() {
    const accountName = document.getElementById('account-name').value.trim();
    if (!accountName) {
        alert("Bạn chưa nhập tên tài khoản kìa, vui lòng nhập nhé!");
        return;
    }
    saveDataTemp();
}

function saveDataTemp() {
    tempData = {
        bookName: document.getElementById('book-name').value,
        iconSelected: document.querySelector('input[name="wallet-icon"]:checked').value,
        accountName: document.getElementById('account-name').value,
        balance: document.getElementById('account-balance').value || 0,
        color: document.getElementById('favorite-color').value
    };

    const finalName = tempData.accountName ? tempData.accountName : "bạn";
    document.getElementById('welcome-message').innerHTML = 
        `Tuyệt vời <strong>${finalName}</strong>! <br>Quản lí tài chính của bạn dễ dàng với Student Wallet.`;

    document.querySelector('#step4 h2').style.color = tempData.color;
    document.querySelector('#step4 .btn').style.backgroundColor = tempData.color;
    document.querySelector('#step4 .main-logo').style.color = tempData.color;

    nextStep(4);
}

function goToDashboard() {
    localStorage.clear(); 

    localStorage.setItem('sw_BookName', tempData.bookName);
    localStorage.setItem('sw_Icon', tempData.iconSelected);
    localStorage.setItem('sw_AccountName', tempData.accountName);
    localStorage.setItem('sw_Balance', tempData.balance);
    localStorage.setItem('sw_Color', tempData.color);
    localStorage.setItem('sw_NewAccount', 'true');

    window.location.href = 'danh_muc_web/home.html';
}