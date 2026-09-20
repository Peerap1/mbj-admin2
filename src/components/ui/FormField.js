import React, { useId } from "react";

export default function FormField({ field, value, onChange, mode }) {
  const id = useId();
  const readOnly = mode === "add" && field.readOnlyOnAdd;
  const props = {
    id,
    value: value ?? "",
    placeholder: field.placeholder || "",
    onChange: (event) => onChange(event.target.value),
    "aria-required": field.required || undefined,
  };
  return (
    <div className="form-group">
      <label htmlFor={id}>
        {field.label}
        {field.required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      {readOnly ? (
        <input id={id} type="text" value={value ?? ""} readOnly />
      ) : field.type === "textarea" ? (
        <textarea {...props} rows={3} />
      ) : field.type === "select" ? (
        <select {...props}>
          <option value="">-- เลือก --</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input {...props} type={field.type || "text"} />
      )}
    </div>
  );
}
