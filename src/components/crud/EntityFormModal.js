import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import FormField from "../ui/FormField";

export default function EntityFormModal({
  title,
  mode,
  fields,
  form,
  setForm,
  onClose,
  onSave,
  busy,
}) {
  return (
    <Modal
      title={`${mode === "add" ? "เพิ่ม" : "แก้ไข"}${title}`}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={onSave} busy={busy}>
            บันทึก
          </Button>
        </>
      }
    >
      {fields.map((field) => (
        <FormField
          key={field.key}
          field={field}
          value={form[field.key]}
          mode={mode}
          onChange={(value) => setForm((previous) => ({ ...previous, [field.key]: value }))}
        />
      ))}
    </Modal>
  );
}
