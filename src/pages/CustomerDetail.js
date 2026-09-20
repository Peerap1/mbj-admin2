import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useBusinessData from "../hooks/useBusinessData";
import ActionIcon from "../components/ActionIcon";
import { Stat, Bars, MonthlyChart, amount } from "../components/AnalysisCharts";
import {
  customerCode,
  customerStats,
  dateKey,
  formatDate,
  inRange,
  monthlySeries,
  orderCode,
  productTotals,
  saleRevenue,
} from "../utils/customerAnalysis";

export default function CustomerDetail() {
  const { id } = useParams();
  const { customers, products, sales, loading, error } = useBusinessData();
  const [month, setMonth] = useState("");
  const [limit, setLimit] = useState(30);
  const customer = customers.find((c) => c.id === id);
  const ownSales = useMemo(() => sales.filter((s) => s.customerId === id), [sales, id]);
  const stats = useMemo(() => customerStats(ownSales), [ownSales]);
  const today = dateKey(Date.now());
  const startDate = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
  startDate.setUTCMonth(startDate.getUTCMonth() - 11);
  const start = startDate.toISOString().slice(0, 10);
  const series = monthlySeries(
    stats.orders.filter((s) => inRange(s, start, today)),
    stats.orders,
    start,
    today,
  );
  const top = productTotals(stats.orders, products);
  const revenueTop = [...top].sort((a, b) => b.net - a.net).slice(0, 10);
  const frequent = [...top].sort((a, b) => b.count - a.count).slice(0, 3);
  const orders = [...ownSales]
    .filter((s) => !month || dateKey(s.createdAt).startsWith(month))
    .sort((a, b) => b.createdAt - a.createdAt);
  if (error) return <p className="analysis-error">{error}</p>;
  if (loading) return <p>กำลังโหลดข้อมูลลูกค้า…</p>;
  const fallback = ownSales[0]?._slipCustomer;
  const profile = customer || fallback;
  if (!profile && !ownSales.length)
    return (
      <div className="card">
        ไม่พบลูกค้า{" "}
        <Link className="analysis-link" to="/customers">
          กลับหน้าลูกค้า
        </Link>
      </div>
    );
  const c = profile || { id, name: ownSales[0]?.customerName };
  return (
    <div>
      <Link className="btn btn-secondary btn-sm analysis-back" to="/customers">
        <ActionIcon name="back" />
        กลับหน้าลูกค้า
      </Link>
      <div className="page-header">
        <div>
          <h2 className="page-title">{c.name}</h2>
          <p className="page-subtitle">รหัสลูกค้า: {customerCode({ ...c, id })}</p>
        </div>
        <span className="badge badge-primary">{stats.status}</span>
      </div>
      {!customer && (
        <p className="analysis-hint">
          ลูกค้ารายนี้ถูกลบจากข้อมูลปัจจุบัน แสดงข้อมูลจากประวัติการขาย
        </p>
      )}
      <div className="card">
        <div className="analysis-details">
          <span>ประเภท: {c.customerType || "ไม่ระบุ"}</span>
          <span>จังหวัด: {c.province || "ไม่ระบุ"}</span>
          <span>ผู้ดูแล: {c.salesOwner || "ไม่ระบุ"}</span>
          <span>ช่องทาง: {c.acquisitionChannel || "ไม่ระบุ"}</span>
          <span>โทร: {c.phone || "–"}</span>
        </div>
        <p>{c.address}</p>
        <div className="analysis-details">
          <span>ซื้อครั้งแรก: {formatDate(stats.first)}</span>
          <span>ซื้อล่าสุด: {formatDate(stats.last)}</span>
          <span>ไม่ซื้อมา: {stats.days == null ? "–" : `${stats.days} วัน`}</span>
        </div>
      </div>
      <div className="analysis-grid">
        <Stat label="ยอดซื้อสะสม (บาท)" value={amount(stats.revenue)} />
        <Stat label="ยอดซื้อปีนี้ (บาท)" value={amount(stats.yearRevenue)} />
        <Stat label="จำนวน Order" value={stats.count} />
        <Stat label="ยอดเฉลี่ยต่อ Order (บาท)" value={amount(stats.average)} />
        <Stat
          label="ซื้อเฉลี่ยทุก"
          value={stats.cycle == null ? "ข้อมูลไม่พอ" : `${stats.cycle} วัน`}
        />
        <Stat
          label="ยอดปีนี้เทียบยอดทั้งปีก่อน"
          value={
            stats.growth == null
              ? "ไม่มีฐานปีก่อน"
              : `${stats.growth > 0 ? "+" : ""}${stats.growth}%`
          }
        />
      </div>
      <p className="analysis-hint">
        ยอดสินค้าไม่รวมค่าส่งและรายการยกเลิก · Active ≤ 90 วัน / At Risk 91–180 วัน / Lost &gt; 180
        วัน
      </p>
      <section className="card analysis-section">
        <h3>ยอดซื้อย้อนหลัง 12 เดือน</h3>
        <MonthlyChart
          rows={series}
          onSelect={(r) => {
            setMonth(r.key);
            setLimit(30);
          }}
        />
      </section>
      <div className="analysis-panels">
        <section className="card">
          <h3>สินค้าที่สร้างยอดสูงสุด</h3>
          <Bars rows={revenueTop.map((p) => ({ key: p.key, label: p.name, value: p.net }))} />
        </section>
        <section className="card">
          <h3>Top 3 สินค้าที่ซื้อบ่อย</h3>
          <Bars
            rows={frequent.map((p) => ({ key: p.key, label: p.name, value: p.count }))}
            unit="Order"
          />
        </section>
      </div>
      <section className="card analysis-section">
        <h3>
          ประวัติ Order {month && `เดือน ${month}`} ({orders.length})
        </h3>
        {month && (
          <button className="btn btn-secondary btn-sm" onClick={() => setMonth("")}>
            <ActionIcon name="reset" />
            ทุกเดือน
          </button>
        )}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>วันที่</th>
                <th>ยอดสินค้า</th>
                <th>ค่าส่ง</th>
                <th>ยอดรวม</th>
                <th>สถานะ</th>
                <th>เอกสาร</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, limit).map((s) => (
                <tr key={s.id}>
                  <td title={orderCode(s)}>{orderCode(s)}</td>
                  <td>{formatDate(s.createdAt)}</td>
                  <td>{amount(saleRevenue(s))}</td>
                  <td>{amount(s.shippingCost)}</td>
                  <td>{amount(s.total)}</td>
                  <td>
                    {s.status === "cancelled"
                      ? "ยกเลิก"
                      : s.status === "paid" || s.status === "completed"
                        ? "ชำระแล้ว"
                        : "รอชำระ"}
                  </td>
                  <td className="td-action">
                    <Link
                      className="btn btn-secondary btn-sm btn-icon-only"
                      title="เปิดใบส่งของ / ใบเสร็จ"
                      aria-label={`เปิดเอกสาร ${orderCode(s)}`}
                      to={`/history?order=${encodeURIComponent(s.id)}`}
                    >
                      <ActionIcon name="document" size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan={7}>ยังไม่มีรายการ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {orders.length > limit && (
          <button
            className="btn btn-secondary analysis-load-more"
            onClick={() => setLimit(limit + 30)}
          >
            <ActionIcon name="chevron" />
            แสดงเพิ่ม
          </button>
        )}
      </section>
    </div>
  );
}
