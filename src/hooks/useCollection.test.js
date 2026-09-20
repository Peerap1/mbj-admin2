import React, { act } from "react";
import { createRoot } from "react-dom/client";
import useCollection from "./useCollection";

let container, root, latest;
function Probe({ subscribe }) {
  latest = useCollection(subscribe);
  return <span>{latest.error || (latest.loading ? "loading" : latest.data.length)}</span>;
}
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

test("cleans up the old subscription, ignores stale callbacks, and recovers from errors", () => {
  let oldData, newData, fail;
  const stop = jest.fn(),
    stopNew = jest.fn();
  const first = (data) => {
    oldData = data;
    return stop;
  };
  const next = (data, error) => {
    newData = data;
    fail = error;
    return stopNew;
  };
  act(() => root.render(<Probe subscribe={first} />));
  expect(latest.loading).toBe(true);
  act(() => oldData([{ id: "a" }]));
  expect(latest.data).toHaveLength(1);
  act(() => root.render(<Probe subscribe={next} />));
  expect(stop).toHaveBeenCalledTimes(1);
  act(() => oldData([{ id: "stale" }]));
  expect(latest.data).toEqual([]);
  act(() => fail(new Error("denied")));
  expect(latest.loading).toBe(false);
  expect(latest.error).not.toBe("");
  act(() => newData([{ id: "current" }]));
  expect(latest.error).toBe("");
  expect(latest.data[0].id).toBe("current");
});

test("handles synchronously failing subscriptions", () => {
  const subscribe = () => {
    throw new Error("denied");
  };
  act(() => root.render(<Probe subscribe={subscribe} />));
  expect(latest.loading).toBe(false);
  expect(latest.error).not.toBe("");
});
