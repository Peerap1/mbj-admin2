// src/firebase/database.js
import { db } from "./config";
import {
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  runTransaction,
} from "firebase/database";

// Server-side transactions keep human-readable document numbers unique across users.
const nextCode = async (counter, prefix, width) => {
  const result = await runTransaction(ref(db, `counters/${counter}`), value => (Number(value) || 0) + 1);
  if (!result.committed) throw new Error("Unable to allocate document number");
  return `${prefix}${String(result.snapshot.val()).padStart(width, "0")}`;
};

// ─── AUTH ───────────────────────────────────────────────────────────────────
export const loginUser = async (username, password) => {
  const usersRef = ref(db, "users");
  const snap = await get(usersRef);
  if (!snap.exists()) return null;
  const users = snap.val();
  const found = Object.entries(users).find(
    ([, u]) => u.username === username && u.password === password
  );
  if (!found) return null;
  return { id: found[0], ...found[1] };
};


// ─── CUSTOMERS ──────────────────────────────────────────────────────────────
export const getCustomers = (callback, onError) => {
  const r = ref(db, "customers");
  return onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, v]) => ({ id, ...v })));
  }, onError);
};

export const addCustomer = async (data) => {
  const target = push(ref(db, "customers"));
  const customerCode = await nextCode("customers", "C", 4);
  await set(target, { ...data, customerCode, createdAt: Date.now() });
  return target;
};
export const updateCustomer = (id, data) => update(ref(db, `customers/${id}`), data);
export const deleteCustomer = (id) => remove(ref(db, `customers/${id}`));

// ─── PRODUCTS ───────────────────────────────────────────────────────────────
export const getProducts = (callback, onError) => {
  const r = ref(db, "products");
  return onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, v]) => ({ id, ...v })));
  }, onError);
};

export const addProduct = (data) => push(ref(db, "products"), { ...data, createdAt: Date.now() });
export const updateProduct = (id, data) => update(ref(db, `products/${id}`), data);
export const deleteProduct = (id) => remove(ref(db, `products/${id}`));

// ─── BANKS ──────────────────────────────────────────────────────────────────
export const getBanks = (callback) => {
  const r = ref(db, "banks");
  return onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, v]) => ({ id, ...v })));
  });
};

export const addBank = (data) => push(ref(db, "banks"), { ...data, createdAt: Date.now() });
export const updateBank = (id, data) => update(ref(db, `banks/${id}`), data);
export const deleteBank = (id) => remove(ref(db, `banks/${id}`));

// ─── SALES ──────────────────────────────────────────────────────────────────
export const getSales = (callback, onError) => {
  const r = ref(db, "sales");
  return onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, v]) => ({ id, ...v })));
  }, onError);
};

export const addSale = async (data) => {
  const target = push(ref(db, "sales"));
  const orderNo = await nextCode("orders", "SO", 6);
  const saved = { ...data, orderNo, createdAt: Date.now(), status: "pending" };
  await set(target, saved);
  return { ...saved, id: target.key };
};
export const updateSale = (id, data) => update(ref(db, `sales/${id}`), data);
export const deleteSale = (id) => remove(ref(db, `sales/${id}`));

// ─── EMPLOYEES ──────────────────────────────────────────────────────────────
export const getEmployees = (callback) => {
  const r = ref(db, "employees");
  return onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, v]) => ({ id, ...v })));
  });
};
export const addEmployee    = (data) => push(ref(db, "employees"), { ...data, createdAt: Date.now() });
export const updateEmployee = (id, data) => update(ref(db, `employees/${id}`), data);
export const deleteEmployee = (id) => remove(ref(db, `employees/${id}`));
