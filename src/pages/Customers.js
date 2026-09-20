// src/pages/Customers.js
import React, { useState, useEffect } from "react";
import CrudPage from "../components/CrudPage";
import { Link } from "react-router-dom";
import {
  getCustomers,
  getEmployees,
  getSales,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from "../firebase/database";
import { useAuth } from "../context/AuthContext";
import { customerStats, formatDate } from "../utils/customerAnalysis";

const options = (values) => values.map((value) => ({ value, label: value }));
const customerTypes = options([
  "ร้านของฝาก",
  "ร้านค้าปลีก",
  "ยี่ปั๊ว / ขายส่ง",
  "ตัวแทนจำหน่าย",
  "Modern Trade",
  "Online Reseller",
  "ลูกค้าบุคคลทั่วไป",
  "โรงแรม / ร้านอาหาร / คาเฟ่",
  "Corporate / ของฝากองค์กร",
  "Export",
  "อื่น ๆ",
]);
const channels = options([
  "ลูกค้าเดิม",
  "ลูกค้าแนะนำ",
  "Sales",
  "Facebook",
  "LINE",
  "TikTok",
  "Shopee",
  "Lazada",
  "Website",
  "หน้าร้านโรงงาน",
  "งานแสดงสินค้า",
  "Business Matching",
  "หน่วยงานราชการ / OTOP",
  "อื่น ๆ",
]);

const provinceOptions = [
  "กรุงเทพมหานคร",
  "กระบี่",
  "กาญจนบุรี",
  "กาฬสินธุ์",
  "กำแพงเพชร",
  "ขอนแก่น",
  "จันทบุรี",
  "ฉะเชิงเทรา",
  "ชลบุรี",
  "ชัยนาท",
  "ชัยภูมิ",
  "ชุมพร",
  "เชียงราย",
  "เชียงใหม่",
  "ตรัง",
  "ตราด",
  "ตาก",
  "นครนายก",
  "นครปฐม",
  "นครพนม",
  "นครราชสีมา",
  "นครศรีธรรมราช",
  "นครสวรรค์",
  "นนทบุรี",
  "นราธิวาส",
  "น่าน",
  "บึงกาฬ",
  "บุรีรัมย์",
  "ปทุมธานี",
  "ประจวบคีรีขันธ์",
  "ปราจีนบุรี",
  "ปัตตานี",
  "พระนครศรีอยุธยา",
  "พะเยา",
  "พังงา",
  "พัทลุง",
  "พิจิตร",
  "พิษณุโลก",
  "เพชรบุรี",
  "เพชรบูรณ์",
  "แพร่",
  "ภูเก็ต",
  "มหาสารคาม",
  "มุกดาหาร",
  "แม่ฮ่องสอน",
  "ยโสธร",
  "ยะลา",
  "ร้อยเอ็ด",
  "ระนอง",
  "ระยอง",
  "ราชบุรี",
  "ลพบุรี",
  "ลำปาง",
  "ลำพูน",
  "เลย",
  "ศรีสะเกษ",
  "สกลนคร",
  "สงขลา",
  "สตูล",
  "สมุทรปราการ",
  "สมุทรสงคราม",
  "สมุทรสาคร",
  "สระแก้ว",
  "สระบุรี",
  "สิงห์บุรี",
  "สุโขทัย",
  "สุพรรณบุรี",
  "สุราษฎร์ธานี",
  "สุรินทร์",
  "หนองคาย",
  "หนองบัวลำภู",
  "อ่างทอง",
  "อำนาจเจริญ",
  "อุดรธานี",
  "อุตรดิตถ์",
  "อุทัยธานี",
  "อุบลราชธานี",
].map((province) => ({ value: province, label: province }));

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sales, setSales] = useState([]);
  const [salesReady, setSalesReady] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const unsub = getCustomers(setCustomers);
    const owners = getEmployees(setEmployees);
    const orders = getSales((data) => {
      setSales(data);
      setSalesReady(true);
    });
    return () => {
      unsub();
      owners();
      orders();
    };
  }, []);
  const ownerOptions = options([
    ...new Set(
      [
        user?.username,
        ...employees.map((e) => e.name),
        ...customers.map((c) => c.salesOwner),
      ].filter(Boolean),
    ),
  ]);
  const items = customers.map((c) => {
    const stats = customerStats(sales.filter((s) => s.customerId === c.id));
    return {
      ...c,
      firstOrder: salesReady ? formatDate(stats.first) : "กำลังโหลด…",
      activityStatus: salesReady ? stats.status : "กำลังโหลด…",
    };
  });
  const cleanForm = ({ firstOrder, activityStatus, id, ...data }) => data;

  const columns = [
    {
      key: "name",
      label: "ชื่อลูกค้า",
      render: (name, customer) => (
        <Link className="analysis-link" to={`/customers/${customer.id}`}>
          {name}
        </Link>
      ),
    },
    { key: "phone", label: "เบอร์โทร" },
    { key: "address", label: "ที่อยู่" },
    { key: "province", label: "จังหวัด" },
    { key: "customerType", label: "ประเภทลูกค้า" },
    { key: "salesOwner", label: "ผู้ดูแล" },
    { key: "firstOrder", label: "ซื้อครั้งแรก" },
    { key: "activityStatus", label: "สถานะ" },
  ];

  const fields = [
    { key: "name", label: "ชื่อลูกค้า", required: true, placeholder: "กรอกชื่อลูกค้า" },
    { key: "phone", label: "เบอร์โทรศัพท์", type: "tel", placeholder: "0xx-xxx-xxxx" },
    {
      key: "address",
      label: "ที่อยู่จัดส่ง",
      type: "textarea",
      placeholder: "กรอกที่อยู่สำหรับจัดส่งสินค้า",
    },
    { key: "province", label: "จังหวัด", type: "select", options: provinceOptions },
    { key: "customerType", label: "ประเภทลูกค้า", type: "select", options: customerTypes },
    {
      key: "acquisitionChannel",
      label: "ช่องทางที่ได้ลูกค้ามา",
      type: "select",
      options: channels,
    },
    {
      key: "salesOwner",
      label: "ผู้ดูแลลูกค้า",
      type: "select",
      options: ownerOptions,
      readOnlyOnAdd: true,
    },
    { key: "note", label: "หมายเหตุ", placeholder: "หมายเหตุ (ถ้ามี)" },
  ];

  return (
    <CrudPage
      title="ลูกค้า"
      subtitle="จัดการข้อมูลลูกค้า"
      items={items}
      columns={columns}
      fields={fields}
      initialValues={{ salesOwner: user?.username || "" }}
      onAdd={(data) => addCustomer({ ...cleanForm(data), salesOwner: user?.username || "" })}
      onEdit={(id, data) => updateCustomer(id, cleanForm(data))}
      onDelete={deleteCustomer}
    />
  );
}
