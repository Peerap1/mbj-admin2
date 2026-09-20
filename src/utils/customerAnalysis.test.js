import {
  analysisRows,
  customerKey,
  customerStats,
  dateKey,
  inRange,
  monthlySeries,
  orderLines,
  productTotals,
  saleRevenue,
  validSales,
} from "./customerAnalysis";

const timestamp = (date) => new Date(`${date}T12:00:00+07:00`).getTime();
const order = (id, customerId, date, extra = {}) => ({
  id,
  customerId,
  customerName: "ชื่อซ้ำ",
  createdAt: timestamp(date),
  status: "pending",
  total: 100,
  ...extra,
});
const boxed = order("o1", "c1", "2026-09-04", {
  subtotal: 180,
  shippingCost: 150,
  total: 330,
  boxes: [
    {
      boxQty: 2,
      items: [
        { productId: "p1", productName: "คำเดียว", qty: 3, price: 10 },
        { productId: "p2", productName: "งา", qty: 2, price: 20 },
      ],
    },
    { boxQty: 1, items: [{ productId: "p1", productName: "คำเดียว", qty: 2, price: 20 }] },
  ],
});

test("multiplies boxes, merges the same product, and weights differing prices", () => {
  const lines = orderLines(boxed);
  expect(lines).toHaveLength(2);
  expect(lines[0]).toMatchObject({
    quantity: 8,
    cartonQty: 3,
    gross: 100,
    net: 100,
    unitPrice: 12.5,
  });
  expect(lines[1]).toMatchObject({ quantity: 4, cartonQty: 2, net: 80 });
  expect(productTotals([boxed])[0].count).toBe(1);
});

test("does not count the same carton twice for repeated SKU lines in one box", () => {
  const lines = orderLines({
    boxes: [
      {
        boxQty: 5,
        items: [
          { productId: "p", qty: 1, price: 1 },
          { productId: "p", qty: 2, price: 1 },
        ],
      },
    ],
  });
  expect(lines[0]).toMatchObject({ quantity: 15, cartonQty: 5, net: 15 });
});

test("supports legacy items and preserves historical SKU and price snapshots", () => {
  expect(
    orderLines(
      { items: [{ productId: "p", name: "เดิม", sku: "OLD", unit: "ถุง", qty: 4, price: 3 }] },
      [{ id: "p", sku: "NEW", price: 999 }],
    )[0],
  ).toMatchObject({ sku: "OLD", name: "เดิม", unit: "ถุง", quantity: 4, net: 12, cartonQty: 0 });
});

test("exports one line per product with shipping only once and exact order reconciliation", () => {
  const rows = analysisRows(
    [boxed],
    [{ id: "c1", name: "ลูกค้า", province: "ลำปาง", customerType: "ร้านของฝาก" }],
    [{ id: "p1", sku: "SKU01", unit: "ถุง" }],
  );
  expect(rows).toHaveLength(2);
  expect(rows.every((r) => r["Order ID"] === "o1")).toBe(true);
  expect(rows[0]).toMatchObject({
    SKU: "SKU01",
    Quantity: 8,
    Province: "ลำปาง",
    "Customer Type": "ร้านของฝาก",
  });
  expect(rows.reduce((s, r) => s + r["Shipping Fee"], 0)).toBe(150);
  expect(rows.reduce((s, r) => s + r["Net Sales"] + r["Shipping Fee"], 0)).toBe(330);
  expect(rows[0]["Invoice No"]).toBe("");
});

test("does not merge customers who share a name or infer identity for unlinked orders", () => {
  expect(customerKey(order("a", "c1", "2026-01-01"))).not.toBe(
    customerKey(order("b", "c2", "2026-01-01")),
  );
  expect(customerKey({ id: "a" })).not.toBe(customerKey({ id: "b" }));
});

test("uses Thailand dates at UTC day boundaries and inclusive ranges", () => {
  const s = { createdAt: Date.parse("2026-09-03T18:00:00Z") };
  expect(dateKey(s.createdAt)).toBe("2026-09-04");
  expect(inRange(s, "2026-09-04", "2026-09-04")).toBe(true);
  expect(inRange(s, "2026-09-03", "2026-09-03")).toBe(false);
});

test.each([
  [90, "Active"],
  [91, "At Risk"],
  [180, "At Risk"],
  [181, "Lost"],
])("customer status boundary %i days", (days, expected) => {
  const last = timestamp("2026-01-01");
  expect(
    customerStats([{ ...order("a", "c", "2026-01-01"), createdAt: last }], last + days * 86400000)
      .status,
  ).toBe(expected);
});

test("uses purchase days for cycle, excludes cancelled and future orders", () => {
  const orders = [
    order("a", "c", "2026-01-01"),
    order("b", "c", "2026-01-01"),
    order("c", "c", "2026-01-31"),
    order("d", "c", "2026-02-01", { status: "cancelled" }),
    order("e", "c", "2027-01-01"),
  ];
  expect(customerStats(orders, timestamp("2026-03-01"))).toMatchObject({
    count: 3,
    cycle: 30,
    revenue: 300,
    average: 100,
  });
  expect(customerStats([], timestamp("2026-01-01"))).toMatchObject({
    status: "ยังไม่เคยซื้อ",
    cycle: null,
    growth: null,
  });
});

test("new vs returning is distinct customers per month and uses all history", () => {
  const sales = [
    order("a", "c1", "2025-12-01"),
    order("b", "c1", "2026-01-10"),
    order("c", "c2", "2026-01-12"),
    order("d", "c2", "2026-01-20"),
    order("e", "c2", "2026-02-01"),
  ];
  const rows = monthlySeries(
    sales.filter((s) => inRange(s, "2026-01-01", "2026-02-28")),
    sales,
    "2026-01-01",
    "2026-02-28",
  );
  expect(rows[0]).toMatchObject({ value: 300, newCount: 1, returning: 1 });
  expect(rows[1]).toMatchObject({ value: 100, newCount: 0, returning: 1 });
});

test("compares matching partial month days and handles leap years", () => {
  const sales = [
    order("a", "c", "2024-02-29"),
    order("b", "c", "2023-02-28"),
    order("c", "c", "2023-02-01"),
  ];
  expect(
    monthlySeries(
      sales.filter((s) => inRange(s, "2024-02-15", "2024-02-29")),
      sales,
      "2024-02-15",
      "2024-02-29",
    )[0],
  ).toMatchObject({ value: 100, previous: 100 });
});

test("revenue excludes shipping and cancellations, not unpaid orders", () => {
  expect(saleRevenue(boxed)).toBe(180);
  expect(saleRevenue({ total: 330, shippingCost: 150 })).toBe(180);
  expect(validSales([boxed, { ...boxed, status: "cancelled" }])).toHaveLength(1);
});
