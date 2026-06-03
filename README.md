# MBJ Admin System

ระบบจัดการธุรกิจ React + Firebase Realtime Database

## โครงสร้าง Project

```
mbj-app/
├── public/
│   └── index.html
├── src/
│   ├── firebase/
│   │   ├── config.js          # Firebase config & init
│   │   └── database.js        # CRUD functions ทั้งหมด
│   ├── context/
│   │   └── AuthContext.js     # Auth state + role permission
│   ├── components/
│   │   ├── Layout.js / .css   # Sidebar + Topbar layout
│   │   └── CrudPage.js        # Reusable CRUD component
│   ├── pages/
│   │   ├── Login.js / .css    # หน้า Login
│   │   ├── Sales.js           # หน้าการขาย
│   │   ├── History.js         # ประวัติการขาย
│   │   ├── Customers.js       # จัดการลูกค้า
│   │   ├── Products.js        # จัดการสินค้า
│   │   ├── Banks.js           # รายการธนาคาร
│   │   └── Reports.js         # รายงาน
│   ├── App.js                 # Router หลัก
│   ├── App.css                # Styles เพิ่มเติม
│   └── index.css              # Global styles
├── firebase.json              # Firebase hosting config
├── database.rules.json        # Realtime Database rules
└── package.json
```

## วิธีติดตั้งและใช้งาน

### 1. ติดตั้ง dependencies

```bash
cd mbj-app
npm install
```

### 2. ตั้งค่า Firebase databaseURL

เปิดไฟล์ `src/firebase/config.js` แล้วแก้ไข `databaseURL` ให้ตรงกับ project ของคุณ:

```js
databaseURL: "https://mbj-admin-default-rtdb.asia-southeast1.firebasedatabase.app"
```

> หา databaseURL ได้จาก Firebase Console → Realtime Database → URL ที่แสดงด้านบน

### 3. รันในเครื่อง (Development)

```bash
npm start
```

เปิดที่ http://localhost:3000

### 4. Build สำหรับ Production

```bash
npm run build
```

### 5. Deploy ขึ้น Firebase Hosting

```bash
# ติดตั้ง Firebase CLI (ครั้งแรกครั้งเดียว)
npm install -g firebase-tools

# Login Firebase
firebase login

# Deploy
firebase deploy
```

---

## Users เริ่มต้น (สร้างอัตโนมัติใน Database)

| Username | Password   | Role  | สิทธิ์                                    |
|----------|-----------|-------|------------------------------------------|
| admin    | admin1234 | admin | เห็นทุกเมนู                               |
| suser    | suser1234 | suser | เห็นทุกเมนู                               |
| user     | user1234  | user  | การขาย, ประวัติการขาย, ลูกค้า, สินค้า   |

---

## Firebase Realtime Database Structure

```
mbj-admin/
├── users/
│   ├── user1: { username, password, role }
│   ├── user2: { ... }
│   └── user3: { ... }
├── customers/
│   └── {id}: { name, phone, email, address, note, createdAt }
├── products/
│   └── {id}: { name, price, unit, stock, category, description, createdAt }
├── banks/
│   └── {id}: { name, accountName, accountNo, branch, note, createdAt }
└── sales/
    └── {id}: { customerId, customerName, bankId, bankName, items[], total, note, createdBy, status, createdAt }
```

---

## การประหยัด Firebase Quota

- ใช้ **onValue listener** แทน polling (ลด reads)
- **sessionStorage** เก็บ user session (ไม่ต้อง query users ทุกครั้ง)
- ข้อมูล static เช่น users/products load ครั้งเดียวแล้ว cache ใน state
- Hosting cache `max-age=31536000` สำหรับ static assets
- ไม่ใช้ Firebase Analytics/Storage เพื่อประหยัด bandwidth

---

## การเพิ่ม Feature ใหม่

1. **เพิ่มหน้าใหม่**: สร้างไฟล์ใน `src/pages/`
2. **เพิ่ม CRUD**: ใช้ `CrudPage` component โดยส่ง `columns`, `fields`, `onAdd/onEdit/onDelete`
3. **เพิ่มเมนู**: แก้ไข `Layout.js` และเพิ่ม Route ใน `App.js`
4. **เพิ่ม DB function**: เพิ่มใน `src/firebase/database.js`
5. **เพิ่ม Permission**: แก้ไข `canSee()` ใน `AuthContext.js`
