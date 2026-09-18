import { buildPrintHTML } from "./SlipContent";

test("printing escapes customer and product HTML while retaining order and province", () => {
  const html = buildPrintHTML({ orderNo: "SO001", customerName: '<img src=x onerror="alert(1)">', customerProvince: "ลำปาง", boxes: [{ boxQty: 2, items: [{ productId: "p", productName: "<script>bad()</script>", qty: 3, price: 10 }] }] }, "<admin>");
  expect(html).not.toContain("<img src=x");
  expect(html).not.toContain("<script>bad()");
  expect(html).toContain("&lt;admin&gt;");
  expect(html).toContain("SO001");
  expect(html).toContain("ลำปาง");
  expect(html).toContain("60</td>");
});

test("printing supports historical flat item orders", () => {
  expect(buildPrintHTML({ items: [{ name: "สินค้าเก่า", qty: 1, price: 10 }] })).toContain("สินค้าเก่า");
});
