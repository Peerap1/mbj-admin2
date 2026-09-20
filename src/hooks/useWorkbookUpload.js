import { useState } from "react";
import * as XLSX from "xlsx";

export default function useWorkbookUpload(processWorkbook) {
  const [state, setState] = useState({
    fileName: "",
    processing: false,
    data: null,
    workbook: null,
    error: "",
  });
  const handleFile = async (event) => {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    setState({ fileName: file.name, processing: true, data: null, workbook: null, error: "" });
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const data = processWorkbook(workbook);
      setState({ fileName: file.name, processing: false, data, workbook, error: "" });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        processing: false,
        error: `เกิดข้อผิดพลาด: ${error.message}`,
      }));
    } finally {
      input.value = "";
    }
  };
  return { ...state, handleFile };
}
