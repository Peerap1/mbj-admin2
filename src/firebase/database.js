import { db } from "./config";
import { ref, set, get, push, runTransaction } from "firebase/database";
import { createCollection } from "./collection";
const nextCode = async (counter, prefix, width) => {
  const result = await runTransaction(
    ref(db, `counters/${counter}`),
    (value) => (Number(value) || 0) + 1,
  );
  if (!result.committed) throw new Error("Unable to allocate document number");
  return `${prefix}${String(result.snapshot.val()).padStart(width, "0")}`;
};

export const loginUser = async (username, password) => {
  const usersRef = ref(db, "users");
  const snap = await get(usersRef);
  if (!snap.exists()) return null;
  const users = snap.val();
  const found = Object.entries(users).find(
    ([, u]) => u.username === username && u.password === password,
  );
  if (!found) return null;
  return { id: found[0], ...found[1] };
};

export const addCustomer = async (data) => {
  const target = push(ref(db, "customers"));
  const customerCode = await nextCode("customers", "C", 4);
  await set(target, { ...data, customerCode, createdAt: Date.now() });
  return target;
};

export const addSale = async (data) => {
  const target = push(ref(db, "sales"));
  const orderNo = await nextCode("orders", "SO", 6);
  const saved = { ...data, orderNo, createdAt: Date.now(), status: "pending" };
  await set(target, saved);
  return { ...saved, id: target.key };
};

const customers = createCollection("customers");
export const getCustomers = customers.subscribe;
export const updateCustomer = customers.update;
export const deleteCustomer = customers.remove;

const products = createCollection("products");
export const getProducts = products.subscribe;
export const updateProduct = products.update;
export const deleteProduct = products.remove;
export const addProduct = products.add;

const banks = createCollection("banks");
export const getBanks = banks.subscribe;
export const updateBank = banks.update;
export const deleteBank = banks.remove;
export const addBank = banks.add;

const sales = createCollection("sales");
export const getSales = sales.subscribe;
export const updateSale = sales.update;
export const deleteSale = sales.remove;

const employees = createCollection("employees");
export const getEmployees = employees.subscribe;
export const updateEmployee = employees.update;
export const deleteEmployee = employees.remove;
export const addEmployee = employees.add;
