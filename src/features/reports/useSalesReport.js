import { useMemo, useState } from "react";
import { exportAnalysis } from "./exportAnalysis";
import useBusinessData from "../../hooks/useBusinessData";
import {
  analysisRows,
  customerKey,
  customerStats,
  dateKey,
  inRange,
  monthlySeries,
  orderLines,
  productTotals,
  saleRevenue,
  validSales,
} from "../../utils/customerAnalysis";

export default function useSalesReport() {
  const { customers, products, sales, loading, error } = useBusinessData();
  const today = dateKey(Date.now()),
    year = Number(today.slice(0, 4));
  const [start, setStart] = useState(`${year}-01-01`);
  const [end, setEnd] = useState(today);
  const [metric, setMetric] = useState("net");
  const [selection, setSelection] = useState(null);
  const [exportError, setExportError] = useState("");
  const [limit, setLimit] = useState(30);
  const invalid = !start || !end || start > end;
  const all = useMemo(() => validSales(sales), [sales]);
  const filtered = useMemo(
    () => (invalid ? [] : all.filter((s) => inRange(s, start, end))),
    [all, start, end, invalid],
  );
  const master = new Map(customers.map((c) => [c.id, c]));
  const customerFor = (s) => master.get(s.customerId) || s._slipCustomer || {};
  const customerTotals = new Map(),
    typeTotals = new Map();
  filtered.forEach((s) => {
    const key = customerKey(s),
      customer = customerFor(s),
      value = saleRevenue(s);
    const old = customerTotals.get(key) || {
      key,
      label: customer.name || s.customerName || "ไม่ระบุ",
      value: 0,
      id: s.customerId,
    };
    customerTotals.set(key, { ...old, value: old.value + value });
    const type = customer.customerType || "ไม่ระบุ";
    typeTotals.set(type, (typeTotals.get(type) || 0) + value);
  });
  const topCustomers = [...customerTotals.values()].sort((a, b) => b.value - a.value).slice(0, 10);
  const types = [...typeTotals]
    .map(([key, value]) => ({ key, label: key, value }))
    .sort((a, b) => b.value - a.value);
  const topProducts = productTotals(filtered, products)
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, 10)
    .map((p) => ({
      key: p.key,
      label: `${p.name}${metric === "quantity" ? ` (${p.unit || "ไม่ระบุหน่วย"})` : ""}`,
      value: p[metric],
    }));
  const monthly = useMemo(
    () => (invalid ? [] : monthlySeries(filtered, all, start, end)),
    [filtered, all, start, end, invalid],
  );
  const atRisk = invalid
    ? []
    : customers
        .map((c) => ({
          ...c,
          stats: customerStats(
            all.filter((s) => s.customerId === c.id),
            new Date(`${end}T23:59:59+07:00`).getTime(),
          ),
        }))
        .filter(
          (c) =>
            c.stats.count &&
            (c.stats.days > 90 || (c.stats.cycle != null && c.stats.days > c.stats.cycle)),
        )
        .sort(
          (a, b) =>
            b.stats.previousRevenue - a.stats.previousRevenue || b.stats.days - a.stats.days,
        );
  const selectedSales = selection
    ? filtered.filter((s) => {
        if (selection.kind === "month") return dateKey(s.createdAt).startsWith(selection.key);
        if (selection.kind === "type")
          return (customerFor(s).customerType || "ไม่ระบุ") === selection.key;
        if (selection.kind === "product")
          return orderLines(s, products).some((p) => p.key === selection.key);
        return customerKey(s) === selection.key;
      })
    : filtered;
  const recent = [...selectedSales].sort((a, b) => b.createdAt - a.createdAt);
  const choose = (value) => {
    setSelection(value);
    setLimit(30);
  };
  const preset = (value) => {
    const oldest = all.reduce(
      (min, s) => (dateKey(s.createdAt) < min ? dateKey(s.createdAt) : min),
      today,
    );
    const ranges = {
      month: [today.slice(0, 7) + "-01", today],
      year: [`${year}-01-01`, today],
      previous: [`${year - 1}-01-01`, `${year - 1}-12-31`],
      all: [oldest, today],
    };
    setStart(ranges[value][0]);
    setEnd(ranges[value][1]);
    choose(null);
  };
  const exportData = (format) => {
    setExportError("");
    try {
      const rows = analysisRows(filtered, customers, products);
      if (!rows.length) {
        setExportError("ไม่มีรายการสินค้าให้ส่งออกในช่วงนี้");
        return;
      }
      exportAnalysis({ rows, start, end, format });
    } catch {
      setExportError("ส่งออกไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  return {
    customers,
    loading,
    error,
    start,
    setStart,
    end,
    setEnd,
    metric,
    setMetric,
    selection,
    exportError,
    limit,
    setLimit,
    invalid,
    filtered,
    customerTotals,
    topCustomers,
    types,
    topProducts,
    monthly,
    atRisk,
    recent,
    choose,
    preset,
    exportData,
  };
}
