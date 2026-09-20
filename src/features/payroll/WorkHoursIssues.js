import React from "react";
export default function WorkHoursIssues({ processed }) {
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

  if (allIssues.length === 0)
    return (
      <div className="card" style={{ marginTop: 18, textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
        <div style={{ fontWeight: 600, color: "var(--success)" }}>ข้อมูลถูกต้องทั้งหมด!</div>
        <div style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 4 }}>
          ทุกคนมีบันทึกครบ 4 ครั้งต่อวัน
        </div>
      </div>
    );

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <h3 style={{ fontSize: 15 }}>รายการที่ผิดปกติ ({allIssues.length} รายการ)</h3>
        <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#ef4444",
                borderRadius: 2,
                marginRight: 4,
              }}
            ></span>
            บันทึกไม่ครบ (&lt;4)
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#f59e0b",
                borderRadius: 2,
                marginRight: 4,
              }}
            ></span>
            บันทึกเกิน (&gt;4)
          </span>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ชื่อ-นามสกุล</th>
              <th style={{ width: 110 }}>วันที่</th>
              <th style={{ width: 80 }}>จำนวนบันทึก</th>
              <th style={{ width: 120 }}>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {allIssues.map((row, i) => (
              <tr key={i}>
                <td title={row.name}>{row.name}</td>
                <td style={{ maxWidth: "none" }}>{row.date}</td>
                <td
                  style={{
                    textAlign: "center",
                    maxWidth: "none",
                    fontWeight: 700,
                    color: row.type === "red" ? "#ef4444" : "#d97706",
                  }}
                >
                  {row.count}
                </td>
                <td style={{ maxWidth: "none" }}>
                  <span
                    className={`badge ${row.type === "red" ? "badge-danger" : "badge-warning"}`}
                  >
                    {row.type === "red" ? "ไม่ครบ" : "เกิน"}
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
