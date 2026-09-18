import React, { useEffect, useRef, useState } from "react";
import ActionIcon from "./ActionIcon";

export const amount = value => Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });

export function Stat({ label, value }) {
  return <div className="card analysis-stat"><span>{label}</span><strong>{value}</strong></div>;
}

export function Bars({ rows, onSelect, unit = "บาท" }) {
  const max = Math.max(1, ...rows.map(row => row.value));
  if (!rows.length) return <p className="analysis-empty">ไม่มีข้อมูลในช่วงนี้</p>;
  return <div className="analysis-bars">{rows.map((row, index) => <button type="button" key={row.key || index}
    className="analysis-bar" disabled={!onSelect} onClick={() => onSelect?.(row)}>
    <span>{row.label}</span><span className="analysis-track"><span style={{ width: `${Math.max(0, row.value / max * 100)}%` }} /></span>
    <strong>{amount(row.value)} {unit}</strong>
  </button>)}</div>;
}

export function MonthlyChart({ rows, onSelect, stacked = false }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(480);
  const hasRows = rows.length > 0;
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const measured = container.getBoundingClientRect().width;
      if (measured > 0) setWidth(measured);
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [hasRows]);
  if (!rows.length) return <p className="analysis-empty">ไม่มีข้อมูลในช่วงนี้</p>;
  const height = 240;
  const max = Math.max(1, ...rows.map(r => stacked ? r.newCount + r.returning : Math.max(r.value, r.previous)));
  const plotWidth = Math.max(1, width - 90);
  const x = i => rows.length === 1 ? 60 + plotWidth / 2 : 60 + i * plotWidth / (rows.length - 1);
  const barWidth = Math.min(24, plotWidth / Math.max(1, rows.length) * 0.65);
  const labelStep = Math.max(1, Math.ceil(rows.length / Math.max(1, Math.floor(plotWidth / 65))));
  const axisAmount = value => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  const y = value => height - 35 - value / max * (height - 65);
  const line = key => rows.map((row, i) => `${x(i)},${y(row[key])}`).join(" ");
  return <>
    <div className="analysis-chart-legend"><span><i />{stacked ? "ลูกค้าใหม่" : "ช่วงที่เลือก"}</span><span><i className="previous" />{stacked ? "ลูกค้าเดิม" : "ช่วงเดียวกันปีก่อน"}</span></div>
    <div className="analysis-chart-scroll" ref={containerRef}><svg viewBox={`0 0 ${width} ${height}`} height={height} role="img" aria-label={stacked ? "กราฟลูกค้าใหม่และลูกค้าเดิม" : "กราฟยอดขายรายเดือนเทียบปีก่อน"}>
      {[...new Set([0, stacked ? Math.ceil(max / 2) : max / 2, max])].map(value => <g key={value}><line x1="55" x2={width - 15} y1={y(value)} y2={y(value)} stroke="#e2e8f0" /><text x="48" y={y(value) - 4} textAnchor="end">{axisAmount(value)}<title>{amount(value)} {stacked ? "คน" : "บาท"}</title></text></g>)}
      {!stacked && <><polyline points={line("previous")} fill="none" stroke="#10b981" strokeWidth="2" /><polyline points={line("value")} fill="none" stroke="#1a56db" strokeWidth="3" /></>}
      {rows.map((r, i) => <g key={r.key} role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined}
        aria-label={`ดูรายการเดือน ${r.label}`} style={{ cursor: onSelect ? "pointer" : "default" }}
        onClick={() => onSelect?.(r)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect?.(r); } }}>
        {stacked ? <>
          <rect x={x(i) - barWidth / 2} y={y(r.newCount)} width={barWidth} height={y(0) - y(r.newCount)} fill="#1a56db"><title>{r.label}: ใหม่ {r.newCount}</title></rect>
          <rect x={x(i) - barWidth / 2} y={y(r.newCount + r.returning)} width={barWidth} height={y(0) - y(r.returning)} fill="#10b981"><title>{r.label}: เดิม {r.returning}</title></rect>
        </> : <><circle cx={x(i)} cy={y(r.value)} r="4" fill="#1a56db"><title>{amount(r.value)} บาท</title></circle><circle cx={x(i)} cy={y(r.previous)} r="3" fill="#10b981"><title>ปีก่อน {amount(r.previous)} บาท</title></circle></>}
        {i % labelStep === 0 && <text x={x(i)} y={height - 10} textAnchor="middle">{r.label}</text>}
      </g>)}
    </svg></div>
    <details className="analysis-monthly-details"><summary><ActionIcon name="document" />ดูตัวเลขรายเดือน<ActionIcon name="chevron" className="analysis-summary-chevron" /></summary><div className="table-wrapper"><table><thead><tr><th>เดือน</th><th>{stacked ? "ใหม่" : "ยอดขาย"}</th><th>{stacked ? "เดิม" : "ปีก่อน"}</th></tr></thead><tbody>
      {rows.map(r => <tr key={r.key}><td><button className="analysis-link" onClick={() => onSelect?.(r)} disabled={!onSelect}>{r.label}</button></td><td>{amount(stacked ? r.newCount : r.value)}</td><td>{amount(stacked ? r.returning : r.previous)}</td></tr>)}
    </tbody></table></div></details>
  </>;
}
