import React, { useState } from "react";
export default function EmpTable({ employees, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const filtered = employees.filter(
    (e) =>
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="search-bar" style={{ marginBottom: 14 }}>
        <input
          type="text"
          placeholder="🔍 ค้นหาชื่อ, แผนก..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th>ชื่อพนักงาน</th>
              <th>แผนก</th>
              <th>ค่าจ้าง</th>
              <th>หมายเหตุ</th>
              <th style={{ textAlign: "right" }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: 36,
                    color: "var(--gray-400)",
                    maxWidth: "none",
                  }}
                >
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              filtered.map((e, i) => (
                <tr key={e.id}>
                  <td style={{ color: "var(--gray-400)", fontSize: 12, maxWidth: "none" }}>
                    {i + 1}
                  </td>
                  <td title={e.name} style={{ fontWeight: 600 }}>
                    {e.name}
                  </td>
                  <td title={e.department}>{e.department || "-"}</td>
                  <td style={{ maxWidth: "none" }}>
                    {e.employeeType === "monthly" && e.monthlySalary && (
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: "var(--gray-400)", fontSize: 11 }}>เดือนละ </span>
                        <strong style={{ color: "var(--primary)" }}>
                          {Number(e.monthlySalary).toLocaleString()}
                        </strong>
                      </div>
                    )}
                    {e.employeeType === "daily" && (
                      <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                        {e.dailyRate && (
                          <div>
                            <span style={{ color: "var(--gray-400)", fontSize: 11 }}>รายวัน </span>
                            <strong style={{ color: "var(--success)" }}>
                              {Number(e.dailyRate).toLocaleString()}
                              <span
                                style={{ fontWeight: 400, fontSize: 11, color: "var(--gray-400)" }}
                              >
                                /ชม.
                              </span>
                            </strong>
                          </div>
                        )}
                        {e.isPieceWorker && e.pieceRate && (
                          <div>
                            <span style={{ color: "var(--gray-400)", fontSize: 11 }}>กดแผ่น </span>
                            <strong style={{ color: "var(--warning)" }}>
                              {Number(e.pieceRate).toLocaleString()}
                              <span
                                style={{ fontWeight: 400, fontSize: 11, color: "var(--gray-400)" }}
                              >
                                /ชม.
                              </span>
                            </strong>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td title={e.note}>{e.note || "-"}</td>
                  <td style={{ maxWidth: "none" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button
                        className="btn btn-secondary btn-sm btn-icon-only"
                        title="แก้ไข"
                        onClick={() => onEdit(e)}
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        className="btn btn-danger btn-sm btn-icon-only"
                        title="ลบ"
                        onClick={() => onDelete(e)}
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
