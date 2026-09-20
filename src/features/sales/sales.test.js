import { buildSaleData, calculateSaleTotals, calcShippingPerBox, validateSale } from "./sales";
import { slipGroups } from "./slipModel";

const boxes = [
  {
    id: "b",
    boxQty: 3,
    items: [
      { productId: "p", productName: "ข้าวแต๋น", sku: "SKU1", unit: "ถุง", price: "25", qty: "2" },
    ],
  },
];
const customer = { id: "c", name: "ร้านค้า", province: "ลำปาง", salesOwner: "admin" };
const form = {
  customerId: "c",
  bankId: "bank",
  note: "หมายเหตุ",
  shippingType: "per_box",
  shippingCustom: "",
};

test.each([
  [0, 0],
  [1, 150],
  [2, 300],
  [3, 360],
  [4, 480],
  [5, 500],
  [9, 900],
  [10, 0],
  [20, 0],
])("shipping tier %i boxes gives %i", (count, expected) =>
  expect(calcShippingPerBox(count)).toBe(expected),
);
test("totals and print rows use the same boxed amounts", () => {
  expect(calculateSaleTotals(boxes, form)).toEqual({
    subtotal: 150,
    numBoxes: 3,
    shippingCost: 360,
    grandTotal: 510,
  });
  expect(slipGroups(boxes)[0].rows[0].lineTotal).toBe(150);
  expect(
    calculateSaleTotals(boxes, { shippingType: "custom", shippingCustom: "75.50" }).grandTotal,
  ).toBe(225.5);
  expect(calculateSaleTotals(boxes, { shippingType: "free" }).grandTotal).toBe(150);
});
test("order snapshot preserves business fields and does not mutate form data", () => {
  const saved = buildSaleData({
    form,
    boxes,
    selectedCustomer: customer,
    selectedBank: { name: "ธนาคาร", accountNo: "123", accountName: "บัญชี" },
    user: { username: "seller" },
  });
  expect(saved).toMatchObject({
    customerId: "c",
    customerProvince: "ลำปาง",
    salesOwner: "admin",
    total: 510,
    createdBy: "seller",
    status: "pending",
    bankName: "ธนาคาร 123 · บัญชี",
  });
  expect(saved._slipCustomer).toEqual(customer);
  expect(saved._slipCustomer).not.toBe(customer);
  expect(saved.boxes[0].items[0]).toMatchObject({ sku: "SKU1", unit: "ถุง" });
});
test("validation preserves required data, negative price and incomplete-box checks", () => {
  expect(validateSale({ form, boxes, selectedCustomer: customer })).toBe("");
  expect(validateSale({ form: { ...form, customerId: "" }, boxes })).toBe("กรุณาเลือกลูกค้า");
  expect(validateSale({ form, boxes: [], selectedCustomer: customer })).toBe(
    "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ",
  );
  expect(
    validateSale({ form, boxes: [...boxes, { boxQty: 1, items: [] }], selectedCustomer: customer }),
  ).not.toBe("");
  expect(
    validateSale({
      form,
      boxes: [{ ...boxes[0], items: [{ ...boxes[0].items[0], price: -1 }] }],
      selectedCustomer: customer,
    }),
  ).not.toBe("");
});
