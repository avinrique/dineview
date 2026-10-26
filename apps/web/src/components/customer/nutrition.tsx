import { cn } from '@/lib/utils';

export interface NutritionRecord {
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

/** Calories in large type with a bar per macro: the dish page, or `compact` in a pop-up panel. */
export function NutritionPanel({ nutrition, compact }: { nutrition: NutritionRecord | null | undefined; compact?: boolean }) {
  const facts = factsOf(nutrition);
  if (!facts) return null;
  // Bars share one scale so they compare at a glance
  const max = Math.max(60, ...facts.macros.map((m) => m.value));
  return (
    <div>
      {facts.kcal != null && (
        <p className="flex items-baseline gap-2">
          <span className={cn('font-display font-medium leading-none tracking-[-0.03em] tabular-nums', compact ? 'text-5xl' : 'text-6xl')}>
            {facts.kcal}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ember">kcal</span>
        </p>
      )}
      <ul className={compact ? 'mt-4 space-y-3' : 'mt-6 space-y-4'}>
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
        <p className={cn('font-mono text-[11px] uppercase tracking-[0.2em] text-cream/45', compact ? 'mt-3' : 'mt-4')}>Sodium {facts.sodiumMg} mg</p>
      )}
    </div>
  );
}
