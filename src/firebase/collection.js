import { ref, push, update, remove, onValue } from "firebase/database";
import { db } from "./config";

// Collection names are module constants, never supplied by form input.
export function createCollection(name) {
  return {
    subscribe(callback, onError) {
      return onValue(
        ref(db, name),
        (snapshot) => {
          callback(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })));
        },
        onError,
      );
    },
    add(data) {
      return push(ref(db, name), { ...data, createdAt: Date.now() });
    },
    update(id, data) {
      const { id: ignored, ...values } = data;
      return update(ref(db, `${name}/${id}`), values);
    },
    remove(id) {
      return remove(ref(db, `${name}/${id}`));
    },
  };
}
