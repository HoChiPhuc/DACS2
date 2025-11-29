import { products } from "./data.js";
import { 
  getCart, 
  setCart, 
  calculateFinalPrice, 
  formatPrice, 
  mountHeaderActive 
} from "./utils.js";

/* Lấy cart + gắn thông tin sản phẩm */
function expandCartItems() {
  const cart = getCart();
  return cart
    .map(ci => {
      const p = products.find(x => x.id === ci.id);
      return p ? { ...p, quantity: ci.quantity } : null;
    })
    .filter(Boolean);
}

/* Cập nhật số lượng */
function updateQuantity(id, q) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity = Math.max(1, parseInt(q || "1", 10));
  setCart(cart);
  renderCart();
}

/* Xoá sản phẩm */
function removeItem(id) {
  const cart = getCart().filter(i => i.id !== id);
  setCart(cart);
  renderCart();
}

/* Gửi đơn hàng lên server */
async function handleCheckout() {
  const user = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (!user) {
    alert("Bạn cần đăng nhập trước khi thanh toán!");
    location.href = "login.html";
    return;
  }

  const itemsExpanded = expandCartItems();
  if (!itemsExpanded.length) {
    alert("Giỏ hàng trống!");
    return;
  }

  const items = itemsExpanded.map(i => ({
    product_id: i.id,
    quantity: i.quantity,
    unit_price: calculateFinalPrice(i),
  }));

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  // 1. Gửi request – chỉ bắt lỗi mạng
  const res = await fetch("/api/orders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: user.id, items, total_price: total }),
  }).catch(err => {
    console.error("❌ Lỗi fetch /api/orders/create:", err);
    alert("Không kết nối được server (server tắt hoặc lỗi mạng).");
    return null;
  });

  if (!res) return;

  // 2. Đọc body
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("⚠ Raw response từ server (không phải JSON):", text);
    alert("Server trả về dữ liệu không phải JSON. Xem Console để xem chi tiết.");
    return;
  }

  console.log("✅ Kết quả /api/orders/create:", data);

  if (!res.ok || !data || (data.message && data.message.startsWith("Lỗi"))) {
    alert(data.message || "Server báo lỗi khi đặt hàng");
    return;
  }

  alert(data.message || "Đặt hàng thành công!");
  setCart([]);
  renderCart();
  location.href = "orders.html";
}
/* Render UI giỏ hàng */
function renderCart() {
  const listEl = document.getElementById("cartItems");
  const sumEl = document.getElementById("cartSummary");

  const items = expandCartItems();
  if (!items.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <h2>Giỏ hàng trống</h2>
        <p>Hãy thêm sản phẩm vào giỏ hàng</p>
        <button class="btn" onclick="location.href='products.html'">Mua sắm ngay</button>
      </div>`;
    sumEl.innerHTML = "";
    return;
  }

  listEl.innerHTML = items
    .map(item => {
      const fp = calculateFinalPrice(item);
      return `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-info">
          <h3>${item.name}</h3>
          <p style="color:#667eea">${item.brand}</p>
          <p style="font-size:1.2rem;font-weight:bold;color:#ff4757">${formatPrice(fp)}</p>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-selector">
            <button onclick="window.__updateQty(${item.id}, ${item.quantity - 1})">-</button>
            <input type="number" value="${item.quantity}" min="1"
                   onchange="window.__updateQty(${item.id}, this.value)">
            <button onclick="window.__updateQty(${item.id}, ${item.quantity + 1})">+</button>
          </div>
          <button class="btn btn-danger" onclick="window.__removeItem(${item.id})">Xóa</button>
        </div>
      </div>`;
    })
    .join("");

  const subtotal = items.reduce(
    (s, i) => s + calculateFinalPrice(i) * i.quantity,
    0
  );
  const discount = items.reduce(
    (s, i) => s + (i.price * i.discountPercent) / 100 * i.quantity,
    0
  );
  const before = subtotal + discount;

  sumEl.innerHTML = `
    <div class="cart-summary">
      <div class="summary-row"><span>Tạm tính:</span><span>${formatPrice(before)}</span></div>
      <div class="summary-row"><span>Giảm giá:</span><span style="color:#ff4757">-${formatPrice(discount)}</span></div>
      <div class="summary-row total"><span>Tổng cộng:</span><span>${formatPrice(subtotal)}</span></div>
      <button class="btn" id="checkoutBtn">Tiến hành thanh toán</button>
    </div>
  `;

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) checkoutBtn.onclick = handleCheckout;
}

/* Gắn global cho nút +/- */
window.__updateQty = (id, q) => updateQuantity(id, q);
window.__removeItem = id => removeItem(id);

document.addEventListener("DOMContentLoaded", () => {
  mountHeaderActive("cart");
  renderCart();
});
const checkoutBtn = document.getElementById("checkoutBtn");
if (checkoutBtn) checkoutBtn.onclick = handleCheckout;

