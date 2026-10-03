import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import CrudPage from "./CrudPage";
import History from "../pages/History";
import { getSales, getBanks } from "../firebase/database";

jest.mock("../firebase/database", () => ({
  getSales: jest.fn(),
  getBanks: jest.fn(),
  updateSale: jest.fn(),
  deleteSale: jest.fn(),
}));

let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const records = Array.from({ length: 51 }, (_, i) => ({ id: String(i), name: `Item ${i + 1}` }));
const next = () =>
  act(() =>
    [...container.querySelectorAll("button")].find((b) => b.textContent === "ถัดไป").click(),
  );
const search = (value) =>
  act(() => {
    const input = container.querySelector(".search-bar input");
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

test("CRUD paginates 50 rows, searches all records and clamps after removal", () => {
  const render = (items) =>
    act(() =>
      root.render(
        <CrudPage
          title="สินค้า"
          items={items}
          columns={[{ key: "name", label: "ชื่อ" }]}
          fields={[]}
          pageSize={50}
        />,
      ),
    );
  render(records);
  expect(container.querySelectorAll("tbody tr")).toHaveLength(50);
  next();
  expect(container.querySelector("tbody td").textContent).toBe("51");
  search("Item 1");
  expect(container.querySelectorAll("tbody tr")).toHaveLength(11);
  expect(container.textContent).toContain("หน้า 1 / 1");
  search("");
  next();
  render(records.slice(0, 50));
  expect(container.querySelectorAll("tbody tr")).toHaveLength(50);
  expect(container.textContent).toContain("หน้า 1 / 1");
});

test("history sorts before pagination and searches outside the current page", () => {
  getSales.mockImplementation((callback) => {
    callback(records.map((r, i) => ({ ...r, customerName: r.name, createdAt: i + 1, total: 100 })));
    return () => {};
  });
  getBanks.mockImplementation((callback) => {
    callback([]);
    return () => {};
  });
  act(() =>
    root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <History />
      </MemoryRouter>,
    ),
  );
  expect(container.querySelectorAll("tbody tr")).toHaveLength(50);
  expect(container.querySelector("tbody tr").textContent).toContain("Item 51");
  next();
  expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
  expect(container.querySelector("tbody td").textContent).toBe("51");
  search("Item 51");
  expect(container.querySelector("tbody tr").textContent).toContain("Item 51");
  expect(container.textContent).toContain("หน้า 1 / 1");
});
