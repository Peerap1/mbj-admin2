import React from "react";
export default function PayrollSummary({ summary }) {
  const grandTotal = summary.reduce((s, r) => s + r.totalPay, 0);
  const unmatched = summary.filter((r) => !r.matched);

  return (
    <>
      {unmatched.length > 0 && (
        <div
          style={{
            marginTop: 14,
            background: "var(--warning-light)",
            color: "#92400e",
            padding: "10px 16px",
            borderRadius: 9,
            fontSize: 13,
          }}
        >
          ⚠ ไม่พบอัตราค่าจ้างของ {unmatched.length} คน: {unmatched.map((u) => u.name).join(", ")} —
          กรุณาตั้งค่าในเมนู "พนักงาน"
        </div>
      )}

      <div className="card" style={{ marginTop: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h3 style={{ fontSize: 15 }}>สรุปเงินเดือน ({summary.length} คน)</h3>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--primary)" }}>
            รวมทั้งหมด {grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ชื่อพนักงาน</th>
                <th style={{ width: 90, textAlign: "right" }}>ชม.แพ็ค</th>
                <th style={{ width: 90, textAlign: "right" }}>อัตรา/ชม</th>
                <th style={{ width: 100, textAlign: "right" }}>เงินแพ็ค</th>
                <th style={{ width: 90, textAlign: "right" }}>ชม.กดแผ่น</th>
                <th style={{ width: 90, textAlign: "right" }}>อัตรา/ชม</th>
                <th style={{ width: 100, textAlign: "right" }}>เงินกดแผ่น</th>
                <th style={{ width: 110, textAlign: "right" }}>รวมจ่าย</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((r, i) => (
                <tr key={i}>
                  <td title={r.name}>
                    {r.name}
                    {!r.matched && (
                      <span className="badge badge-warning" style={{ marginLeft: 6, fontSize: 10 }}>
                        ไม่พบอัตรา
                      </span>
                    )}
                    {r.isPieceWorker && (
                      <span className="badge badge-primary" style={{ marginLeft: 6, fontSize: 10 }}>
                        กดแผ่น
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "right", maxWidth: "none" }}>{r.packHours}</td>
                  <td style={{ textAlign: "right", maxWidth: "none" }}>{r.packRate || "-"}</td>
                  <td style={{ textAlign: "right", maxWidth: "none" }}>
                    {r.packPay.toLocaleString()}
                  </td>
                  <td style={{ textAlign: "right", maxWidth: "none" }}>{r.pressHours || "-"}</td>
                  <td style={{ textAlign: "right", maxWidth: "none" }}>{r.pressRate || "-"}</td>
                  <td style={{ textAlign: "right", maxWidth: "none" }}>
                    {r.pressPay ? r.pressPay.toLocaleString() : "-"}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      maxWidth: "none",
                      fontWeight: 700,
                      color: "var(--primary)",
                    }}
                  >
                    {r.totalPay.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
