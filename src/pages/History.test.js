import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import History from "./History";
import { getSales, getBanks, updateSale } from "../firebase/database";

jest.mock("../firebase/database", () => ({
  getSales: jest.fn(),
  getBanks: jest.fn(),
  updateSale: jest.fn(),
  deleteSale: jest.fn(),
}));
test("payment modal and status reversal retain existing stored payment fields", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let order = {
      id: "o",
      customerId: "c",
      customerName: "ร้าน",
      total: 200,
      status: "pending",
      createdAt: Date.now(),
    },
    emit;
  getSales.mockImplementation((callback) => {
    emit = callback;
    callback([order]);
    return () => {};
  });
  getBanks.mockImplementation((callback) => {
    callback([]);
    return () => {};
  });
  updateSale.mockImplementation(async (_id, data) => {
    order = { ...order, ...data };
    emit([order]);
  });
  try {
    act(() =>
      root.render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <History />
        </MemoryRouter>,
      ),
    );
    act(() => container.querySelector(".status-toggle.pending").click());
    await act(async () => {
      [...container.querySelectorAll(".modal-footer button")]
        .find((b) => b.textContent.includes("บันทึกการชำระ"))
        .click();
    });
    expect(updateSale).toHaveBeenLastCalledWith("o", {
      status: "paid",
      paidAt: expect.any(Number),
      payment: { method: "cash", bankId: null, bankName: null, note: "" },
    });
    await act(async () => {
      container.querySelector(".status-toggle.paid").click();
    });
    expect(updateSale).toHaveBeenLastCalledWith("o", {
      status: "pending",
      payment: null,
      paidAt: null,
    });
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
