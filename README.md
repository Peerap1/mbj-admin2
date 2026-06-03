# MBJ Admin

React web app ใช้งานร่วมกับ Firebase Realtime Database และ Firebase Hosting

## ฟีเจอร์
- หน้า Login พร้อม user 3 ชุด
  - admin / admin1234
  - user / user1234
  - suser / suser1234
- เมนูหลัก
  - การขาย
  - ประวัติการขาย
  - จัดการข้อมูล (ลูกค้า, สินค้า, รายการธนาคาร)
  - รายงาน
- สิทธิ์การเข้าถึง
  - admin, suser: เห็นทุกเมนู
  - user: เห็นแค่ การขาย, ประวัติการขาย, จัดการข้อมูล (ลูกค้า, สินค้า)
- ใช้ Firebase Realtime Database เป็นแหล่งข้อมูลหลัก
- สร้าง UI ขาว-น้ำเงิน ดีไซน์ทันสมัย

## โครงสร้างโปรเจค
- `src/App.jsx` - โครงสร้างแอปหลัก, จัดเมนู, จัดการข้อมูลผู้ใช้
- `src/firebase.js` - เชื่อมต่อ Firebase, โหลดข้อมูลเริ่มต้น
- `src/pages` - แยกหน้าต่างๆ ตามฟีเจอร์
- `src/components/Sidebar.jsx` - เมนูด้านซ้าย
- `src/styles.css` - สไตล์ UI

## รันโปรเจค
1. ติดตั้งแพ็กเกจ
   ```bash
   npm install
   ```
2. รันในเครื่อง
   ```bash
   npm run dev
   ```
3. สร้าง build เพื่อ deploy
   ```bash
   npm run build
   ```

## Deploy ไปยัง Firebase Hosting
1. ติดตั้ง Firebase CLI (ถ้ายังไม่ได้ติดตั้ง)
   ```bash
   npm install -g firebase-tools
   ```
2. เข้าสู่ระบบ Firebase
   ```bash
   firebase login
   ```
3. เริ่มตั้งค่าโปรเจค Firebase
   ```bash
   firebase init
   ```
   - เลือก Hosting
   - กำหนด `dist` เป็น public directory
   - ตอบ yes สำหรับ SPA rewrite
4. อัปโหลด
   ```bash
   firebase deploy
   ```

## หมายเหตุ
- ค่าใช้จ่ายของ Firebase Hosting และ Realtime Database ขึ้นกับปริมาณการใช้งาน
- หากต้องการลดค่าใช้จ่าย ให้เก็บข้อมูลให้เล็กที่สุดและลดการเรียกข้อมูลบ่อยๆ
