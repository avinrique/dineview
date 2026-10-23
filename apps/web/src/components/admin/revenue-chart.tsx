'use client';

import { useMemo, useState } from 'react';
import { formatPrice } from '@/lib/utils';

export interface RevenuePoint {
  date: string; // YYYY-MM-DD
  totalRevenue: number;
  totalOrders: number;
}

// Single-series column chart. Bar color is brand-600, validated for ≥3:1
// contrast against the white card surface (brand-500 is too light).
const BAR = '#ea580c';
const BAR_HOVER = '#c2410c';

function niceStep(max: number, ticks = 4) {
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
}

function compactMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function dayLabel(date: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString('en-US', opts);
}

export function RevenueChart({ data, currency, height = 200 }: { data: RevenuePoint[]; currency: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const { ticks, top, peakIndex } = useMemo(() => {
    const max = Math.max(0, ...data.map((d) => d.totalRevenue));
    if (max === 0) return { ticks: [0], top: 1, peakIndex: -1 };
    const step = niceStep(max);
    const top = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
    return { ticks, top, peakIndex: data.findIndex((d) => d.totalRevenue === max) };
  }, [data]);

  const total = data.reduce((s, d) => s + d.totalRevenue, 0);
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div>
      <div className="flex">
        {/* Y axis */}
        <div className="relative mr-2 w-12 shrink-0 text-right text-[11px] text-gray-400" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t / top) * 100}%` }}>
              {compactMoney(t, currency)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
            {/* Gridlines: hairline, solid, recessive */}
            {ticks.map((t) => (
              <div key={t} className="absolute inset-x-0 h-px bg-gray-100" style={{ top: `${(1 - t / top) * 100}%` }} />
            ))}

            <div className="absolute inset-0 flex items-end gap-[2px]">
              {data.map((d, i) => {
                const pct = (d.totalRevenue / top) * 100;
                const active = hover === i;
                return (
                  <div
                    key={d.date}
                    className="relative flex h-full flex-1 cursor-default items-end justify-center"
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    tabIndex={0}
                    aria-label={`${dayLabel(d.date)}: ${formatPrice(d.totalRevenue, currency)}, ${d.totalOrders} orders`}
                  >
                    {d.totalRevenue > 0 && (
                      <div
                        className="w-full max-w-[24px] rounded-t transition-colors"
                        style={{ height: `${Math.max(pct, 1)}%`, backgroundColor: active ? BAR_HOVER : BAR }}
                      />
                    )}
                    {i === peakIndex && hover === null && (
                      <span
                        className="pointer-events-none absolute whitespace-nowrap text-[11px] font-semibold text-gray-700"
                        style={{ bottom: `calc(${pct}% + 4px)` }}
                      >
                        {compactMoney(d.totalRevenue, currency)}
                      </span>
                    )}
                    {active && (
                      <div
                        className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
                        style={{
                          bottom: `calc(${pct}% + 8px)`,
                          ...(i < data.length / 2 ? { left: 0 } : { right: 0 }),
                        }}
                      >
                        <p className="font-semibold">{dayLabel(d.date, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        <p>{formatPrice(d.totalRevenue, currency)}</p>
                        <p className="text-white/70">
                          {d.totalOrders} {d.totalOrders === 1 ? 'order' : 'orders'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* X axis: sparse date labels */}
          <div className="mt-2 flex gap-[2px] border-t border-gray-200 pt-1.5 text-[11px] text-gray-400">
            {data.map((d, i) => (
              <span key={d.date} className="flex-1 text-center">
                {i % labelEvery === 0 || i === data.length - 1 ? dayLabel(d.date) : ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          Total {formatPrice(total, currency)} · {data.reduce((s, d) => s + d.totalOrders, 0)} orders
        </span>
        <button onClick={() => setShowTable((v) => !v)} className="font-medium text-gray-600 hover:text-gray-900">
          {showTable ? 'Hide table' : 'View as table'}
        </button>
      </div>

      {showTable && (
        <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-gray-100">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 text-right font-medium">Orders</th>
                <th className="px-3 py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...data].reverse().map((d) => (
                <tr key={d.date}>
                  <td className="px-3 py-1.5 text-gray-700">{dayLabel(d.date, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{d.totalOrders}</td>
                  <td className="px-3 py-1.5 text-right font-medium text-gray-900">{formatPrice(d.totalRevenue, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
