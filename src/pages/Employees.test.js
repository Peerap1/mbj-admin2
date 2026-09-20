import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import Employees from "./Employees";
import { getEmployees, addEmployee, updateEmployee } from "../firebase/database";

jest.mock("../firebase/database", () => ({
  getEmployees: jest.fn(),
  addEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  deleteEmployee: jest.fn(),
}));

let container, root, records, emit;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  records = [];
  getEmployees.mockImplementation((callback) => {
    emit = callback;
    callback(records);
    return () => {};
  });
  addEmployee.mockImplementation(async (data) => {
    records = [...records, { ...data, id: "new" }];
    emit(records);
  });
  updateEmployee.mockImplementation(async (id, data) => {
    records = records.map((e) => (e.id === id ? { ...e, ...data } : e));
    emit(records);
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const click = (element) =>
  act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const change = (element, value) => act(() => Simulate.change(element, { target: { value } }));
const tab = (label) =>
  [...container.querySelectorAll(".emp-tab")].find((b) => b.textContent.startsWith(label));
const save = async () => {
  await act(async () => {
    [...container.querySelectorAll(".modal-footer button")]
      .find((b) => b.textContent === "บันทึก")
      .click();
  });
};

test.each([
  [false, "รายวัน"],
  [true, "กดแผ่น"],
])(
  "adding from piece tab respects checkbox %s and preserves wage rates",
  async (checked, expectedTab) => {
    act(() => root.render(<Employees />));
    click(tab("กดแผ่น"));
    click(container.querySelector(".page-header button"));
    change(container.querySelector('input[placeholder="กรอกชื่อ-นามสกุล"]'), "ทดสอบ");
    const rates = container.querySelectorAll('.modal input[type="number"]');
    change(rates[0], "50");
    change(rates[1], "80");
    if (!checked) click(container.querySelector('input[type="checkbox"]'));
    await save();
    expect(addEmployee).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeType: "daily",
        isPieceWorker: checked,
        dailyRate: "50",
        pieceRate: "80",
      }),
    );
    expect(container.querySelector(".emp-tab.active").textContent).toContain(expectedTab);
    expect(container.querySelector("tbody").textContent).toContain("ทดสอบ");
  },
);

test("monthly selection from piece tab is saved as monthly without an active piece flag", async () => {
  act(() => root.render(<Employees />));
  click(tab("กดแผ่น"));
  click(container.querySelector(".page-header button"));
  change(container.querySelector('input[placeholder="กรอกชื่อ-นามสกุล"]'), "รายเดือน");
  change(container.querySelector(".modal select"), "monthly");
  change(container.querySelector('.modal input[type="number"]'), "15000");
  await save();
  expect(addEmployee).toHaveBeenCalledWith(
    expect.objectContaining({
      employeeType: "monthly",
      isPieceWorker: false,
      monthlySalary: "15000",
    }),
  );
  expect(container.querySelector(".emp-tab.active").textContent).toContain("รายเดือน");
});

test("editing a piece worker to daily retains payroll rates and moves the employee", async () => {
  records = [
    {
      id: "e1",
      name: "เดิม",
      employeeType: "daily",
      isPieceWorker: true,
      dailyRate: 50,
      pieceRate: 80,
    },
  ];
  act(() => root.render(<Employees />));
  click(tab("กดแผ่น"));
  click(container.querySelector('button[title="แก้ไข"]'));
  click(container.querySelector('input[type="checkbox"]'));
  await save();
  expect(updateEmployee).toHaveBeenCalledWith(
    "e1",
    expect.objectContaining({
      employeeType: "daily",
      isPieceWorker: false,
      dailyRate: 50,
      pieceRate: 80,
    }),
  );
  expect(container.querySelector(".emp-tab.active").textContent).toContain("รายวัน");
});
