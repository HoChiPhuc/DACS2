const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");
db.query("SELECT DATABASE() AS db, @@port AS port", (err, rows) => {
  console.log("🔥 Node đang dùng DB:", rows);
});

db.query("SELECT COUNT(*) AS users_count FROM users", (err, rows) => {
  if (err) {
    console.error("🔥 Lỗi SELECT COUNT users:", err);
  } else {
    console.log("🔥 Số user trong DB Node đang thấy:", rows[0].users_count);
  }
});

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // phục vụ HTML/CSS/JS

/* ================== USERS ================== */

// Đăng ký
app.post("/api/register", async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Thiếu thông tin!" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)",
      [name, email, phone || "", hash],
      (err, result) => {
        if (err) {
          console.error("Lỗi INSERT users:", err);
          return res.status(500).json({ message: "Email đã tồn tại hoặc lỗi DB!" });
        }
        res.json({ message: "Đăng ký thành công!" });
      }
    );
  } catch (e) {
    console.error("Lỗi bcrypt:", e);
    res.status(500).json({ message: "Lỗi server khi mã hóa mật khẩu" });
  }
});

// Đăng nhập
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, rows) => {
      if (err || rows.length === 0) {
        console.error("Lỗi SELECT users:", err);
        return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
      }

      const user = rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
      }

      res.json({ message: "Đăng nhập thành công!", user });
    }
  );
});

/* ================== CART ================== */

// Thêm vào giỏ (hoặc cộng dồn nếu đã tồn tại)
app.post("/api/cart/add", (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  db.query(
    `INSERT INTO cart (user_id, product_id, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
    [user_id, product_id, quantity, quantity],
    err => {
      if (err) {
        console.error("Lỗi INSERT cart:", err);
        return res.status(500).json({ message: "Lỗi thêm giỏ hàng" });
      }
      res.json({ message: "Đã thêm vào giỏ hàng" });
    }
  );
});

// Lấy giỏ theo user
app.get("/api/cart/:user_id", (req, res) => {
  const { user_id } = req.params;

  db.query(
    "SELECT * FROM cart WHERE user_id = ?",
    [user_id],
    (err, result) => {
      if (err) {
        console.error("Lỗi SELECT cart:", err);
        return res.status(500).json({ message: "Lỗi lấy giỏ hàng" });
      }
      res.json(result);
    }
  );
});

// Cập nhật số lượng
app.post("/api/cart/update", (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  db.query(
    "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?",
    [quantity, user_id, product_id],
    err => {
      if (err) {
        console.error("Lỗi UPDATE cart:", err);
        return res.status(500).json({ message: "Lỗi cập nhật giỏ hàng" });
      }
      res.json({ message: "Cập nhật thành công" });
    }
  );
});

// Xóa 1 item
app.post("/api/cart/remove", (req, res) => {
  const { user_id, product_id } = req.body;

  db.query(
    "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
    [user_id, product_id],
    err => {
      if (err) {
        console.error("Lỗi DELETE cart:", err);
        return res.status(500).json({ message: "Lỗi xoá sản phẩm" });
      }
      res.json({ message: "Đã xoá sản phẩm" });
    }
  );
});

/* ================== ORDERS ================== */

// Tạo đơn hàng từ giỏ (checkout)
app.post("/api/orders/create", (req, res) => {
  const { user_id, items, total_price } = req.body;
  console.log("📦 /api/orders/create body:", req.body);

  // Validate dữ liệu
  if (!user_id || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ message: "Dữ liệu đơn hàng không hợp lệ (thiếu user_id hoặc items)." });
  }

  // 1. Tạo order
  const sqlOrder = "INSERT INTO orders (user_id, total_price) VALUES (?, ?)";
  db.query(sqlOrder, [user_id, total_price], (err, result) => {
    if (err) {
      console.error("❌ Lỗi tạo orders:", err);
      return res.status(500).json({ message: "Lỗi tạo đơn hàng" });
    }

    const order_id = result.insertId;

    // 2. Chuẩn bị dữ liệu order_items
    let values;
    try {
      values = items.map((i) => {
        if (
          typeof i.product_id === "undefined" ||
          typeof i.quantity === "undefined" ||
          typeof i.unit_price === "undefined"
        ) {
          throw new Error("item thiếu trường product_id / quantity / unit_price");
        }
        return [order_id, i.product_id, i.quantity, i.unit_price];
      });
    } catch (e) {
      console.error("❌ Cấu trúc items không đúng:", e);
      return res.status(400).json({ message: "Cấu trúc items không đúng." });
    }

    // 3. Lưu các dòng order_items
    const sqlItems =
      "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ?";
    db.query(sqlItems, [values], (err2) => {
      if (err2) {
        console.error("❌ Lỗi lưu chi tiết đơn hàng:", err2);
        return res.status(500).json({ message: "Lỗi lưu chi tiết đơn hàng" });
      }

      console.log("✅ Tạo đơn hàng thành công:", order_id);
      return res.json({ message: "Tạo đơn hàng thành công", order_id });
    });
  });
});

// Lấy danh sách đơn + item cho 1 user
app.get("/api/orders/:user_id", (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT 
      o.id AS order_id,
      o.total_price,
      o.created_at,
      oi.product_id,
      oi.quantity,
      oi.unit_price
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC, oi.id ASC
  `;

  db.query(sql, [user_id], (err, rows) => {
    if (err) {
      console.error("❌ Lỗi SELECT orders:", err);
      return res.status(500).json({ message: "Lỗi lấy đơn hàng" });
    }
    res.json(rows);
  });
});
/* ================== GLOBAL ERROR HANDLER ================== */
// Nếu bất kỳ middleware / route nào ném lỗi (next(err)),
// Express sẽ chạy vào đây thay vì trả HTML mặc định.
app.use((err, req, res, next) => {
  console.error("🔥 Global error:", err);
  // Nếu header chưa gửi thì trả JSON, client sẽ parse được
  if (!res.headersSent) {
    return res.status(500).json({
      message: "Lỗi server toàn cục",
      error: String(err),
    });
  }
  // Nếu lỡ gửi rồi thì thôi
  next(err);
});
/* ================== START SERVER ================== */

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
