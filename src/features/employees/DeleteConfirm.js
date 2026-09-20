import React, { useState } from "react";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
export default function DeleteConfirm({ emp, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(emp.id);
      onClose();
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
    setLoading(false);
  };
  return (
    <ConfirmDialog onClose={onClose} onConfirm={handleConfirm} busy={loading} maxWidth={360}>
      <p>
        ต้องการลบ <strong>{emp.name}</strong>?
      </p>
    </ConfirmDialog>
  );
}
