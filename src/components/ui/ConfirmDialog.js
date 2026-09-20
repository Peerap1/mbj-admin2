import React from "react";
import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
  children,
  onClose,
  onConfirm,
  busy,
  title = "ยืนยันการลบ",
  confirmLabel = "ลบ",
  maxWidth = 380,
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      maxWidth={maxWidth}
      bodyStyle={{ textAlign: "center" }}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="danger" onClick={onConfirm} busy={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
      {children}
    </Modal>
  );
}
