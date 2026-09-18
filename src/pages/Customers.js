// src/pages/Customers.js
import React, { useState, useEffect } from "react";
import CrudPage from "../components/CrudPage";
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from "../firebase/database";

const provinceOptions = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร",
  "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร",
  "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม",
  "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส",
  "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี",
  "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร",
  "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม",
  "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง",
  "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร",
  "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว",
  "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์",
  "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์",
  "อุทัยธานี", "อุบลราชธานี",
].map((province) => ({ value: province, label: province }));

export default function Customers() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const unsub = getCustomers(setCustomers);
    return unsub;
  }, []);

  const columns = [
    { key: "name", label: "ชื่อลูกค้า" },
    { key: "phone", label: "เบอร์โทร" },
    { key: "address", label: "ที่อยู่" },
    { key: "province", label: "จังหวัด" },
  ];

  const fields = [
    { key: "name", label: "ชื่อลูกค้า", required: true, placeholder: "กรอกชื่อลูกค้า" },
    { key: "phone", label: "เบอร์โทรศัพท์", type: "tel", placeholder: "0xx-xxx-xxxx" },
    { key: "address", label: "ที่อยู่จัดส่ง", type: "textarea", placeholder: "กรอกที่อยู่สำหรับจัดส่งสินค้า" },
    { key: "province", label: "จังหวัด", type: "select", options: provinceOptions },
    { key: "note", label: "หมายเหตุ", placeholder: "หมายเหตุ (ถ้ามี)" },
  ];

  return (
    <CrudPage
      title="ลูกค้า"
      subtitle="จัดการข้อมูลลูกค้า"
      items={customers}
      columns={columns}
      fields={fields}
      onAdd={addCustomer}
      onEdit={updateCustomer}
      onDelete={deleteCustomer}
    />
  );
}
