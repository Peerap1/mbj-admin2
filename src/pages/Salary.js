import useWorkbookUpload from "../hooks/useWorkbookUpload";
import useCollection from "../hooks/useCollection";
import {
  processWorkbook,
  buildHighlightWorkbook,
  processPayroll,
  buildPayrollWorkbook,
} from "../features/payroll/payroll";
import WorkHoursIssues from "../features/payroll/WorkHoursIssues";
import PayrollSummary from "../features/payroll/PayrollSummary";
// src/pages/Salary.js
import React, { useState, useRef } from "react";
import * as XLSX from "xlsx"; // npm install xlsx
import { getEmployees } from "../firebase/database";

export default function Salary() {
  const [tab, setTab] = useState("hours");
  const {
    data: employees,
    loading: employeesLoading,
    error: employeesError,
  } = useCollection(getEmployees);

  const employeeMap = {};
  employees.forEach((e) => {
    if (!e.name) return;
    employeeMap[e.name.trim()] = {
      dailyRate: e.dailyRate,
      pieceRate: e.pieceRate,
      isPieceWorker: !!e.isPieceWorker,
    };
  });

  const {
    processing: processing1,
    data: processed,
    fileName: fileName1,
    workbook: originalWb,
    error: error1,
    handleFile: handleFile1,
  } = useWorkbookUpload(processWorkbook);
  const {
    processing: processing2,
    data: summary,
    fileName: fileName2,
    error: error2,
    handleFile: handleFile2,
  } = useWorkbookUpload((workbook) => processPayroll(workbook, employeeMap));
  const fileRef1 = useRef(),
    fileRef2 = useRef();
  const handleDownload1 = () => {
    if (!processed || !originalWb) return;
    const outWb = buildHighlightWorkbook(originalWb, processed);
    const baseName = fileName1.replace(/\.[^.]+$/, "");
    XLSX.writeFile(outWb, `${baseName}_highlight.xlsx`, { cellStyles: true });
  };

  const handleDownload2 = () => {
    if (!summary) return;
    const outWb = buildPayrollWorkbook(summary);
    const baseName = fileName2.replace(/\.[^.]+$/, "");
    XLSX.writeFile(outWb, `${baseName}_คำนวณเงินเดือน.xlsx`);
  };

  const dataError = employeesError;
  if (dataError) return <p className="analysis-error">{dataError}</p>;
  if (employeesLoading) return <p>กำลังโหลดข้อมูล…</p>;
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">คำนวนเงินเดือน</h2>
          <p className="page-subtitle">ตรวจสอบเวลาทำงานและคำนวณเงินเดือนพนักงาน</p>
        </div>
      </div>

      <div className="emp-tabs">
        <button
          className={`emp-tab ${tab === "hours" ? "active" : ""}`}
          style={{ "--tab-color": "var(--primary)" }}
          onClick={() => setTab("hours")}
        >
          <span className="emp-tab-label">วันทำงาน</span>
        </button>
        <button
          className={`emp-tab ${tab === "payroll" ? "active" : ""}`}
          style={{ "--tab-color": "var(--success)" }}
          onClick={() => setTab("payroll")}
        >
          <span className="emp-tab-label">คำนวณเงินเดือน</span>
        </button>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        {tab === "hours" && (
          <>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>อัปโหลดไฟล์บันทึกเวลาเข้า-ออก</h3>
            <div className="salary-upload-zone" onClick={() => fileRef1.current.click()}>
              <svg viewBox="0 0 48 48" fill="none" width="40" height="40">
                <rect width="48" height="48" rx="10" fill="var(--primary-50)" />
                <path
                  d="M24 14v14M17 21l7-7 7 7"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 34h24" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 10 }}>
                {fileName1 || "คลิกเพื่อเลือกไฟล์ .xls หรือ .xlsx"}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4 }}>
                ไฟล์ข้อมูลสแกนนิ้ว / บันทึกเวลา (.xls, .xlsx)
              </div>
              <input
                ref={fileRef1}
                type="file"
                accept=".xls,.xlsx"
                style={{ display: "none" }}
                onChange={handleFile1}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: 20,
                marginTop: 16,
                fontSize: 13,
                color: "var(--gray-600)",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    background: "#ef4444",
                    borderRadius: 3,
                    display: "inline-block",
                  }}
                ></span>
                น้อยกว่า 4 ครั้ง/วัน (สีแดง)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    background: "#f59e0b",
                    borderRadius: 3,
                    display: "inline-block",
                  }}
                ></span>
                มากกว่า 4 ครั้ง/วัน (สีเหลือง)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    background: "#10b981",
                    borderRadius: 3,
                    display: "inline-block",
                  }}
                ></span>
                ครบ 4 ครั้ง/วัน (ปกติ)
              </div>
            </div>

            {processing1 && (
              <div style={{ marginTop: 18, textAlign: "center", padding: 32 }}>
                <div
                  className="spinner"
                  style={{ width: 32, height: 32, margin: "0 auto 12px" }}
                ></div>
                <div style={{ fontSize: 14, color: "var(--gray-500)" }}>กำลังประมวลผล...</div>
              </div>
            )}
            {error1 && (
              <div
                style={{
                  marginTop: 14,
                  background: "var(--danger-light)",
                  color: "#dc2626",
                  padding: "12px 16px",
                  borderRadius: 9,
                  fontSize: 13,
                }}
              >
                {error1}
              </div>
            )}
            {processed && !processing1 && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 20,
                    marginBottom: 4,
                  }}
                >
                  <div style={{ fontSize: 13, color: "var(--gray-500)" }}>
                    ไฟล์: <strong>{fileName1}</strong> · {Object.keys(processed).length} sheet
                  </div>
                  <button className="btn btn-primary" onClick={handleDownload1}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
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
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>
              อัปโหลดไฟล์ที่ผ่านการตรวจสอบแล้ว (วันทำงาน)
            </h3>
            <div className="salary-upload-zone" onClick={() => fileRef2.current.click()}>
              <svg viewBox="0 0 48 48" fill="none" width="40" height="40">
                <rect width="48" height="48" rx="10" fill="#ecfdf5" />
                <path
                  d="M24 14v14M17 21l7-7 7 7"
                  stroke="var(--success)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 34h24" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 10 }}>
                {fileName2 || "คลิกเพื่อเลือกไฟล์ .xls หรือ .xlsx"}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4 }}>
                ใช้ไฟล์ที่ผ่านการตรวจสอบจากแท็บ "วันทำงาน" แล้ว
              </div>
              <input
                ref={fileRef2}
                type="file"
                accept=".xls,.xlsx"
                style={{ display: "none" }}
                onChange={handleFile2}
              />
            </div>

            <div style={{ marginTop: 14, fontSize: 12, color: "var(--gray-400)" }}>
              ระบบจะคำนวณค่าจ้างจากอัตราที่ตั้งไว้ในเมนู "พนักงาน" (รายวัน / กดแผ่น) โดยอัตโนมัติ
              ไม่บันทึกไฟล์ลงระบบ
            </div>

            {processing2 && (
              <div style={{ marginTop: 18, textAlign: "center", padding: 32 }}>
                <div
                  className="spinner"
                  style={{ width: 32, height: 32, margin: "0 auto 12px" }}
                ></div>
                <div style={{ fontSize: 14, color: "var(--gray-500)" }}>กำลังคำนวณ...</div>
              </div>
            )}
            {error2 && (
              <div
                style={{
                  marginTop: 14,
                  background: "var(--danger-light)",
                  color: "#dc2626",
                  padding: "12px 16px",
                  borderRadius: 9,
                  fontSize: 13,
                }}
              >
                {error2}
              </div>
            )}
            {summary && !processing2 && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 20,
                    marginBottom: 4,
                  }}
                >
                  <div style={{ fontSize: 13, color: "var(--gray-500)" }}>
                    ไฟล์: <strong>{fileName2}</strong> · {summary.length} คน
                  </div>
                  <button className="btn btn-primary" onClick={handleDownload2}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
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
