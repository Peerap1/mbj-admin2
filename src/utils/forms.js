// Keep table-only fields and Firebase IDs out of form payloads.
export function formValues(form, fields) {
  return Object.fromEntries(
    fields
      .filter((field) => form[field.key] !== undefined)
      .map((field) => [field.key, form[field.key]]),
  );
}

export function requiredFieldError(form, fields) {
  const missing = fields.find((field) => field.required && !form[field.key]);
  return missing ? `กรุณากรอก ${missing.label}` : "";
}
