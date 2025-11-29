import { mountHeaderActive } from './utils.js';

// ------------------- SWITCH TAB (Login / Register) -------------------
function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabs = document.querySelectorAll('.auth-tab');

  // Xóa trạng thái active ở tất cả tab
  tabs.forEach(t => t.classList.remove('active'));

  if (tab === 'login') {
    tabs[0].classList.add('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
  } else {
    tabs[1].classList.add('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
  }
}

window.switchAuthTab = switchAuthTab;

// ----------------------- HANDLE LOGIN & REGISTER -----------------------
document.addEventListener("DOMContentLoaded", () => {
  mountHeaderActive('login');

  // ----- ĐĂNG NHẬP -----
  document.getElementById("loginBtn").onclick = async () => {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) return alert("Vui lòng nhập đầy đủ Email và Mật khẩu");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
  localStorage.setItem("currentUser", JSON.stringify(data.user));
  window.location.href = "index.html";
}

  };

  // ----- ĐĂNG KÝ -----
  document.getElementById("regBtn").onclick = async () => {
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirm").value;

    if (!name || !email || !password)
      return alert("Vui lòng nhập đầy đủ thông tin bắt buộc!");

    if (password !== confirm)
      return alert("Mật khẩu xác nhận không khớp!");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ name, email, phone, password })
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      // Chuyển sang tab đăng nhập ngay sau khi đăng ký
      switchAuthTab("login");
    }
  };
});
