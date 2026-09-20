import { useState } from "react";
import { newBox, newRow } from "./sales";
export default function useSaleCart(products) {
  const [boxes, setBoxes] = useState(() => [newBox()]);
  // ─── Box helpers ───────────────────────────────────────────────
  const addBox = () => setBoxes((prev) => [...prev, newBox()]);
  const removeBox = (boxId) =>
    setBoxes((prev) => (prev.length > 1 ? prev.filter((b) => b.id !== boxId) : prev));

  const updateBoxQty = (boxId, qty) =>
    setBoxes((prev) =>
      prev.map((b) => (b.id === boxId ? { ...b, boxQty: Math.max(1, Number(qty) || 1) } : b)),
    );

  const addRowToBox = (boxId) =>
    setBoxes((prev) =>
      prev.map((b) => (b.id === boxId ? { ...b, items: [...b.items, newRow()] } : b)),
    );

  const updateRow = (boxId, rowId, field, value) =>
    setBoxes((prev) =>
      prev.map((b) =>
        b.id !== boxId
          ? b
          : {
              ...b,
              items: b.items.map((r) => {
                if (r.rowId !== rowId) return r;
                if (field === "productId") {
                  const p = products.find((x) => x.id === value);
                  return p
                    ? {
                        ...r,
                        productId: p.id,
                        productName: p.name,
                        price: p.price || "",
                        sku: p.sku || "",
                        unit: p.unit || "",
                      }
                    : { ...r, productId: "", productName: "", price: "", sku: "", unit: "" };
                }
                return { ...r, [field]: value };
              }),
            },
      ),
    );

  const removeRow = (boxId, rowId) =>
    setBoxes((prev) =>
      prev.map((b) =>
        b.id !== boxId ? b : { ...b, items: b.items.filter((r) => r.rowId !== rowId) },
      ),
    );

  const quickAdd = (product) => {
    setBoxes((prev) => {
      const lastIdx = prev.length - 1;
      return prev.map((b, i) => {
        if (i !== lastIdx) return b;
        const ex = b.items.find((r) => r.productId === product.id);
        if (ex)
          return {
            ...b,
            items: b.items.map((r) =>
              r.productId === product.id ? { ...r, qty: Number(r.qty) + 1 } : r,
            ),
          };
        return { ...b, items: [...b.items, newRow(product)] };
      });
    });
  };

  return {
    boxes,
    setBoxes,
    addBox,
    removeBox,
    updateBoxQty,
    addRowToBox,
    updateRow,
    removeRow,
    quickAdd,
  };
}
