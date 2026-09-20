import useCollection from "../hooks/useCollection";
// src/pages/Customers.js
import React from "react";
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

import { options, customerTypes, channels, provinceOptions } from "../features/customers/fields";
export default function Customers() {
  const {
    data: customers,
    loading: customersLoading,
    error: customersError,
  } = useCollection(getCustomers);
  const {
    data: employees,
    loading: employeesLoading,
    error: employeesError,
  } = useCollection(getEmployees);
  const { data: sales, loading: salesLoading, error: salesError } = useCollection(getSales);

  const { user } = useAuth();

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
      firstOrder: !salesLoading ? formatDate(stats.first) : "กำลังโหลด…",
      activityStatus: !salesLoading ? stats.status : "กำลังโหลด…",
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

  const dataError = customersError || employeesError || salesError;
  if (dataError) return <p className="analysis-error">{dataError}</p>;
  if (customersLoading || employeesLoading || salesLoading) return <p>กำลังโหลดข้อมูล…</p>;
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
