const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Directories
const DATA_DIR = fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const ORDERS_TXT_FILE = path.join(DATA_DIR, 'orders.txt');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(ORDERS_TXT_FILE)) {
  fs.writeFileSync(ORDERS_TXT_FILE, '=== 신분증 제작 주문 내역 메모장 ===\n', 'utf8');
}

// Multer Config for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const name = (req.body && req.body.name) ? req.body.name.trim() : 'photo';
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${name}_${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage: storage });

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper to read orders
function readOrders() {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading orders file:', err);
    return [];
  }
}

function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error('Error writing orders file:', err);
  }
}

// APIs
// 1. Submit a new order
app.post('/api/orders', upload.single('photo'), (req, res) => {
  try {
    const {
      name,
      hanjaName,
      birth,
      birthBack,
      address,
      issueDate,
      authority,
      note,
      depositor,
      phone,
      deliveryAddress
    } = req.body;

    if (!name || !birth || !birthBack || !address || !depositor || !phone || !deliveryAddress) {
      return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '신분증 사진을 업로드해 주세요.' });
    }

    const orders = readOrders();
    
    // Generate a unique 6-character order code (e.g. ID1234)
    const orderCode = 'ID' + Math.floor(1000 + Math.random() * 9000);
    const photoPath = '/uploads/' + req.file.filename;
    const fullBirth = `${birth}-${birthBack}`;

    const newOrder = {
      id: Date.now().toString(),
      name,
      hanjaName: hanjaName || '',
      birth: fullBirth,
      address,
      issueDate: issueDate || new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      authority: authority || '대한민국 경찰청',
      note: note || '',
      depositor,
      phone,
      deliveryAddress,
      orderCode,
      photoPath,
      price: 70000,
      status: 'pending_deposit', // pending_deposit, completed, canceled
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    writeOrders(orders);

    // Write human-readable text backup to Notepad file
    const txtFilePath = path.join(__dirname, 'data', 'orders.txt');
    const orderText = `
==================================================
[주문 코드] ${newOrder.orderCode}
- 신청 일시: ${new Date(newOrder.createdAt).toLocaleString('ko-KR')}
- 한글 성명: ${newOrder.name} (한자 성명: ${newOrder.hanjaName || '없음'})
- 주민등록번호: ${newOrder.birth}
- 신분증 주소: ${newOrder.address}
- 발급 일자: ${newOrder.issueDate}
- 발급 기관: ${newOrder.authority}
- 배송 연락처: ${newOrder.phone}
- 배송지 주소: ${newOrder.deliveryAddress}
- 결제 입금자명: ${newOrder.depositor} (금액: 70,000원)
- 사진 파일명: ${newOrder.photoPath}
- 추가 요청사항: ${newOrder.note || '없음'}
==================================================
`;
    fs.appendFileSync(txtFilePath, orderText, 'utf8');

    res.status(201).json({
      success: true,
      message: '주문이 접수되었습니다.',
      order: newOrder
    });
  } catch (error) {
    console.error('Order submission error:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
});

// 2. Fetch all orders (Admin use)
app.get('/api/orders', (req, res) => {
  try {
    const orders = readOrders();
    // Sort by newest first
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
});

// 3. Update order status (Admin toggle)
app.post('/api/orders/update-status', (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ error: 'id and status are required' });
    }

    const orders = readOrders();
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    orders[orderIndex].status = status;
    writeOrders(orders);

    res.json({ success: true, order: orders[orderIndex] });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
});

// 4. Delete order (Admin use)
app.post('/api/orders/delete', (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const orders = readOrders();
    const filteredOrders = orders.filter(o => o.id !== id);

    if (orders.length === filteredOrders.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    writeOrders(filteredOrders);
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
