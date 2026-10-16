import { InvoiceLine } from '../domain/trip-report';
import {
  invoiceExcelCsv,
  invoiceExcelFileName,
  invoicePrintHtml,
} from './invoice-export';

const labels = {
  title: 'Client company invoice',
  customer: 'Client company',
  from: 'From',
  to: 'To',
  serial: '#',
  route: 'Route',
  vehicleType: 'Vehicle type',
  trips: 'Trips',
  rate: 'Rate',
  lineTotal: 'Trip total',
  grandTotal: 'Grand total',
  noRate: '—',
};

const meta = {
  customerName: 'Delta Factory',
  from: '2026-08-26',
  to: '2026-09-25',
  fromLabel: '26 Aug 2026',
  toLabel: '25 Sep 2026',
  currency: 'EGP' as const,
  language: 'en' as const,
};

const lines: InvoiceLine[] = [
  {
    routeId: 'route-1',
    label: 'Maadi line',
    vehicleType: 'bus',
    trips: 20,
    extra: 0,
    rate: 20000,
    revenue: 400000,
    unpriced: 0,
  },
  {
    routeId: '',
    label: '',
    vehicleType: 'microbus',
    trips: 11,
    extra: 0.5,
    rate: null,
    revenue: 210000,
    unpriced: 1,
  },
];

describe('invoice export', () => {
  it('builds a CSV Excel can open with Arabic-safe BOM and totals', () => {
    const csv = invoiceExcelCsv(
      lines,
      labels,
      meta,
      (line) => line.label || 'Extra trips',
      (line) => line.vehicleType || '—',
    );

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Client company invoice');
    expect(csv).toContain('Delta Factory');
    expect(csv).toContain('Maadi line');
    expect(csv).toContain('200.00');
    expect(csv).toContain('4000.00');
    expect(csv).toContain('—,2100.00');
    expect(csv).toContain('Grand total,6100.00');
    expect(invoiceExcelFileName(meta)).toBe(
      'invoice-Delta-Factory-2026-08-26-2026-09-25.csv',
    );
  });

  it('escapes commas in CSV cells', () => {
    const csv = invoiceExcelCsv(
      [
        {
          ...lines[0],
          label: 'Ramses, New Cairo',
        },
      ],
      labels,
      meta,
      (line) => line.label,
      () => 'Bus',
    );

    expect(csv).toContain('"Ramses, New Cairo"');
  });

  it('builds a printable HTML invoice for PDF save', () => {
    const html = invoicePrintHtml(
      lines,
      labels,
      meta,
      (line) => line.label || 'Extra trips',
      (line) => line.vehicleType || '—',
      (minor) => `${minor / 100} EGP`,
    );

    expect(html).toContain('dir="ltr"');
    expect(html).toContain('Client company invoice');
    expect(html).toContain('Maadi line');
    expect(html).toContain('4000 EGP');
    expect(html).toContain('Grand total');
    expect(html).toContain('6100 EGP');
  });
});
