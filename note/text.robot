อยากกเขียนเว็ปเองง่ายๆ ใช้ realtimedatabase firebase และ ใช้ ้host firebase 
HTML/CSS: ใช้สร้างโครงสร้างหน้าตาเว็บไซต์ (UI) ของคุณ
JavaScript: ใช้เชื่อมต่อและดึงข้อมูลจาก Firebase Realtime Database
Firebase Tools: ใช้สำหรับอัปโหลด (Deploy)
เลือกใช้ Framework React
และต่อ database
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBIxa5tK5x44qTQsdyPL_QkJxCt613seHw",
  authDomain: "mbj-admin.firebaseapp.com",
  projectId: "mbj-admin",
  storageBucket: "mbj-admin.firebasestorage.app",
  messagingSenderId: "922634034449",
  appId: "1:922634034449:web:3d7a686a100071b81a80b0",
  measurementId: "G-CQSV8BB2RM"
};
โดยคำนึงถึงความประหยัด
1.Hosting
Storage 
Downloads 

2.Realtime Database
Storage 
Downloads 

ใชีทีม web สีขาว และปุ่มสีน้ำเงิน และให้ช่วยออกแบบ design ต่างๆ ให้ดูดีและทันสมัย
วาง project structure ให้ถูกหลัก และสามารถ imprement ต่อได้ง่าย แยกเป็น page และ functions
ให้ทำหน้า login โดยให้กรอก username และ password
โดยสร้าง user ไว้เลยทั้ง 3user Database
username1
username : admin
password : admin1234

username2
username : user
password : user1234

username3
username : suser
password : suser1234

เมื่อ login เสร็จแล้ว จะมีเมนูทางด้่นซ้ายดังนนี้
-การขาย
-ประวัติการขาย
-จัดการข้อมูล
--ลูกค้า
--สินค้า
--รายการธนาคาร
-รายงาน

เมื่อlogin สำเร็จจะแสดงที่เมนู การขาย

สิทธิ์การมองเห็นเมนู
admin, suser เห็นทุกเมนู
user เห็นแค่เมนู
-การขาย
-ประวัติการขาย
-จัดการข้อมูล
--ลูกค้า
--สินค้า