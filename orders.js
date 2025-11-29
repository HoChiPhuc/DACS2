import { formatPrice, calculateFinalPrice, getOrders, mountHeaderActive } from './utils.js';

function renderOrders(){
  const orders = getOrders();
  const wrap = document.getElementById('ordersList');

  if(!orders.length){
    wrap.innerHTML = `
      <div class="empty-state">
        <h2>Chưa có đơn hàng</h2>
        <p>Bạn chưa đặt đơn hàng nào</p>
        <button class="btn" onclick="location.href='products.html'">Mua sắm ngay</button>
      </div>`;
    return;
  }

  wrap.innerHTML = orders.map(order=>{
    const itemsHtml = order.items.map(it=>`
      <div class="order-item">
        <img src="${it.img}" alt="${it.name}" class="order-item-image">
        <div>
          <h4>${it.name}</h4>
          <p style="color:#666">Số lượng: ${it.quantity}</p>
          <p style="font-weight:bold;color:#ff4757">${formatPrice(calculateFinalPrice(it)*it.quantity)}</p>
        </div>
      </div>
    `).join('');

    return `
      <div class="order-card">
        <div class="order-header">
          <div>
            <h3>Đơn hàng #${order.id}</h3>
            <p style="color:#666">${order.date}</p>
          </div>
          <div style="text-align:right">
            <p><strong>${order.customer.name}</strong></p>
            <p>${order.customer.phone}</p>
            <p style="color:#666">${order.customer.address}</p>
          </div>
        </div>
        ${itemsHtml}
        <div style="text-align:right;margin-top:1rem;padding-top:1rem;border-top:2px solid #f0f0f0">
          <h3 style="color:#ff4757">Tổng: ${formatPrice(order.total)}</h3>
        </div>
      </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', ()=>{
  mountHeaderActive('orders');
  renderOrders();
});
const user = JSON.parse(localStorage.getItem("currentUser"));

const res = await fetch("/api/orders/" + user.id);
const orders = await res.json();

console.log(orders); // Sau tôi làm UI cho bạn nếu bạn muốn
