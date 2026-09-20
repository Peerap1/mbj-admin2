import { buildPrintHTML } from "./slipPrint";

export function printSale(sale, createdBy) {
  if (!sale) return;
  const windowToPrint = window.open("", "_blank", "width=860,height=700");
  if (!windowToPrint) {
    alert("กรุณาอนุญาตหน้าต่างป๊อปอัปเพื่อพิมพ์เอกสาร");
    return;
  }
  windowToPrint.document.write(buildPrintHTML(sale, createdBy));
  windowToPrint.document.close();
  windowToPrint.focus();
  setTimeout(() => windowToPrint.print(), 450);
}
