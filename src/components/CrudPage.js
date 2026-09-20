import EntityTable from "./crud/EntityTable";
import EntityFormModal from "./crud/EntityFormModal";
import ConfirmDialog from "./ui/ConfirmDialog";
import { formValues, requiredFieldError } from "../utils/forms";
// src/components/CrudPage.js
import React, { useState } from "react";

export default function CrudPage({
  title,
  subtitle,
  items,
  columns,
  fields,
  onAdd,
  onEdit,
  onDelete,
  renderExtra,
  initialValues = {},
}) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | { mode:"add"|"edit", data:{} }
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = items.filter((item) =>
    columns.some((col) =>
      String(item[col.key] || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
  );

  const openAdd = () => {
    setForm({ ...initialValues });
    setModal({ mode: "add" });
  };

  const openEdit = (item) => {
    setForm({ ...item });
    setModal({ mode: "edit", data: item });
  };

  const handleSave = async () => {
    const error = requiredFieldError(form, fields);
    if (error) {
      alert(error);
      return;
    }
    const payload = formValues(form, fields);
    setLoading(true);
    try {
      if (modal.mode === "add") await onAdd(payload);
      else await onEdit(modal.data.id, payload);
      setModal(null);
    } catch (e) {
      alert("เกิดข้อผิดพลาด");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await onDelete(id);
      setDeleteConfirm(null);
    } catch (e) {
      alert("เกิดข้อผิดพลาด");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{title}</h2>
          <p className="page-subtitle">
            {subtitle} • {filtered.length} รายการ
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          เพิ่ม{title}
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input
            type="text"
            placeholder={`🔍 ค้นหา${title}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>

        <EntityTable
          filtered={filtered}
          columns={columns}
          renderExtra={renderExtra}
          openEdit={openEdit}
          setDeleteConfirm={setDeleteConfirm}
        />
      </div>

      {modal && (
        <EntityFormModal
          title={title}
          mode={modal.mode}
          fields={fields}
          form={form}
          setForm={setForm}
          onClose={() => setModal(null)}
          onSave={handleSave}
          busy={loading}
        />
      )}
      {deleteConfirm && (
        <ConfirmDialog
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm.id)}
          busy={loading}
        >
          <p>
            คุณต้องการลบ <strong>{deleteConfirm[columns[0]?.key] || ""}</strong> ใช่ไหม?
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
