import { dateKey } from "../../utils/customerAnalysis";

export const saleDateTimestamp = (value) => {
  const timestamp = Date.parse(`${value}T00:00:00+07:00`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") && dateKey(timestamp) === value ? timestamp : NaN;
};

export const calcShippingPerBox = (n) => {
  if (n <= 0) return 0;
  if (n >= 10) return 0;
  if (n >= 5) return n * 100;
  if (n >= 3) return n * 120;
  return n * 150;
};
export const shippingRateLabel = (n) => {
  if (n <= 0) return "";
  if (n >= 10) return `${n} กล่อง → ฟรี!`;
  if (n >= 5) return `${n} × 100 = ${(n * 100).toLocaleString()}`;
  if (n >= 3) return `${n} × 120 = ${(n * 120).toLocaleString()}`;
  return `${n} × 150 = ${(n * 150).toLocaleString()}`;
};

let boxCounter = 1;
export const newBox = () => ({ id: `box_${Date.now()}_${boxCounter++}`, items: [], boxQty: 1 });
let rowCounter = 1;
export const newRow = (product = null) => ({
  rowId: `row_${Date.now()}_${rowCounter++}`,
  productId: product?.id || "",
  productName: product?.name || "",
  sku: product?.sku || "",
  unit: product?.unit || "",
  price: product?.price || "",
  qty: 1,
});

export function calculateSaleTotals(boxes, form) {
  const subtotal = boxes.reduce((sum, b) => {
    const bQty = Number(b.boxQty) || 1;
    const boxTotal = b.items.reduce((s, r) => s + (Number(r.price) || 0) * (Number(r.qty) || 0), 0);
    return sum + boxTotal * bQty;
  }, 0);
  const numBoxes = boxes.reduce((s, b) => s + (Number(b.boxQty) || 1), 0);
  const shippingCost = (() => {
    if (!form.shippingType || form.shippingType === "free") return 0;
    if (form.shippingType === "per_box") return calcShippingPerBox(numBoxes);
    return Number(form.shippingCustom) || 0;
  })();
  const grandTotal = subtotal + shippingCost;

  return { subtotal, numBoxes, shippingCost, grandTotal };
}

export function validateSale({ form, boxes, selectedCustomer }) {
  if (!Number.isFinite(saleDateTimestamp(form.saleDate))) {
    return "กรุณาเลือกวันที่ขายให้ถูกต้อง";
  }
  if (!form.customerId) {
    return "กรุณาเลือกลูกค้า";
  }
  const hasItems = boxes.some((b) => b.items.some((r) => r.productId && Number(r.qty) > 0));
  if (!hasItems) {
    return "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ";
  }
  if (!form.shippingType) {
    return "กรุณาเลือกค่าจัดส่ง";
  }
  if (
    !selectedCustomer ||
    boxes.some(
      (b) =>
        !Number.isInteger(Number(b.boxQty)) ||
        Number(b.boxQty) < 1 ||
        !b.items.length ||
        b.items.some(
          (r) =>
            !r.productId ||
            !Number.isFinite(Number(r.qty)) ||
            Number(r.qty) <= 0 ||
            r.price === "" ||
            !Number.isFinite(Number(r.price)) ||
            Number(r.price) < 0,
        ),
    ) ||
    (form.shippingType === "custom" &&
      (form.shippingCustom === "" ||
        !Number.isFinite(Number(form.shippingCustom)) ||
        Number(form.shippingCustom) < 0))
  ) {
    return "กรุณาตรวจสอบสินค้า ราคา จำนวน กล่อง และค่าส่งให้ครบถ้วนและไม่ติดลบ";
  }

  return "";
}

export function buildSaleData({ form, boxes, selectedCustomer, selectedBank, user }) {
  const { subtotal, numBoxes, shippingCost, grandTotal } = calculateSaleTotals(boxes, form);
  return {
    customerId: form.customerId,
    customerName: selectedCustomer?.name || "",
    customerPhone: selectedCustomer?.phone || "",
    customerAddress: selectedCustomer?.address || "",
    customerProvince: selectedCustomer?.province || "",
    salesOwner: selectedCustomer?.salesOwner || "",
    bankId: form.bankId,
    bankName: selectedBank
      ? `${selectedBank.name} ${selectedBank.accountNo}${selectedBank.accountName ? " · " + selectedBank.accountName : ""}`
      : "",
    boxes: boxes.map((b) => ({ ...b, boxQty: Number(b.boxQty) || 1 })),
    subtotal,
    shippingType: form.shippingType,
    shippingCost,
    numBoxes,
    total: grandTotal,
    note: form.note,
    createdBy: user?.username,
    status: "pending",
    // Existing history, reports and slips use createdAt as the business sale date.
    createdAt: saleDateTimestamp(form.saleDate),
    // snapshot for slip
    _slipCustomer: selectedCustomer ? { ...selectedCustomer } : null,
    _slipBank: selectedBank ? { ...selectedBank } : null,
  };
}
