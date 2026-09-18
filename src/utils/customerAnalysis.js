// All reporting dates use Thailand time, independent of the browser timezone.
export const DAY = 86400000;
export const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
export const money = (value) => Math.round((number(value) + Number.EPSILON) * 100) / 100;
export const dateKey = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 10) : "";
};
export const formatDate = (value) => dateKey(value) ? new Date(value).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }) : "–";
export const validSales = (sales) => sales.filter(s => s.status !== "cancelled" && dateKey(s.createdAt));
export const inRange = (sale, start, end) => {
  const date = dateKey(sale.createdAt);
  return !!date && (!start || date >= start) && (!end || date <= end);
};
export const customerKey = (sale) => sale.customerId || `unlinked:${sale.id}`;
export const customerCode = (customer) => customer.customerCode || customer.id || "";
export const orderCode = (sale) => sale.orderNo || sale.id || "";

// One line per product per order. Box quantity multiplies the quantity per box.
// Legacy orders with items[] are already expressed in individual units.
export function orderLines(sale, products = []) {
  const productMap = new Map(products.map(p => [p.id, p]));
  const groups = new Map();
  const boxes = sale.boxes ? Object.values(sale.boxes) : [{ items: sale.items || [], boxQty: 1, legacy: true }];
  boxes.forEach((box, boxIndex) => {
    const cartons = box.legacy ? 0 : number(box.boxQty ?? 1);
    Object.values(box.items || []).forEach((item, index) => {
      if (!item.productId && !item.productName && !item.name) return;
      const product = productMap.get(item.productId) || {};
      const key = item.productId || item.sku || `legacy:${item.productName || item.name || index}`;
      const quantity = number(item.qty) * (box.legacy ? 1 : cartons);
      const gross = money(quantity * number(item.price));
      if (!groups.has(key)) groups.set(key, {
        key, sku: item.sku || product.sku || item.productId || "", name: item.productName || item.name || product.name || "ไม่ระบุ",
        unit: item.unit || product.unit || "", quantity: 0, cartonQty: 0, gross: 0, discount: 0, boxes: new Set(), prices: new Set(),
      });
      const line = groups.get(key);
      line.quantity += quantity;
      line.gross = money(line.gross + gross);
      line.discount = money(line.discount + number(item.discount));
      line.prices.add(number(item.price));
      if (!line.boxes.has(boxIndex)) { line.cartonQty += cartons; line.boxes.add(boxIndex); }
    });
  });
  return [...groups.values()].map(({ boxes, prices, ...line }) => ({
    ...line, unitPrice: prices.size === 1 ? [...prices][0] : (line.quantity ? money(line.gross / line.quantity) : 0),
    net: money(line.gross - line.discount),
  }));
}

// Product revenue excludes delivery fees; unpaid orders still count as orders.
export function saleRevenue(sale) {
  if (sale.subtotal != null) return money(number(sale.subtotal) - number(sale.discount));
  if (sale.total != null) return money(number(sale.total) - number(sale.shippingCost));
  return money(orderLines(sale).reduce((sum, line) => sum + line.net, 0) - number(sale.discount));
}

export function customerStats(sales, asOf = Date.now()) {
  const orders = validSales(sales).filter(s => dateKey(s.createdAt) <= dateKey(asOf)).sort((a, b) => a.createdAt - b.createdAt);
  if (!orders.length) return { orders, count: 0, revenue: 0, average: 0, first: null, last: null, days: null, cycle: null, status: "ยังไม่เคยซื้อ", yearRevenue: 0, previousRevenue: 0, growth: null };
  const first = orders[0].createdAt, last = orders[orders.length - 1].createdAt;
  const days = Math.round((Date.parse(dateKey(asOf)) - Date.parse(dateKey(last))) / DAY);
  const purchaseDays = [...new Set(orders.map(s => dateKey(s.createdAt)))];
  const cycle = purchaseDays.length > 1 ? Math.round((Date.parse(purchaseDays[purchaseDays.length - 1]) - Date.parse(purchaseDays[0])) / DAY / (purchaseDays.length - 1)) : null;
  const revenue = money(orders.reduce((sum, s) => sum + saleRevenue(s), 0));
  const year = Number(dateKey(asOf).slice(0, 4));
  const sumYear = y => money(orders.filter(s => dateKey(s.createdAt).startsWith(String(y))).reduce((sum, s) => sum + saleRevenue(s), 0));
  const yearRevenue = sumYear(year), previousRevenue = sumYear(year - 1);
  return { orders, count: orders.length, revenue, average: money(revenue / orders.length), first, last, days, cycle,
    status: days > 180 ? "Lost" : days > 90 ? "At Risk" : "Active", yearRevenue, previousRevenue,
    growth: previousRevenue ? money((yearRevenue - previousRevenue) / previousRevenue * 100) : null };
}

export function productTotals(sales, products = []) {
  const totals = new Map();
  sales.forEach(sale => orderLines(sale, products).forEach(line => {
    const old = totals.get(line.key) || { ...line, quantity: 0, net: 0, count: 0 };
    totals.set(line.key, { ...old, quantity: old.quantity + line.quantity, net: money(old.net + line.net), count: old.count + 1 });
  }));
  return [...totals.values()];
}

export function monthlySeries(sales, allSales, start, end) {
  if (!start || !end || start > end) return [];
  const first = new Map();
  validSales(allSales).forEach(s => {
    const key = customerKey(s), date = dateKey(s.createdAt);
    if (!first.has(key) || date < first.get(key)) first.set(key, date);
  });
  const rows = [];
  let year = Number(start.slice(0, 4)), month = Number(start.slice(5, 7));
  const lastMonth = end.slice(0, 7);
  while (`${year}-${String(month).padStart(2, "0")}` <= lastMonth) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const from = key === start.slice(0, 7) ? start : `${key}-01`;
    const to = key === lastMonth ? end : `${key}-31`;
    const prior = d => {
      const y = Number(d.slice(0, 4)) - 1, m = Number(d.slice(5, 7));
      const day = Math.min(Number(d.slice(8, 10)), new Date(Date.UTC(y, m, 0)).getUTCDate());
      return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };
    const current = sales.filter(s => inRange(s, from, to));
    const buyers = [...new Set(current.map(customerKey))];
    const newCount = buyers.filter(id => first.get(id)?.startsWith(key)).length;
    rows.push({ key, label: `${month}/${year + 543}`, value: money(current.reduce((sum, s) => sum + saleRevenue(s), 0)),
      previous: money(validSales(allSales).filter(s => inRange(s, prior(from), prior(to))).reduce((sum, s) => sum + saleRevenue(s), 0)),
      newCount, returning: buyers.length - newCount });
    month++; if (month > 12) { month = 1; year++; }
  }
  return rows;
}

export function analysisRows(sales, customers, products) {
  const master = new Map(customers.map(c => [c.id, c]));
  return validSales(sales).sort((a, b) => b.createdAt - a.createdAt).flatMap(sale => {
    const customer = master.get(sale.customerId) || sale._slipCustomer || {};
    const lines = orderLines(sale, products);
    return lines.map((line, index) => ({
      "Order Date": dateKey(sale.createdAt), "Order ID": orderCode(sale), "Invoice No": sale.invoiceNo || "",
      "Customer ID": customerCode(customer) || sale.customerId || "", "Customer Name": sale.customerName || customer.name || "",
      "Customer Type": customer.customerType || "ไม่ระบุ", Province: customer.province || "", Country: customer.country || "",
      "Acquisition Channel": customer.acquisitionChannel || "", "Sales Owner": sale.salesOwner || customer.salesOwner || "",
      SKU: line.sku, "Product Name": line.name, Quantity: line.quantity, Unit: line.unit, "Carton Qty": line.cartonQty,
      "Unit Price": line.unitPrice, Discount: line.discount, "Net Sales": line.net,
      "Shipping Fee": index === 0 ? number(sale.shippingCost) : 0,
      "Payment Method": sale.payment?.method === "cash" ? "เงินสด" : sale.payment?.method === "bank" ? "โอนธนาคาร" : "",
      "Payment Term": sale.paymentTerm || "", "Due Date": dateKey(sale.dueDate), "Paid Date": dateKey(sale.paidAt),
    }));
  });
}
