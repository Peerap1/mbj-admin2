import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import CrudPage from "../CrudPage";

let container, root;
const fields = [
  { key: "name", label: "ชื่อ", required: true },
  {
    key: "salesOwner",
    label: "ผู้ดูแล",
    readOnlyOnAdd: true,
    type: "select",
    options: [{ value: "owner", label: "owner" }],
  },
];
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
const click = (element) => act(() => element.click());
const save = async () => {
  await act(async () => {
    [...container.querySelectorAll(".modal-footer button")]
      .find((b) => b.textContent === "บันทึก")
      .click();
  });
};

test("new form retains the logged-in owner default and passes only field values", async () => {
  const onAdd = jest.fn().mockResolvedValue(undefined);
  act(() =>
    root.render(
      <CrudPage
        title="ลูกค้า"
        items={[]}
        columns={[{ key: "name", label: "ชื่อ" }]}
        fields={fields}
        initialValues={{ salesOwner: "owner" }}
        onAdd={onAdd}
      />,
    ),
  );
  click(container.querySelector(".page-header button"));
  expect(container.querySelector("input[readonly]").value).toBe("owner");
  const name = container.querySelector(".modal input:not([readonly])");
  act(() => Simulate.change(name, { target: { value: "ร้าน" } }));
  await save();
  expect(onAdd).toHaveBeenCalledWith({ name: "ร้าน", salesOwner: "owner" });
  expect(container.querySelector(".modal")).toBeNull();
});

test("edit form preserves entered fields but excludes derived table data and IDs", async () => {
  const onEdit = jest.fn().mockResolvedValue(undefined);
  act(() =>
    root.render(
      <CrudPage
        title="ลูกค้า"
        items={[
          { id: "c1", name: "เดิม", salesOwner: "owner", firstOrder: "yesterday", createdAt: 123 },
        ]}
        columns={[{ key: "name", label: "ชื่อ" }]}
        fields={fields}
        onEdit={onEdit}
      />,
    ),
  );
  click(container.querySelector('button[title="แก้ไข"]'));
  await save();
  expect(onEdit).toHaveBeenCalledWith("c1", { name: "เดิม", salesOwner: "owner" });
});
