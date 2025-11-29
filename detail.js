import { 
  getProductById, 
  calculateFinalPrice, 
  formatPrice, 
  getCart, 
  setCart, 
  mountHeaderActive 
} from './utils.js';

function changeQuantity(delta){
  const input = document.getElementById('detailQuantity');
  const v = Math.max(1, parseInt(input.value || '1', 10) + delta);
  input.value = v;
}
window.changeQuantity = changeQuantity;

function addToCart(productId){
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user){
    alert("Bạn cần đăng nhập để thêm vào giỏ hàng!");
    return location.href = "login.html";
  }

  const qty = parseInt(document.getElementById('detailQuantity').value,10) || 1;
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === productId);

  if (idx >= 0) cart[idx].quantity += qty;
  else cart.push({ id: productId, quantity: qty });

  setCart(cart);

  alert("Đã thêm sản phẩm vào giỏ hàng!");
}
window.addToCartFromDetail = addToCart;

function renderDetail(){
  const id = new URLSearchParams(location.search).get('id');
  const p = getProductById(id);

  if (!p){
    const box = document.getElementById('productDetailContent');
    if (box) box.innerHTML = "<p>Không tìm thấy sản phẩm.</p>";
    return;
  }

  const fp = calculateFinalPrice(p);
  const images = p.images?.length ? p.images : [p.img];

  // Chuẩn bị HTML thông số (nếu có)
  const specsHtml = (p.specs && p.specs.length)
    ? p.specs.map(s => `
        <tr>
          <td>${s.label}</td>
          <td>${s.value}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="2">Không có dữ liệu.</td></tr>`;

  // ====== GIAO DIỆN CHÍNH ======
  document.getElementById('productDetailContent').innerHTML = `
    <div class="product-detail-content">
      <div class="product-detail-gallery">
        <div class="main-image-wrapper">
          <button class="gallery-nav prev" id="galleryPrevBtn">&#10094;</button>
          <img id="mainProductImage" src="${images[0]}" class="product-detail-image">
          <button class="gallery-nav next" id="galleryNextBtn">&#10095;</button>
        </div>

        <div class="thumbs-row">
          ${images.map((src,i)=>`
            <img src="${src}" class="thumb-image ${i===0?'active':''}" data-index="${i}">
          `).join('')}
        </div>
      </div>

      <div class="product-detail-info">
        <h2>${p.name}</h2>
        <div class="current-price">${formatPrice(fp)}</div>

        <!-- ⭐ MÔ TẢ NẰM NGAY DƯỚI GIÁ ⭐ -->
        <p id="shortDesc" class="detail-short"></p>

        <button type="button" class="toggle-desc-btn" id="toggleDescBtn">
          Xem thêm mô tả ▾
        </button>

        <div id="detailMore" class="detail-more" style="display:none;">
          <p id="fullDesc" class="detail-full"></p>

          <h4 class="detail-spec-title">Thông số kỹ thuật</h4>
          <table class="spec-table">
            ${specsHtml}
          </table>
        </div>
        <!-- hết phần mô tả -->

        <div class="quantity-selector">
          <button onclick="changeQuantity(-1)">-</button>
          <input type="number" id="detailQuantity" value="1" min="1" readonly>
          <button onclick="changeQuantity(1)">+</button>
        </div>

        <button class="btn" onclick="addToCartFromDetail(${p.id})">Thêm vào giỏ hàng</button>
      </div>
    </div>
  `;

  // Gán nội dung mô tả
  const shortEl = document.getElementById("shortDesc");
  const fullEl  = document.getElementById("fullDesc");
  if (shortEl) shortEl.textContent = p.shortDescription || "";
  if (fullEl)  fullEl.textContent  = p.fullDescription || "";

  // Nút xem thêm / thu gọn
  const toggleBtn  = document.getElementById("toggleDescBtn");
  const detailMore = document.getElementById("detailMore");
  let expanded = false;

  if (toggleBtn && detailMore) {
    toggleBtn.onclick = () => {
      expanded = !expanded;
      detailMore.style.display = expanded ? "block" : "none";
      toggleBtn.textContent = expanded ? "Thu gọn mô tả ▴" : "Xem thêm mô tả ▾";
    };
  }

  // ====== GALLERY ẢNH PHỤ ======
  let index = 0;
  const mainImage = document.getElementById("mainProductImage");
  const thumbs = [...document.querySelectorAll(".thumb-image")];

  function show(i){
    index = i;
    if (mainImage) mainImage.src = images[i];
    thumbs.forEach((t,idx)=>t.classList.toggle("active", idx===i));
  }

  const prevBtn = document.getElementById("galleryPrevBtn");
  const nextBtn = document.getElementById("galleryNextBtn");

  if (prevBtn) prevBtn.onclick = ()=>show((index - 1 + images.length) % images.length);
  if (nextBtn) nextBtn.onclick = ()=>show((index + 1) % images.length);

  thumbs.forEach((t,i)=> t.onclick = ()=>show(i));
}

document.addEventListener("DOMContentLoaded", () => {
  mountHeaderActive();
  renderDetail();

  document.getElementById("backBtn")?.addEventListener("click", () => {
    history.back();
  });
});
