import { brands, products } from './data.js';
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

function renderAll(list){
  const container = document.getElementById('allProducts');
  container.innerHTML = list.length ? list.map(productCard).join('') :
    `<div class="empty-state"><h2>Không tìm thấy sản phẩm</h2></div>`;
}

function initFilters(){
  const brandSel = document.getElementById('brandFilter');
  brands.forEach(b=>{
    const opt = document.createElement('option');
    opt.value = b; opt.textContent = b; brandSel.appendChild(opt);
  });

  const apply = ()=>{
    const term = document.getElementById('searchInput').value.trim().toLowerCase();
    const b = document.getElementById('brandFilter').value;
    const price = document.getElementById('priceFilter').value;

    let list = products.filter(p=>{
      const matchesTerm = p.name.toLowerCase().includes(term);
      const matchesBrand = !b || p.brand === b;
      let matchesPrice = true;
      if(price){
        const [min,max] = price.split('-').map(Number);
        const fp = calculateFinalPrice(p);
        matchesPrice = fp >= min && fp <= max;
      }
      return matchesTerm && matchesBrand && matchesPrice;
    });

    renderAll(list);
  };

  document.getElementById('searchInput').addEventListener('input', apply);
  document.getElementById('brandFilter').addEventListener('change', apply);
  document.getElementById('priceFilter').addEventListener('change', apply);

  renderAll(products);
}

document.addEventListener('DOMContentLoaded', ()=>{
  mountHeaderActive('products');
  initFilters();
});