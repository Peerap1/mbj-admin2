import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import * as XLSX from "xlsx";
import Reports from "./Reports";
import CustomerDetail from "./CustomerDetail";
import useBusinessData from "../hooks/useBusinessData";

jest.mock("../hooks/useBusinessData");
jest.mock("xlsx", () => ({ ...jest.requireActual("xlsx"), writeFile: jest.fn() }));

let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  const createdAt = Date.now();
  useBusinessData.mockReturnValue({ loading: false, error: "", customers: [{ id: "c1", name: "ร้านทดสอบ", province: "ลำปาง", customerType: "ร้านของฝาก" }], products: [{ id: "p", sku: "SKU01", unit: "ถุง" }],
    sales: [{ id: "o1", customerId: "c1", customerName: "ร้านทดสอบ", createdAt, status: "pending", subtotal: 600, total: 700, shippingCost: 100, boxes: [{ boxQty: 2, items: [{ productId: "p", productName: "ข้าวแต๋น", qty: 3, price: 100 }] }] }] });
  XLSX.writeFile.mockClear();
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

function render(path = "/reports") {
  act(() => root.render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes>
    <Route path="/reports" element={<Reports />} /><Route path="/customers/:id" element={<CustomerDetail />} />
  </Routes></MemoryRouter>));
}
const click = element => act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));

test("report exports selected order at SKU level with multiplied units", () => {
  render();
  expect(container.textContent).toContain("ยอดขายสินค้าไม่รวมค่าส่ง");
  const button = [...container.querySelectorAll("button")].find(b => b.textContent.includes("ส่งออก Excel"));
  click(button);
  const workbook = XLSX.writeFile.mock.calls[0][0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets["Customer Analysis"]);
  expect(rows[0]).toMatchObject({ Quantity: 6, "Net Sales": 600, "Shipping Fee": 100, SKU: "SKU01" });
});

test("clicking a ranked customer opens their profile and order history", () => {
  render();
  const button = [...container.querySelectorAll("button.analysis-bar")].find(b => b.textContent.includes("ร้านทดสอบ"));
  click(button);
  expect(container.textContent).toContain("ยอดซื้อสะสม (บาท)");
  expect(container.textContent).toContain("ประวัติ Order");
  expect(container.querySelector('a[href="/history?order=o1"]')).not.toBeNull();
});

test("reports display read errors instead of misleading empty analytics", () => {
  useBusinessData.mockReturnValue({ loading: true, error: "โหลดข้อมูลไม่สำเร็จ", customers: [], products: [], sales: [] });
  render();
  expect(container.textContent).toBe("โหลดข้อมูลไม่สำเร็จ");
});
