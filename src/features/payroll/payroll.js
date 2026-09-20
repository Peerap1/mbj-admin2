import * as XLSX from "xlsx";
// Preserves the existing first-sheet, time-pairing, matching and rounding rules.
export function toTH_DateKey(dt) {
  const offsetMs = 7 * 60 * 60 * 1000;
  const local = new Date(dt.getTime() + offsetMs);
  return local.toISOString().slice(0, 10);
}

export function parseDateTime(raw) {
  if (!raw) return null;
  if (raw instanceof Date && !isNaN(raw)) return raw;
  const s = String(raw).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4] - 7, +m[5], +(m[6] || 0)));
    if (!isNaN(d)) return d;
  }
  const d2 = new Date(raw);
  return isNaN(d2) ? null : d2;
}

export function normalizeName(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/^(นาย|นาง|นางสาว|น\.ส\.|ด\.ช\.|ด\.ญ\.)/, "");
}

export function levenshtein(a, b) {
  const m = a.length,
    n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function findEmployeeKey(rawName, keys) {
  const target = normalizeName(rawName);
  if (!target) return null;

  // 1) Exact match (after normalization)
  const exact = keys.find((k) => normalizeName(k) === target);
  if (exact) return exact;

  // 2) Typo-tolerant match: only allow small edit distance relative to length,
  //    and require length difference to be small too (rules out "เคอ" vs "ใจเคอ").
  let best = null,
    bestDist = Infinity;
  keys.forEach((k) => {
    const norm = normalizeName(k);
    const lenDiff = Math.abs(norm.length - target.length);
    if (lenDiff > 2) return; // names of very different length are never a "typo"
    const dist = levenshtein(norm, target);
    const maxAllowed = norm.length <= 4 ? 1 : 2; // stricter tolerance for short names
    if (dist <= maxAllowed && dist < bestDist) {
      best = k;
      bestDist = dist;
    }
  });
  return best;
}

export function processWorkbook(wb) {
  const results = {};
  wb.SheetNames.forEach((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "", cellDates: true });

    const normalized = rows.map((row, idx) => {
      const obj = { _origIdx: idx };
      Object.keys(row).forEach((k) => {
        obj[k.trim()] = row[k];
      });
      return obj;
    });

    const parsed = normalized.map((row) => {
      const raw = row["วัน/เวลา"] || row["วัน/เวลา "] || "";
      const dt = parseDateTime(raw);
      return { ...row, _dt: dt };
    });

    const groups = {};
    parsed.forEach((row) => {
      if (!row._dt) return;
      const name = (row["ชื่อ-นามสกุล"] || row["ชื่อ"] || "").trim();
      const dateKey = toTH_DateKey(row._dt);
      const key = `${name}|||${dateKey}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    const highlights = {};
    Object.values(groups).forEach((grp) => {
      const count = grp.length;
      const color = count < 4 ? "FFCCCC" : count > 4 ? "FFFF99" : null;
      grp.forEach((r) => {
        if (color) highlights[r._origIdx] = color;
      });
    });

    results[sheetName] = { rows: parsed, highlights, groups };
  });
  return results;
}

export function buildHighlightWorkbook(originalWb, processed) {
  const outWb = XLSX.utils.book_new();
  originalWb.SheetNames.forEach((sheetName) => {
    const data = processed[sheetName];
    if (!data) return;
    const { rows, highlights } = data;

    const clean = rows.map(({ _dt, _origIdx, ...rest }) => ({
      ...rest,
      สถานะ:
        highlights[_origIdx] === "FFCCCC"
          ? "⚠ ไม่ครบ (<4)"
          : highlights[_origIdx] === "FFFF99"
            ? "⚠ เกิน (>4)"
            : "✓ ปกติ",
    }));

    const ws = XLSX.utils.json_to_sheet(clean);

    const headers = Object.keys(clean[0] || {});
    const statusColIdx = headers.indexOf("สถานะ");
    if (statusColIdx >= 0) {
      rows.forEach((row, rIdx) => {
        const color = highlights[row._origIdx];
        if (!color) return;
        const cellAddr = XLSX.utils.encode_cell({ r: rIdx + 1, c: statusColIdx });
        if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
        ws[cellAddr].s = {
          font: { color: { rgb: color === "FFCCCC" ? "CC0000" : "AA6600" }, bold: true },
        };
      });
    }

    XLSX.utils.book_append_sheet(outWb, ws, sheetName);
  });
  return outWb;
}

export function processPayroll(wb, employeeMap) {
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "", cellDates: true });

  const normalized = rows.map((row) => {
    const obj = {};
    Object.keys(row).forEach((k) => {
      obj[k.trim()] = row[k];
    });
    return obj;
  });

  const parsed = normalized
    .map((row) => {
      const raw = row["วัน/เวลา"] || row["วัน/เวลา "] || "";
      const dt = parseDateTime(raw);
      const code = String(row["รหัสที่เครื่อง"] ?? row["รหัส"] ?? "").trim();
      const name = String(row["ชื่อ-นามสกุล"] ?? row["ชื่อ"] ?? "").trim();
      return { ...row, _dt: dt, _code: code, _name: name };
    })
    .filter((r) => r._dt && r._name);

  const dailyGroups = {};
  parsed.forEach((row) => {
    const dateKey = toTH_DateKey(row._dt);
    const key = `${row._code}|||${row._name}|||${dateKey}`;
    if (!dailyGroups[key]) dailyGroups[key] = [];
    dailyGroups[key].push(row);
  });

  const dailyMinutesByPerson = {};
  const pressMinutesByPerson = {};

  const employeeKeys = Object.keys(employeeMap);

  Object.entries(dailyGroups).forEach(([key, group]) => {
    const parts = key.split("|||");
    const name = parts[1];
    const times = group.map((g) => g._dt).sort((a, b) => a - b);

    let dayMinutes = 0;
    for (let i = 1; i < times.length; i += 2) {
      dayMinutes += (times[i] - times[i - 1]) / 60000;
    }
    dailyMinutesByPerson[name] = (dailyMinutesByPerson[name] || 0) + dayMinutes;

    const matchedKey = findEmployeeKey(name, employeeKeys);
    const isPieceWorker = matchedKey ? employeeMap[matchedKey].isPieceWorker : false;
    if (isPieceWorker && times.length >= 2) {
      const first = times[0];
      const bkkMin = ((first.getTime() + 7 * 3600000) / 60000) % 1440;
      const startWindow = 10; // นับ press ตั้งแต่เที่ยงคืน 00:10
      const endWindow = 2 * 60 + 50;
      if (bkkMin >= startWindow && bkkMin <= endWindow) {
        const pressMin = (times[1] - times[0]) / 60000;
        pressMinutesByPerson[name] = (pressMinutesByPerson[name] || 0) + pressMin;
      }
    }
  });

  const summary = Object.keys(dailyMinutesByPerson)
    .map((name) => {
      const totalMin = dailyMinutesByPerson[name] || 0;
      const pressMin = pressMinutesByPerson[name] || 0;
      const packMin = Math.max(totalMin - pressMin, 0);

      const empKey = findEmployeeKey(name, employeeKeys);
      const emp = empKey ? employeeMap[empKey] : null;

      const packHours = packMin / 60;
      const pressHours = pressMin / 60;
      const packRate = emp?.dailyRate ? Number(emp.dailyRate) : 0;
      const pressRate = emp?.pieceRate ? Number(emp.pieceRate) : 0;

      const packPay = packHours * packRate;
      const pressPay = pressHours * pressRate;
      const totalPay = packPay + pressPay;

      return {
        name,
        matched: !!emp,
        isPieceWorker: !!emp?.isPieceWorker,
        packHours: Math.round(packHours * 100) / 100,
        packRate,
        packPay: Math.round(packPay * 100) / 100,
        pressHours: Math.round(pressHours * 100) / 100,
        pressRate,
        pressPay: Math.round(pressPay * 100) / 100,
        totalPay: Math.round(totalPay * 100) / 100,
        withdraw: 0,
        socialSecurity: 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "th"));

  return summary;
}

export function buildPayrollWorkbook(summary) {
  const outWb = XLSX.utils.book_new();

  const headerRow = [
    "ชื่อพนักงาน",
    "ชั่วโมงห้องแพ็ค",
    "อัตรา/ชม (แพ็ค)",
    "รวมเงิน (แพ็ค)",
    "ชั่วโมงกดแผ่น",
    "อัตรา/ชม (กด)",
    "รวมเงิน (กด)",
    "รวมจ่ายทั้งหมด",
    "เบิก",
    "ประกันสังคม",
    "จ่ายจริง",
  ];

  const dataRows = summary.map((r) => [
    r.name,
    r.packHours,
    r.packRate,
    r.packPay,
    r.pressHours,
    r.pressRate,
    r.pressPay,
    r.totalPay,
    r.withdraw,
    r.socialSecurity,
    Math.round(r.totalPay - r.withdraw - r.socialSecurity),
  ]);

  const aoa = [headerRow, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const sumRowIdx = dataRows.length + 1;
  const sumExcelRow = sumRowIdx + 2;
  const sumCell = XLSX.utils.encode_cell({ r: sumRowIdx + 1, c: 7 });
  ws[sumCell] = { t: "n", f: `SUM(H2:H${sumExcelRow - 1})` };

  dataRows.forEach((_, i) => {
    const excelRow = i + 2;
    const cellAddr = XLSX.utils.encode_cell({ r: i + 1, c: 10 });
    ws[cellAddr] = { t: "n", f: `ROUND(H${excelRow}-I${excelRow}-J${excelRow},0)`, z: "#,##0" };
  });

  ws["!cols"] = headerRow.map(() => ({ wch: 15 }));

  XLSX.utils.book_append_sheet(outWb, ws, "คำนวณ");
  return outWb;
}
