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
  query,
  orderByChild,
  equalTo,
} from "firebase/database";

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
export const getCustomers = (callback) => {
  const r = ref(db, "customers");
  return onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, v]) => ({ id, ...v })));
  });
};

export const addCustomer = (data) => push(ref(db, "customers"), { ...data, createdAt: Date.now() });
export const updateCustomer = (id, data) => update(ref(db, `customers/${id}`), data);
export const deleteCustomer = (id) => remove(ref(db, `customers/${id}`));

// ─── PRODUCTS ───────────────────────────────────────────────────────────────
export const getProducts = (callback) => {
  const r = ref(db, "products");
  return onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, v]) => ({ id, ...v })));
  });
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
export const getSales = (callback) => {
  const r = ref(db, "sales");
  return onValue(r, (snap) => {
    const data = snap.val() || {};
    callback(Object.entries(data).map(([id, v]) => ({ id, ...v })));
  });
};

export const addSale = (data) => push(ref(db, "sales"), { ...data, createdAt: Date.now(), status: "pending" });
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
