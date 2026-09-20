import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useSalesReport from "../features/reports/useSalesReport";
import ActionIcon from "../components/ActionIcon";
import { Stat, Bars, MonthlyChart, amount } from "../components/AnalysisCharts";
import { formatDate, orderCode, saleRevenue } from "../utils/customerAnalysis";

export default function Reports() {
  const navigate = useNavigate();
  const {
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
  } = useSalesReport();

  if (error) return <p className="analysis-error">{error}</p>;
  if (loading) return <p>กำลังโหลดข้อมูลวิเคราะห์…</p>;
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">วิเคราะห์ลูกค้าและยอดขาย</h2>
          <p className="page-subtitle">
            ยอดขายสินค้าไม่รวมค่าส่ง · รวมรอชำระและชำระแล้ว · ไม่รวมรายการยกเลิก
          </p>
        </div>
      </div>
      <div className="card">
        <div className="analysis-filters">
          <label>
            ตั้งแต่
            <input
              type="date"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                choose(null);
              }}
            />
          </label>
          <label>
            ถึง
            <input
              type="date"
              value={end}
              onChange={(e) => {
                setEnd(e.target.value);
                choose(null);
              }}
            />
          </label>
          <div className="analysis-button-group">
            {[
              ["month", "เดือนนี้"],
              ["year", "ปีนี้"],
              ["previous", "ปีที่แล้ว"],
              ["all", "ทั้งหมด"],
            ].map(([key, label]) => (
              <button className="btn btn-secondary btn-sm" key={key} onClick={() => preset(key)}>
                <ActionIcon name="calendar" size={14} />
                {label}
              </button>
            ))}
          </div>
          <div className="analysis-button-group analysis-export-actions">
            <button
              className="btn btn-primary btn-sm"
              title="Export Customer Analysis เป็น Excel"
              disabled={invalid || !filtered.length}
              onClick={() => exportData("xlsx")}
            >
              <ActionIcon name="download" />
              ส่งออก Excel
            </button>
            <button
              className="btn btn-secondary btn-sm"
              title="Export Customer Analysis เป็น CSV"
              disabled={invalid || !filtered.length}
              onClick={() => exportData("csv")}
            >
              <ActionIcon name="download" />
              ส่งออก CSV
            </button>
          </div>
        </div>
        {invalid && (
          <p className="analysis-error">กรุณาเลือกช่วงวันที่เริ่มต้นไม่เกินวันที่สิ้นสุด</p>
        )}
        {exportError && <p className="analysis-error">{exportError}</p>}
        <p className="analysis-hint">
          Export ตามช่วงวันที่ด้านบน: 1 แถวต่อสินค้าในแต่ละ Order · จำนวนรวมทุกกล่อง ·
          ค่าส่งลงครั้งเดียวต่อ Order
        </p>
      </div>
      <div className="analysis-grid">
        <Stat
          label="ยอดขายสินค้า (บาท)"
          value={amount(filtered.reduce((sum, s) => sum + saleRevenue(s), 0))}
        />
        <Stat label="จำนวน Order" value={filtered.length} />
        <Stat label="ลูกค้าที่ซื้อในช่วงนี้" value={customerTotals.size} />
        <Stat
          label="ยอดขายเฉลี่ยต่อ Order (บาท)"
          value={amount(
            filtered.length
              ? filtered.reduce((sum, s) => sum + saleRevenue(s), 0) / filtered.length
              : 0,
          )}
        />
      </div>
      {customers.some(
        (c) => !c.customerType || !c.province || !c.acquisitionChannel || !c.salesOwner,
      ) && (
        <p className="analysis-hint">
          ลูกค้าบางรายยังไม่มีข้อมูลวิเคราะห์ครบ สามารถเติมได้ที่{" "}
          <Link className="analysis-link" to="/customers">
            ข้อมูลลูกค้า
          </Link>{" "}
          รายงานที่ขาดประเภทจะแสดง “ไม่ระบุ”
        </p>
      )}
      <div className="analysis-panels analysis-monthly-panels">
        <section className="card">
          <h3>ยอดขายรายเดือนเทียบปีก่อน</h3>
          <MonthlyChart
            rows={monthly}
            onSelect={(r) => choose({ kind: "month", key: r.key, label: r.label })}
          />
        </section>
        <section className="card">
          <h3>ลูกค้าใหม่ vs ลูกค้าเดิมรายเดือน</h3>
          <MonthlyChart
            rows={monthly}
            stacked
            onSelect={(r) => choose({ kind: "month", key: r.key, label: r.label })}
          />
          <p className="analysis-hint">
            ลูกค้าใหม่ = ซื้อครั้งแรกในเดือนนั้น โดยตรวจจากประวัติทั้งหมด
            คนเดิมนับเพียงครั้งเดียวต่อเดือน
          </p>
        </section>
      </div>
      <div className="analysis-panels">
        <section className="card">
          <h3>ยอดขายตามประเภทลูกค้า</h3>
          <Bars rows={types} onSelect={(r) => choose({ kind: "type", ...r })} />
        </section>
        <section className="card">
          <h3>Top 10 ลูกค้า</h3>
          <Bars
            rows={topCustomers}
            onSelect={(r) =>
              r.id ? navigate(`/customers/${r.id}`) : choose({ kind: "customer", ...r })
            }
          />
        </section>
      </div>
      <div className="analysis-panels">
        <section className="card">
          <div className="analysis-filters">
            <h3>Top 10 สินค้า</h3>
            <label>
              จัดอันดับตาม
              <select value={metric} onChange={(e) => setMetric(e.target.value)}>
                <option value="net">ยอดขาย</option>
                <option value="quantity">จำนวนขาย</option>
              </select>
            </label>
          </div>
          <Bars
            rows={topProducts}
            unit={metric === "net" ? "บาท" : "หน่วย"}
            onSelect={(r) => choose({ kind: "product", ...r })}
          />
        </section>
        <section className="card">
          <h3>ลูกค้าที่ควรติดตาม</h3>
          <p className="analysis-hint">
            ประเมิน ณ วันที่สิ้นสุดช่วงที่เลือก จากประวัติทั้งหมดก่อนวันนั้น · เกิน 90 วัน
            หรือเกินรอบซื้อเฉลี่ย · เรียงตามยอดซื้อปีก่อน
          </p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ลูกค้า / ผู้ดูแล</th>
                  <th>ซื้อล่าสุด</th>
                  <th>ไม่ซื้อมา (วัน)</th>
                  <th>รอบเฉลี่ย (วัน)</th>
                  <th>สถานะ / เหตุผล</th>
                  <th>ยอดปีก่อน</th>
                </tr>
              </thead>
              <tbody>
                {atRisk.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link className="analysis-link" to={`/customers/${c.id}`}>
                        {c.name}
                      </Link>
                      <br />
                      {c.salesOwner || "ยังไม่มีผู้ดูแล"}
                    </td>
                    <td>{formatDate(c.stats.last)}</td>
                    <td>{c.stats.days}</td>
                    <td>{c.stats.cycle ?? "ข้อมูลไม่พอ"}</td>
                    <td>{c.stats.status === "Active" ? "เลยรอบซื้อปกติ" : c.stats.status}</td>
                    <td>{amount(c.stats.previousRevenue)}</td>
                  </tr>
                ))}
                {!atRisk.length && (
                  <tr>
                    <td colSpan={6}>ไม่มีลูกค้าที่เข้าเกณฑ์</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <section className="card analysis-section">
        <h3>
          {selection ? `รายการขาย: ${selection.label}` : "รายการขายล่าสุด"} ({recent.length})
        </h3>
        {selection && (
          <button className="btn btn-secondary btn-sm" onClick={() => choose(null)}>
            <ActionIcon name="reset" />
            แสดงทั้งหมดในช่วงวันที่
          </button>
        )}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>ลูกค้า</th>
                <th>วันที่</th>
                <th>ยอดสินค้า</th>
                <th>สถานะ</th>
                <th>เอกสาร</th>
              </tr>
            </thead>
            <tbody>
              {recent.slice(0, limit).map((s) => (
                <tr key={s.id}>
                  <td title={orderCode(s)}>{orderCode(s)}</td>
                  <td>
                    {s.customerId ? (
                      <Link className="analysis-link" to={`/customers/${s.customerId}`}>
                        {s.customerName || "ไม่ระบุ"}
                      </Link>
                    ) : (
                      s.customerName || "ไม่เชื่อมลูกค้า"
                    )}
                  </td>
                  <td>{formatDate(s.createdAt)}</td>
                  <td>{amount(saleRevenue(s))}</td>
                  <td>{s.status === "paid" || s.status === "completed" ? "ชำระแล้ว" : "รอชำระ"}</td>
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
              {!recent.length && (
                <tr>
                  <td colSpan={6}>ไม่มีรายการขาย</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {recent.length > limit && (
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
