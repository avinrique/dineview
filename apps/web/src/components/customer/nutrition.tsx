import { cn } from '@/lib/utils';

interface NutritionRecord {
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatsG?: number | null;
  fiberG?: number | null;
  sugarG?: number | null;
  sodiumMg?: number | null;
}

const num = (v: number | null | undefined) => (v == null ? null : Number(v));

/** Calories plus the macros a guest scans for, skipping anything not recorded. */
function factsOf(n: NutritionRecord | null | undefined) {
  if (!n) return null;
  const macros = [
    { label: 'Protein', value: num(n.proteinG) },
    { label: 'Carbs', value: num(n.carbsG) },
    { label: 'Fat', value: num(n.fatsG) },
    { label: 'Sugar', value: num(n.sugarG) },
    { label: 'Fibre', value: num(n.fiberG) },
  ].filter((m): m is { label: string; value: number } => m.value != null);
  const kcal = num(n.calories);
  return kcal == null && macros.length === 0 ? null : { kcal, macros, sodiumMg: num(n.sodiumMg) };
}

export function hasNutrition(n: NutritionRecord | null | undefined) {
  return factsOf(n) != null;
}

/** One line of calories and macros, for the swipe view. */
export function MacroRow({ nutrition, className }: { nutrition: NutritionRecord | null | undefined; className?: string }) {
  const facts = factsOf(nutrition);
  if (!facts) return null;
  const cells = [
    ...(facts.kcal != null ? [{ label: 'Kcal', value: String(facts.kcal), accent: true }] : []),
    ...facts.macros.slice(0, 3).map((m) => ({ label: m.label, value: `${m.value} g`, accent: false })),
  ];
  return (
    <dl className={cn('grid border-y border-cream/10', className)} style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
      {cells.map((c, i) => (
        <div key={c.label} className={cn('py-2', i > 0 && 'border-l border-cream/10 pl-3')}>
          <dt className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-cream/45">{c.label}</dt>
          <dd className={cn('mt-0.5 font-mono text-[15px] tabular-nums', c.accent ? 'text-ember' : 'text-cream')}>{c.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Calories in large type with a bar per macro, for the dish page. */
export function NutritionPanel({ nutrition }: { nutrition: NutritionRecord | null | undefined }) {
  const facts = factsOf(nutrition);
  if (!facts) return null;
  // Bars share one scale so they compare at a glance
  const max = Math.max(60, ...facts.macros.map((m) => m.value));
  return (
    <div>
      {facts.kcal != null && (
        <p className="flex items-baseline gap-2">
          <span className="font-display text-6xl font-medium leading-none tracking-[-0.03em] tabular-nums">{facts.kcal}</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ember">kcal</span>
        </p>
      )}
      <ul className="mt-6 space-y-4">
        {facts.macros.map((m) => (
          <li key={m.label}>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/60">{m.label}</span>
              <span className="font-mono text-sm tabular-nums">{m.value} g</span>
            </div>
            <div className="mt-1.5 h-px bg-cream/15">
              <div className="h-full bg-ember" style={{ width: `${(m.value / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {facts.sodiumMg != null && (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-cream/45">Sodium {facts.sodiumMg} mg</p>
      )}
    </div>
  );
}
