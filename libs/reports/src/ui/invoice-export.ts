import { Currency, toAmountText } from '@routeops/shared/money';
import { InvoiceLine } from '../domain/trip-report';

export interface InvoiceExportLabels {
  readonly title: string;
  readonly customer: string;
  readonly from: string;
  readonly to: string;
  readonly serial: string;
  readonly route: string;
  readonly vehicleType: string;
  readonly trips: string;
  readonly rate: string;
  readonly lineTotal: string;
  readonly grandTotal: string;
  readonly noRate: string;
}

export interface InvoiceExportMeta {
  readonly customerName: string;
  readonly from: string;
  readonly to: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly currency: Currency;
  readonly language: 'ar' | 'en';
}

// UTF-8 BOM so Excel keeps Arabic text. Amounts are plain decimals Excel can sum.
export function invoiceExcelCsv(
  lines: readonly InvoiceLine[],
  labels: InvoiceExportLabels,
  meta: InvoiceExportMeta,
  routeLabel: (line: InvoiceLine) => string,
  typeLabel: (line: InvoiceLine) => string,
): string {
  const amount = (minor: number | null) =>
    minor === null ? labels.noRate : toAmountText(minor, meta.currency);
  const rows: string[][] = [
    [labels.title],
    [labels.customer, meta.customerName],
    [labels.from, meta.fromLabel],
    [labels.to, meta.toLabel],
    [],
    [
      labels.serial,
      labels.route,
      labels.vehicleType,
      labels.trips,
      labels.rate,
      labels.lineTotal,
    ],
    ...lines.map((line, index) => [
      String(index + 1),
      routeLabel(line),
      typeLabel(line),
      String(line.trips),
      amount(line.rate),
      amount(line.revenue),
    ]),
    [
      '',
      '',
      '',
      '',
      labels.grandTotal,
      amount(lines.reduce((sum, line) => sum + line.revenue, 0)),
    ],
  ];
  return `\uFEFF${rows.map(csvLine).join('\r\n')}`;
}

export function invoiceExcelFileName(meta: InvoiceExportMeta): string {
  const customer = safeFilePart(meta.customerName) || 'customer';
  return `invoice-${customer}-${meta.from}-${meta.to}.csv`;
}

export function invoicePrintHtml(
  lines: readonly InvoiceLine[],
  labels: InvoiceExportLabels,
  meta: InvoiceExportMeta,
  routeLabel: (line: InvoiceLine) => string,
  typeLabel: (line: InvoiceLine) => string,
  money: (minor: number) => string,
): string {
  const dir = meta.language === 'ar' ? 'rtl' : 'ltr';
  const body = lines
    .map(
      (line, index) => `<tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(routeLabel(line))}</td>
      <td>${escapeHtml(typeLabel(line))}</td>
      <td class="num">${escapeHtml(String(line.trips))}</td>
      <td class="num">${escapeHtml(line.rate === null ? labels.noRate : money(line.rate))}</td>
      <td class="num">${escapeHtml(money(line.revenue))}</td>
    </tr>`,
    )
    .join('');
  const total = money(lines.reduce((sum, line) => sum + line.revenue, 0));
  return `<!DOCTYPE html>
<html lang="${meta.language}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(labels.title)}</title>
  <style>
    body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    .meta { margin: 0 0 16px; font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #ccc; padding: 8px; vertical-align: top; }
    th { background: #f3f3f3; }
    .num { text-align: end; white-space: nowrap; font-variant-numeric: tabular-nums; }
    tfoot td, tfoot th { font-weight: 700; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(labels.title)}</h1>
  <p class="meta">
    ${escapeHtml(labels.customer)}: <strong>${escapeHtml(meta.customerName)}</strong><br />
    ${escapeHtml(labels.from)}: ${escapeHtml(meta.fromLabel)}<br />
    ${escapeHtml(labels.to)}: ${escapeHtml(meta.toLabel)}
  </p>
  <table>
    <thead>
      <tr>
        <th>${escapeHtml(labels.serial)}</th>
        <th>${escapeHtml(labels.route)}</th>
        <th>${escapeHtml(labels.vehicleType)}</th>
        <th>${escapeHtml(labels.trips)}</th>
        <th>${escapeHtml(labels.rate)}</th>
        <th>${escapeHtml(labels.lineTotal)}</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
    <tfoot>
      <tr>
        <th colspan="5">${escapeHtml(labels.grandTotal)}</th>
        <td class="num">${escapeHtml(total)}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}

export function downloadTextFile(
  fileName: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Opens a print window so the member can save as PDF from the browser.
export function openInvoicePdf(html: string): void {
  const popup = window.open('', '_blank');
  if (!popup) {
    return;
  }
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
}

function csvLine(cells: readonly string[]): string {
  return cells.map(csvCell).join(',');
}

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeFilePart(value: string): string {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
