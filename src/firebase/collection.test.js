import { createCollection } from "./collection";
import { onValue, push, update, remove } from "firebase/database";

jest.mock("./config", () => ({ db: {} }));
jest.mock("firebase/database", () => ({
  ref: (_db, path) => path,
  onValue: jest.fn(),
  push: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
beforeEach(() => jest.clearAllMocks());
test("collection subscription maps IDs, reports empty data, forwards error handling and cleanup", () => {
  const stop = jest.fn(),
    data = jest.fn(),
    error = jest.fn();
  onValue.mockReturnValue(stop);
  expect(createCollection("banks").subscribe(data, error)).toBe(stop);
  expect(onValue.mock.calls[0][2]).toBe(error);
  onValue.mock.calls[0][1]({ val: () => ({ b1: { name: "bank" } }) });
  expect(data).toHaveBeenLastCalledWith([{ id: "b1", name: "bank" }]);
  onValue.mock.calls[0][1]({ val: () => null });
  expect(data).toHaveBeenLastCalledWith([]);
});
test("writes keep existing paths, timestamps and data without persisting UI IDs", () => {
  const collection = createCollection("products");
  collection.add({ name: "สินค้า" });
  expect(push).toHaveBeenCalledWith("products", { name: "สินค้า", createdAt: expect.any(Number) });
  collection.update("p", { id: "p", name: "ใหม่", price: 50 });
  expect(update).toHaveBeenCalledWith("products/p", { name: "ใหม่", price: 50 });
  collection.remove("p");
  expect(remove).toHaveBeenCalledWith("products/p");
});
