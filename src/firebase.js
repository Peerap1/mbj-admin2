import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, signOut, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get, set, push, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyBIxa5tK5x44qTQsdyPL_QkJxCt613seHw',
  authDomain: 'mbj-admin.firebaseapp.com',
  projectId: 'mbj-admin',
  storageBucket: 'mbj-admin.firebasestorage.app',
  messagingSenderId: '922634034449',
  appId: '1:922634034449:web:3d7a686a100071b81a80b0',
  measurementId: 'G-CQSV8BB2RM',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const defaultData = {
  users: {
    admin: { username: 'admin', password: 'admin1234', role: 'admin', name: 'Admin' },
    user: { username: 'user', password: 'user1234', role: 'user', name: 'User' },
    suser: { username: 'suser', password: 'suser1234', role: 'suser', name: 'SUser' },
  },
  customers: {
    c001: { name: 'บริษัท ดีเจอาร์', phone: '081-234-5678', email: 'info@djr.co.th' },
    c002: { name: 'คุณสมชาย', phone: '089-765-4321', email: 'somchai@example.com' },
  },
  products: {
    p001: { name: 'สินค้า A', price: 1200, stock: 8 },
    p002: { name: 'สินค้า B', price: 750, stock: 15 },
  },
  banks: {
    b001: { bank: 'ธนาคารกสิกร', account: '123-4-56789-0' },
    b002: { bank: 'ธนาคารกรุงเทพ', account: '987-6-54321-0' },
  },
  sales: {
    s001: { date: '2026-06-01', customer: 'บริษัท ดีเจอาร์', total: 3800 },
    s002: { date: '2026-06-02', customer: 'คุณสมชาย', total: 1500 },
  },
};

const usernameToEmail = (username) => `${username}@mbj-admin.local`;

const ensureAuthUser = async (user) => {
  const email = usernameToEmail(user.username);
  const methods = await fetchSignInMethodsForEmail(auth, email);
  if (!methods || methods.length === 0) {
    await createUserWithEmailAndPassword(auth, email, user.password);
  }
};

export const initDatabase = async () => {
  const dbRef = ref(db);
  const snapshot = await get(dbRef);
  if (!snapshot.exists()) {
    await set(dbRef, defaultData);
  } else {
    const data = snapshot.val();
    if (!data.users) {
      await set(ref(db, 'users'), defaultData.users);
    }
    if (!data.customers) {
      await set(ref(db, 'customers'), defaultData.customers);
    }
    if (!data.products) {
      await set(ref(db, 'products'), defaultData.products);
    }
    if (!data.banks) {
      await set(ref(db, 'banks'), defaultData.banks);
    }
    if (!data.sales) {
      await set(ref(db, 'sales'), defaultData.sales);
    }
  }

  const usersSnapshot = await get(ref(db, 'users'));
  const users = usersSnapshot.exists() ? usersSnapshot.val() : defaultData.users;
  const loadedUsers = Object.values(users || defaultData.users);
  await Promise.all(loadedUsers.map((user) => ensureAuthUser(user)));
};

export const fetchData = async () => {
  const snapshot = await get(ref(db));
  return snapshot.exists() ? snapshot.val() : defaultData;
};

export const signInWithUsernameAndPassword = async (username, password) => {
  const email = usernameToEmail(username);
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOutUser = async () => {
  return signOut(auth);
};

export const onAuthChanged = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const addSale = async (sale) => {
  const salesRef = ref(db, 'sales');
  const newSaleRef = push(salesRef);
  await set(newSaleRef, sale);
};

export const updateRecord = async (path, value) => {
  await update(ref(db, path), value);
};

export const getDatabaseInstance = () => db;
