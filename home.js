import { products } from './data.js';
import { calculateFinalPrice, formatPrice, mountHeaderActive } from './utils.js';

function productCard(product){
  const finalPrice = calculateFinalPrice(product);
  const discountBlock = product.discountPercent > 0
    ? `<span class="original-price">${formatPrice(product.price)}</span>
       <span class="discount-badge">-${product.discountPercent}%</span>`
    : '';
  return `
  <div class="product-card" onclick="location.href='product.html?id=${product.id}'">
    <img src="${product.img}" alt="${product.name}" class="product-image">
    <div class="product-info">
      <div class="product-brand">${product.brand}</div>
      <div class="product-name">${product.name}</div>
      <div class="product-price">${discountBlock}</div>
      <div class="current-price">${formatPrice(finalPrice)}</div>
      <button class="btn" onclick="event.stopPropagation(); location.href='product.html?id=${product.id}'">Xem chi tiết</button>
    </div>
  </div>`;
}

function renderFeatured(){
  const featured = [...products].sort(()=>0.5 - Math.random()).slice(0,4);
  document.getElementById('featuredProducts').innerHTML = featured.map(productCard).join('');
}
function renderDiscount(){
  const discounted = products.filter(p=>p.discountPercent>0);
  document.getElementById('discountProducts').innerHTML = discounted.map(productCard).join('');
}

document.addEventListener('DOMContentLoaded', ()=>{
  mountHeaderActive('home');
  renderFeatured();
  renderDiscount();
});