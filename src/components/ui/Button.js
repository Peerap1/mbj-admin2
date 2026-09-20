import React from "react";

export default function Button({
  variant = "primary",
  size,
  busy = false,
  disabled,
  children,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={`btn btn-${variant}${size ? ` btn-${size}` : ""} ${className}`.trim()}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy ? <span className="spinner" style={{ width: 16, height: 16 }} /> : children}
    </button>
  );
}
