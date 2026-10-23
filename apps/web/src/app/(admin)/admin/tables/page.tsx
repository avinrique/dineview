'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { AlertTriangle, Download, Maximize2, Plus, Printer, RefreshCw, Trash2, X, ExternalLink } from 'lucide-react';
import { hasPermission, type UserRole } from '@dineview/shared';
import {
  useGetTablesQuery,
  useCreateTableMutation,
  useDeleteTableMutation,
  useGenerateQrMutation,
  useRegenerateQrMutation,
  useUpdateTableMutation,
  useCloseTableSessionMutation,
} from '@/store/api/admin-api';
import { useAppDispatch, useAppSelector } from '@/store';
import { notify } from '@/store/slices/ui-slice';
import { useAdminCurrency } from '@/hooks/use-admin-currency';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatPrice, cn } from '@/lib/utils';

function appOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/+$/, '');
}

function scanUrl(token: string) {
  return `${appOrigin()}/scan/${token}`;
}

function useQrDataUrl(text: string | null, width = 512) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!text) return setUrl(null);
    QRCode.toDataURL(text, { width, margin: 1, errorCorrectionLevel: 'M' }).then(setUrl).catch(() => setUrl(null));
  }, [text, width]);
  return url;
}

function QrModal({ label, url, onClose }: { label: string; url: string; onClose: () => void }) {
  const dataUrl = useQrDataUrl(url, 720);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex justify-end">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Scan to order</p>
        <h2 className="mb-4 text-3xl font-bold text-gray-900">Table {label}</h2>
        {dataUrl && <img src={dataUrl} alt={`QR code for table ${label}`} className="mx-auto w-full max-w-[320px]" />}
        <p className="mt-4 break-all text-xs text-gray-400">{url}</p>
      </div>
    </div>
  );
}

function TableCard({ table, canWrite, canClose }: { table: any; canWrite: boolean; canClose: boolean }) {
  const dispatch = useAppDispatch();
  const currency = useAdminCurrency();
  const [generateQr] = useGenerateQrMutation();
  const [regenerateQr, { isLoading: regenerating }] = useRegenerateQrMutation();
  const [updateTable] = useUpdateTableMutation();
  const [deleteTable] = useDeleteTableMutation();
  const [closeSession, { isLoading: closing }] = useCloseTableSessionMutation();
  const [enlarged, setEnlarged] = useState(false);

  const token: string | undefined = table.qrCodes?.[0]?.token;
  const url = useMemo(() => (token ? scanUrl(token) : null), [token]);
  const qr = useQrDataUrl(url);

  const session = table.tableSessions?.[0];
  const orders: any[] = session?.orders || [];
  const openOrders = orders.filter((o) => !['SERVED', 'PAID'].includes(o.status)).length;
  const tableTotal = orders.reduce((sum, o) => sum + Number(o.total), 0);

  async function run(action: () => Promise<any>, success: string) {
    try {
      await action();
      dispatch(notify('success', success));
    } catch (err: any) {
      dispatch(notify('error', err?.data?.message || 'Something went wrong'));
    }
  }

  function download() {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `table-${table.label}-qr.png`;
    a.click();
  }

  return (
    <div className={cn('card flex flex-col p-5', !table.isActive && 'opacity-60')}>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Table {table.label}</h3>
          <p className="text-sm text-gray-500">
            {table.capacity} seats{table.locationZone ? ` · ${table.locationZone}` : ''}
          </p>
        </div>
        {!table.isActive ? (
          <Badge>Disabled</Badge>
        ) : session ? (
          <Badge variant="warning">Occupied</Badge>
        ) : (
          <Badge variant="success">Free</Badge>
        )}
      </div>

      {qr && url ? (
        <div className="mb-3 flex items-center gap-3">
          <button onClick={() => setEnlarged(true)} className="group relative shrink-0" aria-label="Show large QR code">
            <img src={qr} alt={`QR for table ${table.label}`} className="h-28 w-28 rounded-lg ring-1 ring-gray-100" />
            <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition group-hover:opacity-100">
              <Maximize2 className="h-6 w-6 text-white" />
            </span>
          </button>
          <div className="min-w-0 space-y-1.5 text-sm">
            <button onClick={download} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
              <Download className="h-4 w-4" /> Download PNG
            </button>
            <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
              <ExternalLink className="h-4 w-4" /> Open as guest
            </a>
            {canWrite && (
              <button
                disabled={regenerating}
                onClick={() => {
                  if (confirm(`Replace the QR code for table ${table.label}? Printed copies of the old code will stop working.`)) {
                    run(() => regenerateQr(table.id).unwrap(), 'New QR code generated');
                  }
                }}
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="h-4 w-4" /> New code
              </button>
            )}
          </div>
        </div>
      ) : (
        canWrite && (
          <button onClick={() => run(() => generateQr(table.id).unwrap(), 'QR code generated')} className="btn-secondary mb-3 text-sm">
            Generate QR code
          </button>
        )
      )}

      {session && (
        <div className="mb-3 rounded-lg bg-gray-50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{orders.length} order(s){openOrders ? `, ${openOrders} in progress` : ''}</span>
            <span className="font-semibold">{formatPrice(tableTotal, currency)}</span>
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-1">
        {session && canClose && (
          <button
            disabled={closing}
            onClick={() => {
              if (confirm(`Close table ${table.label} and mark its orders as paid (${formatPrice(tableTotal, currency)})?`)) {
                run(() => closeSession(table.id).unwrap(), `Table ${table.label} closed`);
              }
            }}
            className="btn-primary flex-1 py-2 text-sm"
          >
            Close table & settle
          </button>
        )}
        {canWrite && (
          <>
            <button
              onClick={() => run(() => updateTable({ id: table.id, isActive: !table.isActive }).unwrap(), table.isActive ? 'Table disabled' : 'Table enabled')}
              className="btn-ghost px-3 py-2 text-sm"
            >
              {table.isActive ? 'Disable' : 'Enable'}
            </button>
            {!session && (
              <button
                onClick={() => {
                  if (confirm(`Delete table ${table.label}?`)) run(() => deleteTable(table.id).unwrap(), 'Table deleted');
                }}
                className="ml-auto rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete table"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      {enlarged && url && <QrModal label={table.label} url={url} onClose={() => setEnlarged(false)} />}
    </div>
  );
}

async function printQrSheet(tables: any[], restaurantName: string) {
  const entries = await Promise.all(
    tables
      .filter((t) => t.isActive && t.qrCodes?.[0]?.token)
      .map(async (t) => ({ label: t.label, img: await QRCode.toDataURL(scanUrl(t.qrCodes[0].token), { width: 600, margin: 1 }) })),
  );
  const w = window.open('', '_blank');
  if (!w) return;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  w.document.write(`<!doctype html><html><head><title>Table QR codes</title><style>
    body{font-family:system-ui,sans-serif;margin:0}
    .card{width:48%;display:inline-block;box-sizing:border-box;padding:28px;text-align:center;page-break-inside:avoid;border:1px dashed #ddd;margin:1%}
    img{width:70%}
    h2{margin:6px 0 0;font-size:28px} p{margin:0;color:#ea580c;font-weight:600;letter-spacing:.05em;text-transform:uppercase;font-size:12px}
    small{color:#888}
  </style></head><body>${entries
    .map((e) => `<div class="card"><p>Scan to see the menu &amp; order</p><img src="${e.img}"/><h2>Table ${esc(e.label)}</h2><small>${esc(restaurantName)}</small></div>`)
    .join('')}<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

export default function AdminTablesPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.admin.user);
  const role = (user?.role || 'WAITER') as UserRole;
  const canWrite = hasPermission(role, 'table:write');
  const canClose = hasPermission(role, 'session:close');
  const { data, isLoading } = useGetTablesQuery(undefined, { pollingInterval: 30000 });
  const [createTable, { isLoading: creating }] = useCreateTableMutation();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [zone, setZone] = useState('');
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    const host = new URL(appOrigin()).hostname;
    setIsLocalhost(host === 'localhost' || host === '127.0.0.1');
  }, []);

  const tables: any[] = data?.data || [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createTable({ label, capacity: Number(capacity), locationZone: zone || undefined }).unwrap();
      setLabel('');
      setCapacity('4');
      setZone('');
      setShowForm(false);
      dispatch(notify('success', `Table ${label} added. Generate its QR code below.`));
    } catch (err: any) {
      dispatch(notify('error', err?.data?.message || 'Could not create the table'));
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables & QR codes</h1>
          <p className="text-sm text-gray-500">Each table has its own QR code. Guests scan it to open the menu for that table.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => printQrSheet(tables, user?.restaurantName || '')} className="btn-secondary flex items-center gap-2">
            <Printer className="h-4 w-4" /> Print all
          </button>
          {canWrite && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add table
            </button>
          )}
        </div>
      </div>

      {isLocalhost && (
        <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            You’re on <strong>localhost</strong>, so these QR codes only work on this computer. Open the admin panel through
            the public demo link (or set <code>NEXT_PUBLIC_APP_URL</code>) to get codes that phones can scan.
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Label</label>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="input" placeholder="e.g. T7" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Seats</label>
              <input type="number" min={1} max={50} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Area</label>
              <input type="text" value={zone} onChange={(e) => setZone(e.target.value)} className="input" placeholder="e.g. Patio" />
            </div>
          </div>
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Adding…' : 'Add table'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <TableCard key={table.id} table={table} canWrite={canWrite} canClose={canClose} />
          ))}
        </div>
      )}
    </div>
  );
}
