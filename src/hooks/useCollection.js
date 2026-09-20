import { useEffect, useState } from "react";

export default function useCollection(subscribe) {
  const [state, setState] = useState({ data: [], loading: true, error: "" });
  useEffect(() => {
    let active = true;
    let unsubscribe;
    const fail = () => {
      if (active)
        setState((previous) => ({
          ...previous,
          loading: false,
          error: "โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อและสิทธิ์เข้าถึง",
        }));
    };
    setState({ data: [], loading: true, error: "" });
    try {
      unsubscribe = subscribe((data) => {
        if (active) setState({ data, loading: false, error: "" });
      }, fail);
    } catch {
      fail();
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [subscribe]);
  return state;
}
