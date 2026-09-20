import React, { useState, useEffect, useRef } from "react";
export default function CustomerSearch({ customers, value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const selected = customers.find((c) => c.id === value);
  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.phone?.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (c) => {
    onChange(c.id);
    setQuery("");
    setOpen(false);
  };
  const clear = () => {
    onChange("");
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div className={`cs-box ${open ? "open" : ""}`} onClick={() => setOpen(true)}>
        {selected && !open ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
            }}
          >
            <span style={{ fontSize: 14, color: "var(--gray-800)", fontWeight: 500 }}>
              {selected.name}
            </span>
            <button
              type="button"
              className="cs-clear"
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <input
            autoFocus={open}
            type="text"
            placeholder={open ? "ค้นหาชื่อหรือเบอร์โทร..." : "-- เลือกลูกค้า --"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={() => setOpen(true)}
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              padding: "8px 12px",
              background: "transparent",
              fontSize: 14,
            }}
          />
        )}
      </div>
      {open && (
        <div className="cs-dropdown">
          {filtered.length === 0 ? (
            <div style={{ padding: "12px 14px", color: "var(--gray-400)", fontSize: 13 }}>
              ไม่พบลูกค้า
            </div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="cs-option" onClick={() => select(c)}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                {c.phone && <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{c.phone}</div>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
