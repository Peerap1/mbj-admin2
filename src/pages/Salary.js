// src/pages/Salary.js
import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx"; // npm install xlsx
import { getEmployees } from "../firebase/database";

/* ════════════════════════════════════════════════════════════════
   SHARED HELPERS
   ════════════════════════════════════════════════════════════════ */

function toTH_DateKey(dt) {
  const offsetMs = 7 * 60 * 60 * 1000;
  const local = new Date(dt.getTime() + offsetMs);
  return local.toISOString().slice(0, 10);
}

function parseDateTime(raw) {
  if (!raw) return null;
  if (raw instanceof Date && !isNaN(raw)) return raw;
  const s = String(raw).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const d = new Date(Date.UTC(+m[3], +m[2]-1, +m[1], +m[4]-7, +m[5], +(m[6]||0)));
    if (!isNaN(d)) return d;
  }
  const d2 = new Date(raw);
  return isNaN(d2) ? null : d2;
}

// ─── Safe name matching ─────────────────────────────────────────
// Avoids false positives like "เคอ" matching "ใจเคอ", or "ป้อม" matching "ป้อมน้อย".
// Strategy: 1) exact match  2) normalized exact match (strip spaces/honorifics)
// 3) Levenshtein distance ≤ 1-2 chars relative to name length (typo tolerance only,
//    NOT substring containment — this is what prevents the bugs above).
function normalizeName(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/^(นาย|นาง|นางสาว|น\.ส\.|ด\.ช\.|ด\.ญ\.)/, "");
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

// Find the best matching employee key for `rawName`, or null if no safe match exists.
// `keys` = list of employee names already registered in the system.
function findEmployeeKey(rawName, keys) {
  const target = normalizeName(rawName);
  if (!target) return null;

  // 1) Exact match (after normalization)
  const exact = keys.find((k) => normalizeName(k) === target);
  if (exact) return exact;

  // 2) Typo-tolerant match: only allow small edit distance relative to length,
  //    and require length difference to be small too (rules out "เคอ" vs "ใจเคอ").
  let best = null, bestDist = Infinity;
  keys.forEach((k) => {
    const norm = normalizeName(k);
    const lenDiff = Math.abs(norm.length - target.length);
    if (lenDiff > 2) return; // names of very different length are never a "typo"
    const dist = levenshtein(norm, target);
    const maxAllowed = norm.length <= 4 ? 1 : 2; // stricter tolerance for short names
    if (dist <= maxAllowed && dist < bestDist) {
      best = k;
      bestDist = dist;
    }
  });
  return best;
}

/* ════════════════════════════════════════════════════════════════
   TAB 1: วันทำงาน — read raw scan log, highlight bad rows
   ════════════════════════════════════════════════════════════════ */

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

function buildHighlightWorkbook(originalWb, processed) {
  const outWb = XLSX.utils.book_new();
  originalWb.SheetNames.forEach((sheetName) => {
    const data = processed[sheetName];
    if (!data) return;
    const { rows, highlights } = data;

    const clean = rows.map(({ _dt, _origIdx, ...rest }) => ({
      ...rest,
      สถานะ: highlights[_origIdx] === "FFCCCC" ? "⚠ ไม่ครบ (<4)" :
             highlights[_origIdx] === "FFFF99" ? "⚠ เกิน (>4)" : "✓ ปกติ",
    }));

    const ws = XLSX.utils.json_to_sheet(clean);

    const headers = Object.keys(clean[0] || {});
    const statusColIdx = headers.indexOf("สถานะ");
    if (statusColIdx >= 0) {
      rows.forEach((row, rIdx) => {
        const color = highlights[row._origIdx];
        if (!color) return;
        const cellAddr = XLSX.utils.encode_cell({ r: rIdx + 1, c: statusColIdx });
        if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
        ws[cellAddr].s = {
          font: { color: { rgb: color === "FFCCCC" ? "CC0000" : "AA6600" }, bold: true }
        };
      });
    }

    XLSX.utils.book_append_sheet(outWb, ws, sheetName);
  });
  return outWb;
}

function WorkHoursIssues({ processed }) {
  const allIssues = [];
  Object.entries(processed).forEach(([sheet, data]) => {
    Object.entries(data.groups).forEach(([key, grp]) => {
      const [name, date] = key.split("|||");
      const count = grp.length;
      if (count !== 4) {
        allIssues.push({ sheet, name, date, count, type: count < 4 ? "red" : "yellow" });
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
                <td style={{ textAlign:"center", maxWidth:"none", fontWeight:700, color: row.type==="red" ? "#ef4444" : "#d97706" }}>{row.count}</td>
                <td style={{ maxWidth:"none" }}>
                  <span className={`badge ${row.type==="red"?"badge-danger":"badge-warning"}`}>{row.type==="red" ? "ไม่ครบ" : "เกิน"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TAB 2: คำนวณเงินเดือน — read highlighted file, compute pay
   ════════════════════════════════════════════════════════════════ */

function processPayroll(wb, employeeMap) {
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "", cellDates: true });

  const normalized = rows.map((row) => {
    const obj = {};
    Object.keys(row).forEach((k) => { obj[k.trim()] = row[k]; });
    return obj;
  });

  const parsed = normalized.map((row) => {
    const raw = row["วัน/เวลา"] || row["วัน/เวลา "] || "";
    const dt = parseDateTime(raw);
    const code = String(row["รหัสที่เครื่อง"] ?? row["รหัส"] ?? "").trim();
    const name = String(row["ชื่อ-นามสกุล"] ?? row["ชื่อ"] ?? "").trim();
    return { ...row, _dt: dt, _code: code, _name: name };
  }).filter((r) => r._dt && r._name);

  const dailyGroups = {};
  parsed.forEach((row) => {
    const dateKey = toTH_DateKey(row._dt);
    const key = `${row._code}|||${row._name}|||${dateKey}`;
    if (!dailyGroups[key]) dailyGroups[key] = [];
    dailyGroups[key].push(row);
  });

  const dailyMinutesByPerson = {};
  const pressMinutesByPerson = {};

  const employeeKeys = Object.keys(employeeMap);

  Object.entries(dailyGroups).forEach(([key, group]) => {
    const parts = key.split("|||");
    const name = parts[1];
    const times = group.map((g) => g._dt).sort((a, b) => a - b);

    let dayMinutes = 0;
    for (let i = 1; i < times.length; i += 2) {
      dayMinutes += (times[i] - times[i - 1]) / 60000;
    }
    dailyMinutesByPerson[name] = (dailyMinutesByPerson[name] || 0) + dayMinutes;

    const matchedKey = findEmployeeKey(name, employeeKeys);
    const isPieceWorker = matchedKey ? employeeMap[matchedKey].isPieceWorker : false;
    if (isPieceWorker && times.length >= 2) {
      const first = times[0];
      const bkkMin = ((first.getTime() + 7*3600000) / 60000) % 1440;
      const startWindow = 1;
      const endWindow    = 2*60+50;
      if (bkkMin >= startWindow && bkkMin <= endWindow) {
        const pressMin = (times[1] - times[0]) / 60000;
        pressMinutesByPerson[name] = (pressMinutesByPerson[name] || 0) + pressMin;
      }
    }
  });

  const summary = Object.keys(dailyMinutesByPerson).map((name) => {
    const totalMin  = dailyMinutesByPerson[name] || 0;
    const pressMin  = pressMinutesByPerson[name] || 0;
    const packMin   = Math.max(totalMin - pressMin, 0);

    const empKey = findEmployeeKey(name, employeeKeys);
    const emp = empKey ? employeeMap[empKey] : null;

    const packHours  = packMin / 60;
    const pressHours = pressMin / 60;
    const packRate   = emp?.dailyRate  ? Number(emp.dailyRate)  : 0;
    const pressRate  = emp?.pieceRate ? Number(emp.pieceRate) : 0;

    const packPay  = packHours  * packRate;
    const pressPay = pressHours * pressRate;
    const totalPay = packPay + pressPay;

    return {
      name,
      matched: !!emp,
      isPieceWorker: !!emp?.isPieceWorker,
      packHours:  Math.round(packHours * 100) / 100,
      packRate,
      packPay:    Math.round(packPay * 100) / 100,
      pressHours: Math.round(pressHours * 100) / 100,
      pressRate,
      pressPay:   Math.round(pressPay * 100) / 100,
      totalPay:   Math.round(totalPay * 100) / 100,
      withdraw: 0,
      socialSecurity: 0,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, "th"));

  return summary;
}

function buildPayrollWorkbook(summary) {
  const outWb = XLSX.utils.book_new();

  const headerRow = [
    "ชื่อพนักงาน", "ชั่วโมงห้องแพ็ค", "อัตรา/ชม (แพ็ค)", "รวมเงิน (แพ็ค)",
    "ชั่วโมงกดแผ่น", "อัตรา/ชม (กด)", "รวมเงิน (กด)",
    "รวมจ่ายทั้งหมด", "เบิก", "ประกันสังคม", "จ่ายจริง",
  ];

  const dataRows = summary.map((r) => [
    r.name, r.packHours, r.packRate, r.packPay,
    r.pressHours, r.pressRate, r.pressPay,
    r.totalPay, r.withdraw, r.socialSecurity,
    Math.round(r.totalPay - r.withdraw - r.socialSecurity),
  ]);

  const aoa = [headerRow, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const sumRowIdx = dataRows.length + 1;
  const sumExcelRow = sumRowIdx + 2;
  const sumCell = XLSX.utils.encode_cell({ r: sumRowIdx + 1, c: 7 });
  ws[sumCell] = { t: "n", f: `SUM(H2:H${sumExcelRow - 1})` };

  dataRows.forEach((_, i) => {
    const excelRow = i + 2;
    const cellAddr = XLSX.utils.encode_cell({ r: i + 1, c: 10 });
    ws[cellAddr] = { t: "n", f: `ROUND(H${excelRow}-I${excelRow}-J${excelRow},0)`, z: "#,##0" };
  });

  ws["!cols"] = headerRow.map(() => ({ wch: 15 }));

  XLSX.utils.book_append_sheet(outWb, ws, "คำนวณ");
  return outWb;
}

function PayrollSummary({ summary }) {
  const grandTotal = summary.reduce((s, r) => s + r.totalPay, 0);
  const unmatched = summary.filter((r) => !r.matched);

  return (
    <>
      {unmatched.length > 0 && (
        <div style={{ marginTop:14, background:"var(--warning-light)", color:"#92400e", padding:"10px 16px", borderRadius:9, fontSize:13 }}>
          ⚠ ไม่พบอัตราค่าจ้างของ {unmatched.length} คน: {unmatched.map(u=>u.name).join(", ")} — กรุณาตั้งค่าในเมนู "พนักงาน"
        </div>
      )}

      <div className="card" style={{ marginTop:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <h3 style={{ fontSize:15 }}>สรุปเงินเดือน ({summary.length} คน)</h3>
          <div style={{ fontSize:15, fontWeight:700, color:"var(--primary)" }}>
            รวมทั้งหมด {grandTotal.toLocaleString(undefined,{maximumFractionDigits:0})}
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ชื่อพนักงาน</th>
                <th style={{ width:90, textAlign:"right" }}>ชม.แพ็ค</th>
                <th style={{ width:90, textAlign:"right" }}>อัตรา/ชม</th>
                <th style={{ width:100, textAlign:"right" }}>เงินแพ็ค</th>
                <th style={{ width:90, textAlign:"right" }}>ชม.กดแผ่น</th>
                <th style={{ width:90, textAlign:"right" }}>อัตรา/ชม</th>
                <th style={{ width:100, textAlign:"right" }}>เงินกดแผ่น</th>
                <th style={{ width:110, textAlign:"right" }}>รวมจ่าย</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((r, i) => (
                <tr key={i}>
                  <td title={r.name}>
                    {r.name}
                    {!r.matched && <span className="badge badge-warning" style={{ marginLeft:6, fontSize:10 }}>ไม่พบอัตรา</span>}
                    {r.isPieceWorker && <span className="badge badge-primary" style={{ marginLeft:6, fontSize:10 }}>กดแผ่น</span>}
                  </td>
                  <td style={{ textAlign:"right", maxWidth:"none" }}>{r.packHours}</td>
                  <td style={{ textAlign:"right", maxWidth:"none" }}>{r.packRate || "-"}</td>
                  <td style={{ textAlign:"right", maxWidth:"none" }}>{r.packPay.toLocaleString()}</td>
                  <td style={{ textAlign:"right", maxWidth:"none" }}>{r.pressHours || "-"}</td>
                  <td style={{ textAlign:"right", maxWidth:"none" }}>{r.pressRate || "-"}</td>
                  <td style={{ textAlign:"right", maxWidth:"none" }}>{r.pressPay ? r.pressPay.toLocaleString() : "-"}</td>
                  <td style={{ textAlign:"right", maxWidth:"none", fontWeight:700, color:"var(--primary)" }}>{r.totalPay.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE — two tabs
   ════════════════════════════════════════════════════════════════ */

export default function Salary() {
  const [tab, setTab] = useState("hours");
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const unsub = getEmployees(setEmployees);
    return unsub;
  }, []);

  const employeeMap = {};
  employees.forEach((e) => {
    if (!e.name) return;
    employeeMap[e.name.trim()] = {
      dailyRate: e.dailyRate,
      pieceRate: e.pieceRate,
      isPieceWorker: !!e.isPieceWorker,
    };
  });

  const [processing1, setProcessing1] = useState(false);
  const [processed,   setProcessed]   = useState(null);
  const [fileName1,   setFileName1]   = useState("");
  const [originalWb,  setOriginalWb]  = useState(null);
  const [error1,      setError1]      = useState("");
  const fileRef1 = useRef();

  const [processing2, setProcessing2] = useState(false);
  const [summary,      setSummary]     = useState(null);
  const [fileName2,    setFileName2]   = useState("");
  const [error2,       setError2]      = useState("");
  const fileRef2 = useRef();

  const handleFile1 = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError1(""); setProcessed(null);
    setFileName1(file.name);
    setProcessing1(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type:"array", cellDates:true });
      setOriginalWb(wb);
      setProcessed(processWorkbook(wb));
    } catch(err) {
      setError1(`เกิดข้อผิดพลาด: ${err.message}`);
    }
    setProcessing1(false);
    e.target.value = "";
  };

  const handleDownload1 = () => {
    if (!processed || !originalWb) return;
    const outWb = buildHighlightWorkbook(originalWb, processed);
    const baseName = fileName1.replace(/\.[^.]+$/, "");
    XLSX.writeFile(outWb, `${baseName}_highlight.xlsx`, { cellStyles: true });
  };

  const handleFile2 = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError2(""); setSummary(null);
    setFileName2(file.name);
    setProcessing2(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type:"array", cellDates:true });
      const result = processPayroll(wb, employeeMap);
      setSummary(result);
    } catch(err) {
      setError2(`เกิดข้อผิดพลาด: ${err.message}`);
    }
    setProcessing2(false);
    e.target.value = "";
  };

  const handleDownload2 = () => {
    if (!summary) return;
    const outWb = buildPayrollWorkbook(summary);
    const baseName = fileName2.replace(/\.[^.]+$/, "");
    XLSX.writeFile(outWb, `${baseName}_คำนวณเงินเดือน.xlsx`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">คำนวนเงินเดือน</h2>
          <p className="page-subtitle">ตรวจสอบเวลาทำงานและคำนวณเงินเดือนพนักงาน</p>
        </div>
      </div>

      <div className="emp-tabs">
        <button className={`emp-tab ${tab==="hours" ? "active" : ""}`} style={{ "--tab-color":"var(--primary)" }} onClick={() => setTab("hours")}>
          <span className="emp-tab-label">วันทำงาน</span>
        </button>
        <button className={`emp-tab ${tab==="payroll" ? "active" : ""}`} style={{ "--tab-color":"var(--success)" }} onClick={() => setTab("payroll")}>
          <span className="emp-tab-label">คำนวณเงินเดือน</span>
        </button>
      </div>

      <div className="card" style={{ marginTop:0 }}>

        {tab === "hours" && (
          <>
            <h3 style={{ fontSize:15, marginBottom:16 }}>อัปโหลดไฟล์บันทึกเวลาเข้า-ออก</h3>
            <div className="salary-upload-zone" onClick={() => fileRef1.current.click()}>
              <svg viewBox="0 0 48 48" fill="none" width="40" height="40">
                <rect width="48" height="48" rx="10" fill="var(--primary-50)"/>
                <path d="M24 14v14M17 21l7-7 7 7" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 34h24" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div style={{ fontWeight:600, fontSize:14, marginTop:10 }}>
                {fileName1 || "คลิกเพื่อเลือกไฟล์ .xls หรือ .xlsx"}
              </div>
              <div style={{ fontSize:12, color:"var(--gray-400)", marginTop:4 }}>
                ไฟล์ข้อมูลสแกนนิ้ว / บันทึกเวลา (.xls, .xlsx)
              </div>
              <input ref={fileRef1} type="file" accept=".xls,.xlsx" style={{ display:"none" }} onChange={handleFile1} />
            </div>

            <div style={{ display:"flex", gap:20, marginTop:16, fontSize:13, color:"var(--gray-600)", flexWrap:"wrap" }}>
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

            {processing1 && (
              <div style={{ marginTop:18, textAlign:"center", padding:32 }}>
                <div className="spinner" style={{ width:32, height:32, margin:"0 auto 12px" }}></div>
                <div style={{ fontSize:14, color:"var(--gray-500)" }}>กำลังประมวลผล...</div>
              </div>
            )}
            {error1 && (
              <div style={{ marginTop:14, background:"var(--danger-light)", color:"#dc2626", padding:"12px 16px", borderRadius:9, fontSize:13 }}>{error1}</div>
            )}
            {processed && !processing1 && (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:20, marginBottom:4 }}>
                  <div style={{ fontSize:13, color:"var(--gray-500)" }}>
                    ไฟล์: <strong>{fileName1}</strong> · {Object.keys(processed).length} sheet
                  </div>
                  <button className="btn btn-primary" onClick={handleDownload1}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                    ดาวน์โหลด .xlsx
                  </button>
                </div>
                <WorkHoursIssues processed={processed} />
              </>
            )}
          </>
        )}

        {tab === "payroll" && (
          <>
            <h3 style={{ fontSize:15, marginBottom:16 }}>อัปโหลดไฟล์ที่ผ่านการตรวจสอบแล้ว (วันทำงาน)</h3>
            <div className="salary-upload-zone" onClick={() => fileRef2.current.click()}>
              <svg viewBox="0 0 48 48" fill="none" width="40" height="40">
                <rect width="48" height="48" rx="10" fill="#ecfdf5"/>
                <path d="M24 14v14M17 21l7-7 7 7" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 34h24" stroke="var(--success)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div style={{ fontWeight:600, fontSize:14, marginTop:10 }}>
                {fileName2 || "คลิกเพื่อเลือกไฟล์ .xls หรือ .xlsx"}
              </div>
              <div style={{ fontSize:12, color:"var(--gray-400)", marginTop:4 }}>
                ใช้ไฟล์ที่ผ่านการตรวจสอบจากแท็บ "วันทำงาน" แล้ว
              </div>
              <input ref={fileRef2} type="file" accept=".xls,.xlsx" style={{ display:"none" }} onChange={handleFile2} />
            </div>

            <div style={{ marginTop:14, fontSize:12, color:"var(--gray-400)" }}>
              ระบบจะคำนวณค่าจ้างจากอัตราที่ตั้งไว้ในเมนู "พนักงาน" (รายวัน / กดแผ่น) โดยอัตโนมัติ ไม่บันทึกไฟล์ลงระบบ
            </div>

            {processing2 && (
              <div style={{ marginTop:18, textAlign:"center", padding:32 }}>
                <div className="spinner" style={{ width:32, height:32, margin:"0 auto 12px" }}></div>
                <div style={{ fontSize:14, color:"var(--gray-500)" }}>กำลังคำนวณ...</div>
              </div>
            )}
            {error2 && (
              <div style={{ marginTop:14, background:"var(--danger-light)", color:"#dc2626", padding:"12px 16px", borderRadius:9, fontSize:13 }}>{error2}</div>
            )}
            {summary && !processing2 && (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:20, marginBottom:4 }}>
                  <div style={{ fontSize:13, color:"var(--gray-500)" }}>
                    ไฟล์: <strong>{fileName2}</strong> · {summary.length} คน
                  </div>
                  <button className="btn btn-primary" onClick={handleDownload2}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                    ดาวน์โหลด .xlsx
                  </button>
                </div>
                <PayrollSummary summary={summary} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
