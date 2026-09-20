import React, { useId } from "react";

export default function Modal({
  title,
  onClose,
  children,
  actions,
  headerActions,
  maxWidth,
  bodyStyle,
}) {
  const titleId = useId();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={maxWidth ? { maxWidth } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id={titleId}>{title}</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {headerActions}
            {onClose && (
              <button
                type="button"
                className="btn-icon btn-secondary"
                onClick={onClose}
                aria-label="ปิด"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="modal-body" style={bodyStyle}>
          {children}
        </div>
        {actions && <div className="modal-footer">{actions}</div>}
      </div>
    </div>
  );
}
