import { useEffect, useState } from "react";
import { getCustomers, getProducts, getSales } from "../firebase/database";

export default function useBusinessData() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [ready, setReady] = useState({});
  const [error, setError] = useState("");
  useEffect(() => {
    const subscriptions = [["customers", getCustomers, setCustomers], ["products", getProducts, setProducts], ["sales", getSales, setSales]]
      .map(([key, getData, setData]) => getData(data => {
        setData(data); setReady(old => ({ ...old, [key]: true }));
      }, () => setError("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อและสิทธิ์เข้าถึง")));
    return () => subscriptions.forEach(unsubscribe => unsubscribe());
  }, []);
  return { customers, products, sales, loading: !ready.customers || !ready.products || !ready.sales, error };
}
