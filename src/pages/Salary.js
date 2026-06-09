// src/pages/Salary.js
import React, { useState, useRef } from "react";

import * as XLSX from "xlsx"; // npm install xlsx

// ─── Logic: same as Python code, converted to JS ──────────────────
// ─── UTC+7 date key ────────────────────────────────────────────────
function toTH_DateKey(dt) {
  // Convert to UTC+7 and return YYYY-MM-DD
  const offsetMs = 7 * 60 * 60 * 1000;
  const local = new Date(dt.getTime() + offsetMs);
  return local.toISOString().slice(0, 10);
}

function parseDateTime(raw) {
  if (!raw) return null;
  // Already a Date object (from XLSX cellDates:true)
  if (raw instanceof Date && !isNaN(raw)) return raw;
  const s = String(raw).trim();
  // dd/mm/yyyy hh:mm:ss or dd/mm/yyyy hh:mm
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    // Treat as local Bangkok time (UTC+7) → convert to UTC for storage
    const d = new Date(Date.UTC(+m[3], +m[2]-1, +m[1], +m[4]-7, +m[5], +(m[6]||0)));
    if (!isNaN(d)) return d;
  }
  // ISO or any standard format
  const d2 = new Date(raw);
  return isNaN(d2) ? null : d2;
}

function processWorkbook(wb) {
  const results = {};
  wb.SheetNames.forEach((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "", cellDates: true });

    const normalized = rows.map((row, idx) => {
      const obj = { _origIdx: idx };
      Object.keys(row).forEach((k) => { obj[k.trim()] = row[k]; });
      return obj;
    });

    const parsed = normalized.map((row) => {
      const raw = row["วัน/เวลา"] || row["วัน/เวลา "] || "";
      const dt = parseDateTime(raw);
      return { ...row, _dt: dt };
    });

    const groups = {};
    parsed.forEach((row) => {
      if (!row._dt) return;
      const name = (row["ชื่อ-นามสกุล"] || row["ชื่อ"] || "").trim();
      const dateKey = toTH_DateKey(row._dt);
      const key = `${name}|||${dateKey}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    // highlights: rowIdx (0-based) → color string or null
    const highlights = {};
    Object.values(groups).forEach((grp) => {
      const count = grp.length;
      const color = count < 4 ? "FFCCCC" : count > 4 ? "FFFF99" : null;
      grp.forEach((r) => { if (color) highlights[r._origIdx] = color; });
    });

    results[sheetName] = { rows: parsed, highlights, groups };
  });
  return results;
}

// ─── Build output workbook — use SheetJS to apply cell background colors ──
function buildOutputWorkbook(originalWb, processed) {
  const outWb = XLSX.utils.book_new();

  originalWb.SheetNames.forEach((sheetName) => {
    const data = processed[sheetName];
    if (!data) return;
    const { rows, highlights } = data;

    // Add status column with text (no fill colors)
    const clean = rows.map(({ _dt, _origIdx, ...rest }) => ({
      ...rest,
      สถานะ: highlights[_origIdx] === "FFCCCC" ? "⚠ ไม่ครบ (<4)" :
             highlights[_origIdx] === "FFFF99" ? "⚠ เกิน (>4)" : "✓ ปกติ",
    }));

    const ws = XLSX.utils.json_to_sheet(clean);

    // Color status column text only (red/yellow font, no fill)
    const headers = Object.keys(clean[0] || {});
    const statusColIdx = headers.indexOf("สถานะ");
    if (statusColIdx >= 0) {
      rows.forEach((row, rIdx) => {
        const color = highlights[row._origIdx];
        if (!color) return;
        const cellAddr = XLSX.utils.encode_cell({ r: rIdx + 1, c: statusColIdx });
        if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
        ws[cellAddr].s = {
          font: {
            color: { rgb: color === "FFCCCC" ? "CC0000" : "AA6600" },
            bold: true,
          }
        };
      });
    }

    XLSX.utils.book_append_sheet(outWb, ws, sheetName);
  });
  return outWb;
}

// ─── Summary table component ────────────────────────────────────────
function SummaryTable({ processed }) {
  const allIssues = [];
  Object.entries(processed).forEach(([sheet, data]) => {
    Object.entries(data.groups).forEach(([key, grp]) => {
      const [name, date] = key.split("|||");
      const count = grp.length;
      if (count !== 4) {
        allIssues.push({ sheet, name, date, count,
          type: count < 4 ? "red" : "yellow" });
      }
    });
  });

  if (allIssues.length === 0) return (
    <div className="card" style={{ marginTop:18, textAlign:"center", padding:32 }}>
      <div style={{ fontSize:36, marginBottom:10 }}>✅</div>
      <div style={{ fontWeight:600, color:"var(--success)" }}>ข้อมูลถูกต้องทั้งหมด!</div>
      <div style={{ fontSize:13, color:"var(--gray-400)", marginTop:4 }}>ทุกคนมีบันทึกครบ 4 ครั้งต่อวัน</div>
    </div>
  );

  return (
    <div className="card" style={{ marginTop:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <h3 style={{ fontSize:15 }}>รายการที่ผิดปกติ ({allIssues.length} รายการ)</h3>
        <div style={{ display:"flex", gap:12, fontSize:12 }}>
          <span><span style={{ display:"inline-block", width:12, height:12, background:"#ef4444", borderRadius:2, marginRight:4 }}></span>บันทึกไม่ครบ (&lt;4)</span>
          <span><span style={{ display:"inline-block", width:12, height:12, background:"#f59e0b", borderRadius:2, marginRight:4 }}></span>บันทึกเกิน (&gt;4)</span>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ชื่อ-นามสกุล</th>
              <th style={{ width:110 }}>วันที่</th>
              <th style={{ width:80 }}>จำนวนบันทึก</th>
              <th style={{ width:120 }}>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {allIssues.map((row, i) => (
              <tr key={i}>
                <td title={row.name}>{row.name}</td>
                <td style={{ maxWidth:"none" }}>{row.date}</td>
                <td style={{ textAlign:"center", maxWidth:"none", fontWeight:700,
                  color: row.type==="red" ? "#ef4444" : "#d97706" }}>
                  {row.count}
                </td>
                <td style={{ maxWidth:"none" }}>
                  <span className={`badge ${row.type==="red"?"badge-danger":"badge-warning"}`}>
                    {row.type==="red" ? "ไม่ครบ" : "เกิน"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────
export default function Salary() {
  const [processing, setProcessing] = useState(false);
  const [processed,  setProcessed]  = useState(null);
  const [fileName,   setFileName]   = useState("");
  const [originalWb, setOriginalWb] = useState(null);
  const [error,      setError]      = useState("");
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(""); setProcessed(null);
    setFileName(file.name);
    setProcessing(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type:"array", cellDates:true });
      setOriginalWb(wb);
      const result = processWorkbook(wb);
      setProcessed(result);
    } catch(e) {
      setError(`เกิดข้อผิดพลาด: ${e.message}`);
    }
    setProcessing(false);
    e.target.value = "";
  };

  const handleDownload = () => {
    if (!processed || !originalWb) return;
    const outWb = buildOutputWorkbook(originalWb, processed);
    const baseName = fileName.replace(/\.[^.]+$/, "");
    XLSX.writeFile(outWb, `${baseName}_highlight.xlsx`, { bookSST: false, cellStyles: true });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">คำนวนเงินเดือน</h2>
          <p className="page-subtitle">ตรวจสอบข้อมูลการสแกนเข้า-ออกงาน</p>
        </div>
      </div>

      {/* Upload card */}
      <div className="card">
        <h3 style={{ fontSize:15, marginBottom:16 }}>วันทำงาน — อัปโหลดไฟล์</h3>

        <div className="salary-upload-zone" onClick={() => fileRef.current.click()}>
          <svg viewBox="0 0 48 48" fill="none" width="40" height="40">
            <rect width="48" height="48" rx="10" fill="var(--primary-50)"/>
            <path d="M24 14v14M17 21l7-7 7 7" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 34h24" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div style={{ fontWeight:600, fontSize:14, marginTop:10 }}>
            {fileName || "คลิกเพื่อเลือกไฟล์ .xls หรือ .xlsx"}
          </div>
          <div style={{ fontSize:12, color:"var(--gray-400)", marginTop:4 }}>
            รองรับไฟล์ Excel (.xls, .xlsx) เท่านั้น
          </div>
          <input ref={fileRef} type="file" accept=".xls,.xlsx" style={{ display:"none" }} onChange={handleFile} />
        </div>

        {/* Legend */}
        <div style={{ display:"flex", gap:20, marginTop:16, fontSize:13, color:"var(--gray-600)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:14, height:14, background:"#ef4444", borderRadius:3, display:"inline-block" }}></span>
            น้อยกว่า 4 ครั้ง/วัน (สีแดง)
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:14, height:14, background:"#f59e0b", borderRadius:3, display:"inline-block" }}></span>
            มากกว่า 4 ครั้ง/วัน (สีเหลือง)
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:14, height:14, background:"#10b981", borderRadius:3, display:"inline-block" }}></span>
            ครบ 4 ครั้ง/วัน (ปกติ)
          </div>
        </div>
      </div>

      {/* Processing */}
      {processing && (
        <div className="card" style={{ marginTop:18, textAlign:"center", padding:32 }}>
          <div className="spinner" style={{ width:32, height:32, margin:"0 auto 12px" }}></div>
          <div style={{ fontSize:14, color:"var(--gray-500)" }}>กำลังประมวลผล...</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginTop:14, background:"var(--danger-light)", color:"#dc2626", padding:"12px 16px", borderRadius:9, fontSize:13 }}>
          {error}
        </div>
      )}

      {/* Results */}
      {processed && !processing && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:20, marginBottom:4 }}>
            <div style={{ fontSize:13, color:"var(--gray-500)" }}>
              ไฟล์: <strong>{fileName}</strong> · {Object.keys(processed).length} sheet
            </div>
            <button className="btn btn-primary" onClick={handleDownload}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              ดาวน์โหลด .xlsx
            </button>
          </div>
          <SummaryTable processed={processed} />
        </>
      )}
    </div>
  );
}
