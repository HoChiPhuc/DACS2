import { products } from './data.js';
import { getCart, setCart, calculateFinalPrice, formatPrice, getOrders, setOrders, mountHeaderActive } from './utils.js';

document.addEventListener('DOMContentLoaded', ()=>{
  mountHeaderActive('checkout');

  const form = document.getElementById('checkoutForm');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const cart = getCart();
    if(!cart.length){ alert('Giỏ hàng trống!'); location.href='products.html'; return; }

    const items = cart.map(ci=>{
      const p = products.find(x=>x.id===ci.id);
      return { ...p, quantity: ci.quantity };
    });
    const total = items.reduce((s,i)=> s + calculateFinalPrice(i)*i.quantity, 0);

    const order = {
      id: Date.now(),
      date: new Date().toLocaleString('vi-VN'),
      customer: {
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value
      },
      items, total
    };

    const orders = getOrders();
    orders.push(order);
    setOrders(orders);
    setCart([]);

    alert('Đặt hàng thành công! Cảm ơn bạn đã mua hàng.');
    form.reset();
    location.href = 'orders.html';
  });
});
const user = JSON.parse(localStorage.getItem("currentUser"));
const cart = await fetch("/api/cart/" + user.id).then(r=>r.json());

const items = cart.map(c => ({
  product_id: c.product_id,
  quantity: c.quantity,
  unit_price: getProductById(c.product_id).price
}));

const total = items.reduce((s,i)=>s+i.quantity*i.unit_price,0);

await fetch("/api/orders/create", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({
    user_id: user.id,
    items,
    total_price: total
  })
});
