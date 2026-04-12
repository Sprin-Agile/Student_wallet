const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:5000"
    : "https://student-wallet-z6oe.onrender.com";

console.log("Đang kết nối tới API:", API_URL);