import React from "react";
export default function SaleBoxes({
  boxes,
  products,
  updateBoxQty,
  addRowToBox,
  removeBox,
  updateRow,
  removeRow,
}) {
  return (
    <>
      {boxes.map((box, bIdx) => (
        <div key={box.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="box-header-bar">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>📦</span>
              <span>รายการที่ {bIdx + 1}</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>({box.items.length} สินค้า)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  padding: "3px 8px",
                }}
              >
                <span
                  style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap" }}
                >
                  จำนวนกล่อง
                </span>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    fontSize: 16,
                    cursor: "pointer",
                    lineHeight: 1,
                    padding: "0 2px",
                  }}
                  onClick={() => updateBoxQty(box.id, (Number(box.boxQty) || 1) - 1)}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={box.boxQty || 1}
                  onChange={(e) => updateBoxQty(box.id, e.target.value)}
                  style={{
                    width: 36,
                    textAlign: "center",
                    border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.2)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 13,
                    padding: "2px 0",
                  }}
                />
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    fontSize: 16,
                    cursor: "pointer",
                    lineHeight: 1,
                    padding: "0 2px",
                  }}
                  onClick={() => updateBoxQty(box.id, (Number(box.boxQty) || 1) + 1)}
                >
                  +
                </button>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>กล่อง</span>
              </div>
              <button className="btn-icon-sm" onClick={() => addRowToBox(box.id)}>
                + เพิ่มสินค้า
              </button>
              {boxes.length > 1 && (
                <button className="btn-icon-sm danger" onClick={() => removeBox(box.id)}>
                  🗑
                </button>
              )}
            </div>
          </div>
          <div style={{ padding: "12px 14px" }}>
            {box.items.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "14px 0",
                  color: "var(--gray-400)",
                  fontSize: 13,
                }}
              >
                คลิกสินค้าด้านซ้าย หรือกด "+ เพิ่มสินค้า"
              </div>
            ) : (
              <>
                <div className="box-item-header">
                  <div style={{ flex: 1 }}>สินค้า</div>
                  <div style={{ width: 96, textAlign: "center" }}>จำนวน</div>
                  <div style={{ width: 76, textAlign: "right" }}>ราคา/หน่วย</div>
                  <div style={{ width: 76, textAlign: "right" }}>รวม</div>
                  <div style={{ width: 24 }}></div>
                </div>
                {box.items.map((row) => (
                  <div key={row.rowId} className="box-item-row">
                    <div className="row-select">
                      <select
                        className="box-select"
                        value={row.productId}
                        onChange={(e) => updateRow(box.id, row.rowId, "productId", e.target.value)}
                      >
                        <option value="">-- เลือกสินค้า --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="row-qty">
                      <button
                        className="qty-btn"
                        style={{ width: 24, height: 28, fontSize: 13, flexShrink: 0 }}
                        onClick={() =>
                          updateRow(box.id, row.rowId, "qty", Math.max(1, Number(row.qty) - 1))
                        }
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="qty-input"
                        value={row.qty}
                        min="1"
                        onChange={(e) => updateRow(box.id, row.rowId, "qty", e.target.value)}
                      />
                      <button
                        className="qty-btn"
                        style={{ width: 24, height: 28, fontSize: 13, flexShrink: 0 }}
                        onClick={() => updateRow(box.id, row.rowId, "qty", Number(row.qty) + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="row-price">
                      <input
                        type="number"
                        className="price-input"
                        style={{ width: "100%", fontSize: 12, padding: "5px 6px" }}
                        value={row.price}
                        onChange={(e) => updateRow(box.id, row.rowId, "price", e.target.value)}
                      />
                    </div>
                    <div className="row-total">
                      {row.productId
                        ? `${(Number(row.price || 0) * Number(row.qty || 0)).toLocaleString()}`
                        : "–"}
                    </div>
                    <div className="row-del">
                      <button className="cart-remove" onClick={() => removeRow(box.id, row.rowId)}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {box.items.some((r) => r.productId) && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      paddingTop: 7,
                      marginTop: 4,
                      borderTop: "1px dashed var(--gray-200)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--gray-500)",
                    }}
                  >
                    ยอดรายการที่ {bIdx + 1} ={" "}
                    {(
                      box.items.reduce((s, r) => s + Number(r.price || 0) * Number(r.qty || 0), 0) *
                      (Number(box.boxQty) || 1)
                    ).toLocaleString()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
