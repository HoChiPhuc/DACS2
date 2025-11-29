import { products } from './data.js';

/* ======================= DOM HELPERS ======================= */
export function qs(sel, root=document){ return root.querySelector(sel); }
export function qsa(sel, root=document){ return [...root.querySelectorAll(sel)]; }

/* ======================= FORMAT GIÁ ========================= */
export function calculateFinalPrice(p){
  return p.price - (p.price * p.discountPercent / 100);
}
export function formatPrice(n){
  return n.toLocaleString('vi-VN') + 'đ';
}

/* =================== LOCAL STORAGE KEYS ===================== */
const CART_KEY = 'mobileshop_cart';
const ORDERS_KEY = 'mobileshop_orders';
const USER_KEY = 'currentUser';

/* ======================= CART STORAGE ======================== */
export function getCart(){
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}
export function setCart(c){
  localStorage.setItem(CART_KEY, JSON.stringify(c));
  updateCartCountBadge();
}

/* ======================= ORDER STORAGE ======================= */
export function getOrders(){
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
}
export function setOrders(o){
  localStorage.setItem(ORDERS_KEY, JSON.stringify(o));
}

/* ===================== CART COUNT BADGE ====================== */
export function updateCartCountBadge(){
  const c = getCart().reduce((s,i)=>s+i.quantity,0);
  const el = qs('#cartCount');
  if(el) el.textContent = c;
}

/* ======================= GET PRODUCT ========================= */
export function getProductById(id){
  return products.find(p => p.id === Number(id));
}

/* ========================= USER AUTH ========================= */
export function getCurrentUser() {
  return JSON.parse(localStorage.getItem(USER_KEY) || "null");
}

export function updateUserHeader() {
  const user = getCurrentUser();
  const loginLink = qs('a[href="login.html"]');

  if (!loginLink) return;

  if (user) {
    // đổi "Đăng nhập" thành tên user
    loginLink.textContent = "👤 " + user.name;
    loginLink.href = "#";

    // tạo nút Đăng xuất
    let logoutBtn = document.createElement("a");
    logoutBtn.textContent = "Đăng xuất";
    logoutBtn.style.marginLeft = "15px";
    logoutBtn.style.cursor = "pointer";
        logoutBtn.onclick = () => {
      // Xóa thông tin user đang đăng nhập
      localStorage.removeItem(USER_KEY);
      // Xóa luôn giỏ hàng và danh sách đơn hàng đang lưu trên máy
      localStorage.removeItem('mobileshop_cart');
      localStorage.removeItem('mobileshop_orders');

      window.location.href = "login.html";
    };


    loginLink.parentElement.appendChild(logoutBtn);
  }
}

/* ======================== MOUNT HEADER ======================== */
export function mountHeaderActive(linkName){
  updateCartCountBadge();
  updateUserHeader(); // <-- Gọi hiển thị tên user
}
