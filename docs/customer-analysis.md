# Customer Analysis — Phase 1

## How to use

1. Customers: fill customer type, province, acquisition channel and sales owner. Owner choices come from employee names, the signed-in username and previously assigned owners. Existing records can retain blank fields while data is being completed.
2. Products: add a unique SKU and selling unit. New sales save SKU/unit and customer province/owner snapshots. Historical sales can use the current product SKU/unit when missing.
3. Click a customer name to see lifetime purchases, purchase cycle, status, twelve-month history, product rankings and all orders. Order links open the delivery slip in History.
4. Reports: select a date range; inspect monthly comparisons, customer types, Top 10 customers, new/returning customers, Top 10 products, and follow-up customers. Click chart data to drill into orders or a customer profile.
5. Export Customer Analysis as Excel or UTF-8 CSV. Excel includes an explanatory worksheet.

## Definitions

- Reporting dates use Asia/Bangkok (UTC+7).
- Revenue is product sales excluding delivery charges. Pending and paid orders count; cancelled orders do not. This is not a cash receipts report.
- Customers group by customer ID, never by name. Unlinked legacy orders remain separate rather than guessing identity.
- Customer type/province/acquisition channel use the current master record, falling back to a saved snapshot if deleted. Updating classification changes historical breakdowns. Sales owner uses the order snapshot when present.
- First purchase uses all available valid sales, not the customer creation date.
- New customer in a month means their first purchase was in that month. Returning means their first purchase was earlier. Count distinct buyers once per month.
- Purchase cycle is mean spacing between distinct purchase days. A single purchase day has no cycle estimate.
- Active: 0–90 days since last purchase; At Risk: 91–180; Lost: over 180. No orders has its own state.
- Follow-up list is evaluated at the selected end date using all earlier history. It includes customers over 90 days inactive or beyond their own average cycle. Previous-year revenue is the full calendar year preceding that end date.
- Customer detail growth compares this year so far with the complete previous calendar year; the label states this explicitly. Monthly graphs compare matching selected calendar days with the preceding year, clamping leap day when necessary.

## Export contract

One row per product ID per order (legacy products without IDs fall back to SKU/name). The same product in multiple boxes merges into one row. Product names do not merge distinct IDs.

- Quantity = units per box × box quantity, summed across matching lines.
- Unit Price = weighted average when the same product has different prices in one order.
- Carton Qty = cartons containing this SKU. Mixed-product cartons appear against each SKU; do not sum this column as a physical order carton total.
- Shipping Fee appears only on the first exported row of an order, preventing duplication.
- Missing SKU falls back to product ID. Unknown units and optional metadata remain blank; they are not fabricated.
- Invoice No, Country, Payment Term and Due Date are reserved columns. This phase does not add invoice issuance, countries, credit terms or discounts to the entry screens. Existing values export if available.
- Text that could be interpreted as a spreadsheet formula receives a leading apostrophe.

## Storage and compatibility

New customers receive C0001-style codes and orders SO000001-style numbers via Firebase transactions under `counters/customers` and `counters/orders`. IDs and relationships still use existing Firebase keys. Counter gaps are possible after interrupted saves. Do not reset counters while corresponding records remain. Existing customers/orders retain their original IDs as fallback identifiers; no production migration is run.

Legacy `sales.items[]` and current `sales.boxes[].items[]` are supported in analysis and printed item tables. Existing database rules/authentication are unchanged by this feature.

## Verification

`npm test -- --watchAll=false --runInBand`

`npm run build`

Tests cover box multiplication, merging, legacy records, identity, export reconciliation, Thailand date boundaries, activity thresholds, monthly cohorts, leap-year comparisons, HTML escaping and report/profile interactions. These tests use synthetic records; they do not write to Firebase.
