import * as XLSX from "xlsx";
import {
  parseDateTime,
  toTH_DateKey,
  findEmployeeKey,
  processWorkbook,
  processPayroll,
  buildPayrollWorkbook,
  buildHighlightWorkbook,
} from "./payroll";

function workbook(times, name = "สมชาย", extraSheets = []) {
  const wb = XLSX.utils.book_new();
  const rows = times.map((time) => ({
    "ชื่อ-นามสกุล": name,
    รหัสที่เครื่อง: "001",
    "วัน/เวลา": `01/09/2026 ${time}`,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "เวลา");
  extraSheets.forEach((sheet, i) =>
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet), `เพิ่ม${i}`),
  );
  return wb;
}

test("parses scanner timestamps as Thailand time and ignores invalid dates", () => {
  expect(parseDateTime("01/09/2026 00:10").toISOString()).toBe("2026-08-31T17:10:00.000Z");
  expect(toTH_DateKey(parseDateTime("01/09/2026 00:10"))).toBe("2026-09-01");
  expect(parseDateTime("invalid")).toBeNull();
});

test("preserves exact and normalized employee matching", () => {
  expect(findEmployeeKey("นาย สมชาย", ["สมชาย", "สมหญิง"])).toBe("สมชาย");
  expect(findEmployeeKey("", ["สมชาย"])).toBeNull();
  expect(findEmployeeKey("ไม่พบพนักงานนี้", ["สมชาย"])).toBeNull();
});

test("daily worker uses paired scan durations and the existing hourly rate", () => {
  const result = processPayroll(workbook(["17:00", "08:00", "13:00", "12:00"]), {
    สมชาย: { dailyRate: "50", pieceRate: "80", isPieceWorker: false },
  });
  expect(result[0]).toMatchObject({
    matched: true,
    packHours: 8,
    packPay: 400,
    pressHours: 0,
    pressPay: 0,
    totalPay: 400,
  });
});

test.each([
  [true, 4, 2, 360],
  [false, 6, 0, 300],
])(
  "piece worker flag %s determines which rate is applied",
  (flag, packHours, pressHours, totalPay) => {
    const result = processPayroll(workbook(["00:10", "02:10", "08:00", "12:00"]), {
      สมชาย: { dailyRate: 50, pieceRate: 80, isPieceWorker: flag },
    });
    expect(result[0]).toMatchObject({ packHours, pressHours, totalPay });
  },
);

test.each([
  ["00:09", 0],
  ["00:10", 170 / 60],
  ["02:50", 10 / 60],
  ["02:51", 0],
])("preserves the press start-window boundary %s", (start, expected) => {
  const [result] = processPayroll(workbook([start, "03:00"]), {
    สมชาย: { dailyRate: 50, pieceRate: 80, isPieceWorker: true },
  });
  expect(result.pressHours).toBe(Math.round(expected * 100) / 100);
});

test("unpaired final scan is ignored and unknown employees have zero pay", () => {
  const [result] = processPayroll(workbook(["08:00", "12:00", "13:00"]), {});
  expect(result).toMatchObject({ packHours: 4, matched: false, totalPay: 0 });
});

test("scan checking covers all sheets, payroll retains the first-sheet behavior", () => {
  const wb = workbook(["08:00", "12:00", "13:00"], "สมชาย", [
    [{ ชื่อ: "สมหญิง", "วัน/เวลา": "01/09/2026 08:00" }],
  ]);
  const processed = processWorkbook(wb);
  expect(Object.keys(processed)).toHaveLength(2);
  expect(processed["เวลา"].highlights).toEqual({ 0: "FFCCCC", 1: "FFCCCC", 2: "FFCCCC" });
  expect(processPayroll(wb, {})).toHaveLength(1);
  expect(buildHighlightWorkbook(wb, processed).SheetNames).toHaveLength(2);
});

test("retains payroll rounding and editable deduction formulas", () => {
  const result = processPayroll(workbook(["08:00", "08:01"]), { สมชาย: { dailyRate: 50 } });
  expect(result[0]).toMatchObject({ packHours: 0.02, packPay: 0.83, totalPay: 0.83 });
  const sheet = buildPayrollWorkbook(result).Sheets["คำนวณ"];
  expect(sheet.K2.f).toBe("ROUND(H2-I2-J2,0)");
  expect(sheet.H2.v).toBe(0.83);
});
