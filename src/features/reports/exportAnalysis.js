import * as XLSX from "xlsx";
export function exportAnalysis({ rows, start, end, format }) {
  const safeRows = rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === "string" && /^\s*[=+@-]/.test(value) ? `'${value}` : value,
      ]),
    ),
  );
  const sheet = XLSX.utils.json_to_sheet(safeRows);
  sheet["!cols"] = Object.keys(rows[0]).map(() => ({ wch: 22 }));
  if (format === "csv") {
    const blob = new Blob(["\uFEFF", XLSX.utils.sheet_to_csv(sheet)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = `Customer_Analysis_${start}_${end}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Customer Analysis");
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["คำอธิบาย"],
        [
          "1 แถวต่อสินค้า (product ID) ต่อ Order; ข้อมูลลูกค้าใช้ข้อมูลปัจจุบันเพื่อเติมข้อมูลเก่าได้",
        ],
        [
          "Quantity = จำนวนขายรวมทุกกล่อง; Unit Price = ราคาเฉลี่ยถ่วงน้ำหนักเมื่อสินค้าเดียวมีหลายราคา",
        ],
        [
          "Carton Qty = จำนวนกล่องที่มีสินค้านี้ กล่องที่มีหลายสินค้าอาจปรากฏในหลายแถว ห้ามรวมเป็นจำนวนกล่อง Order",
        ],
        ["Net Sales ไม่รวมค่าส่ง; Shipping Fee ลงแถวแรกของ Order เพียงครั้งเดียว"],
        ["รวมรายการรอชำระและชำระแล้ว ไม่รวมรายการยกเลิก; ไม่ใช่รายงานเงินสดรับ"],
        [
          "SKU เก่าที่ยังไม่กำหนดใช้ product ID; ช่อง Invoice / Country / เครดิตเทอม / วันครบกำหนดเว้นว่างเมื่อไม่มีข้อมูล",
        ],
      ]),
      "คำอธิบาย",
    );
    XLSX.writeFile(wb, `Customer_Analysis_${start}_${end}.xlsx`);
  }
}
