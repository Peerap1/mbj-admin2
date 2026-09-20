import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Sales from "./Sales";
import { getCustomers, getProducts, getBanks, addSale } from "../firebase/database";

jest.mock("../context/AuthContext", () => ({ useAuth: () => ({ user: { username: "seller" } }) }));
jest.mock("../firebase/database", () => ({
  getCustomers: jest.fn(),
  getProducts: jest.fn(),
  getBanks: jest.fn(),
  addSale: jest.fn(),
}));
let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  getCustomers.mockImplementation((callback) => {
    callback([
      { id: "c", name: "ร้านทดสอบ", province: "ลำปาง", address: "บ้าน", salesOwner: "owner" },
    ]);
    return () => {};
  });
  getProducts.mockImplementation((callback) => {
    callback([{ id: "p", name: "ข้าวแต๋น", sku: "SKU1", unit: "ถุง", price: 50 }]);
    return () => {};
  });
  getBanks.mockImplementation((callback) => {
    callback([]);
    return () => {};
  });
  addSale.mockImplementation(async (data) => ({ ...data, id: "order", orderNo: "SO000001" }));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const click = (element) => act(() => element.click());

test("sale flow keeps customer/product snapshots and opens the saved delivery slip", async () => {
  act(() => root.render(<Sales />));
  click(container.querySelector(".cs-box"));
  click(container.querySelector(".cs-option"));
  click(container.querySelector(".product-list-item"));
  click(container.querySelector('input[value="per_box"]'));
  await act(async () => {
    [...container.querySelectorAll("button")]
      .find((b) => b.textContent.includes("บันทึกการขาย"))
      .click();
  });
  expect(addSale).toHaveBeenCalledWith(
    expect.objectContaining({
      customerId: "c",
      customerProvince: "ลำปาง",
      salesOwner: "owner",
      createdBy: "seller",
      subtotal: 50,
      shippingCost: 150,
      total: 200,
    }),
  );
  expect(addSale.mock.calls[0][0].boxes[0].items[0]).toMatchObject({
    productId: "p",
    sku: "SKU1",
    unit: "ถุง",
  });
  expect(container.querySelector(".modal").textContent).toContain("SO000001");
});
