import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import * as XLSX from "xlsx";
import Salary from "./Salary";
import { getEmployees } from "../firebase/database";

jest.mock("../firebase/database", () => ({ getEmployees: jest.fn() }));
jest.mock("xlsx", () => ({ ...jest.requireActual("xlsx"), writeFile: jest.fn() }));

test("payroll file upload computes existing employee rates and exports the same result", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  getEmployees.mockImplementation((callback) => {
    callback([{ id: "e", name: "สมชาย", dailyRate: 50, isPieceWorker: false }]);
    return () => {};
  });
  try {
    act(() => root.render(<Salary />));
    act(() =>
      [...container.querySelectorAll(".emp-tab")]
        .find((b) => b.textContent.includes("คำนวณเงินเดือน"))
        .click(),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        ["08:00", "12:00", "13:00", "17:00"].map((time) => ({
          ชื่อ: "สมชาย",
          "วัน/เวลา": `01/09/2026 ${time}`,
        })),
      ),
      "เวลา",
    );
    const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    await act(async () => {
      Simulate.change(container.querySelector('input[type="file"]'), {
        target: {
          files: [{ name: "เวลา.xlsx", arrayBuffer: async () => bytes }],
          value: "เวลา.xlsx",
        },
      });
    });
    expect(container.querySelector("tbody").textContent).toContain("สมชาย");
    expect(container.querySelector("tbody").textContent).toContain("400");
    act(() =>
      [...container.querySelectorAll("button")]
        .find((b) => b.textContent.includes("ดาวน์โหลด"))
        .click(),
    );
    expect(XLSX.writeFile.mock.calls[0][0].Sheets["คำนวณ"].H2.v).toBe(400);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
