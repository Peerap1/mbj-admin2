import React from "react";
export default function EntityTable({
  filtered,
  columns,
  renderExtra,
  openEdit,
  setDeleteConfirm,
}) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            {renderExtra && <th>ข้อมูลเพิ่มเติม</th>}
            <th style={{ textAlign: "right" }}>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 3}
                style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}
              >
                ไม่พบข้อมูล
              </td>
            </tr>
          ) : (
            filtered.map((item, i) => (
              <tr key={item.id}>
                <td
                  className="td-num"
                  style={{ color: "var(--gray-400)", fontSize: 12, maxWidth: "none" }}
                >
                  {i + 1}
                </td>
                {columns.map((c) => {
                  const raw = item[c.key];
                  const isRendered = !!c.render;
                  const textVal = !isRendered && raw ? String(raw) : null;
                  return (
                    <td
                      key={c.key}
                      className={isRendered ? "td-badge" : ""}
                      title={textVal && textVal.length > 20 ? textVal : undefined}
                      style={isRendered ? { maxWidth: "none", overflow: "visible" } : {}}
                    >
                      {isRendered ? c.render(raw, item) : raw || "-"}
                    </td>
                  );
                })}
                {renderExtra && (
                  <td className="td-badge" style={{ maxWidth: "none" }}>
                    {renderExtra(item)}
                  </td>
                )}
                <td className="td-action" style={{ maxWidth: "none" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button
                      className="btn btn-secondary btn-sm btn-icon-only"
                      title="แก้ไข"
                      onClick={() => openEdit(item)}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      className="btn btn-danger btn-sm btn-icon-only"
                      title="ลบ"
                      onClick={() => setDeleteConfirm(item)}
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
  );
}
