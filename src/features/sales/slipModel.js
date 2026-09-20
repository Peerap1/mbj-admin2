export function slipBoxes(sale) {
  return sale.boxes
    ? Object.values(sale.boxes)
    : [
        {
          boxQty: 1,
          items: Object.values(sale.items || {}).map((item, index) => ({
            ...item,
            productId: item.productId || `legacy-${index}`,
            productName: item.productName || item.name || "",
          })),
        },
      ];
}

// Shared by the screen preview and the compact printable document.
export function slipGroups(boxes) {
  return (boxes || []).map((box, bIdx) => {
    const bQty = Number(box.boxQty) || 1;
    return {
      bIdx,
      bQty,
      rows: (box.items || [])
        .filter((row) => row.productId)
        .map((row) => ({
          ...row,
          lineTotal: Number(row.price || 0) * Number(row.qty || 0) * bQty,
        })),
    };
  });
}

export const slipBoxCount = (boxes) =>
  (boxes || []).reduce((sum, box) => sum + (Number(box.boxQty) || 1), 0);

export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );

export const escapePrintData = (value) =>
  typeof value === "string"
    ? escapeHTML(value)
    : Array.isArray(value)
      ? value.map(escapePrintData)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, escapePrintData(item)]),
          )
        : value;

export const SELLER = {
  name: "ข้าวแต๋นน้ำแตงโมแม่บัวจันทร์",
  address: "5 หมู่ 2 ตำบลบ้านเป้า อำเภอเมือง จังหวัดลำปาง 52100",
  phone: "099-916-6264",
};
