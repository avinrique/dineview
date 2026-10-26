'use client';

import { useState } from 'react';
import { Flame, Wheat, X } from 'lucide-react';
import { ALLERGEN_LABELS } from '@dineview/shared';
import { cn } from '@/lib/utils';
import { NutritionPanel, hasNutrition, type NutritionRecord } from '@/components/customer/nutrition';

export interface DishFactsData {
  nutrition?: NutritionRecord | null;
  /** Main ingredients first. */
  ingredients: string[];
  allergens: string[];
}

/** What a guest can pull up about a dish, from a menu dish record. */
export function factsFor(dish: any): DishFactsData {
  return {
    nutrition: dish.nutrition,
    ingredients: [...(dish.ingredients || [])]
      .sort((a: any, b: any) => Number(b.isPrimary) - Number(a.isPrimary))
      .map((i: any) => i.name),
    allergens: (dish.allergens || []).map((a: any) => (ALLERGEN_LABELS as any)[a.allergen] ?? a.allergen),
  };
}

type Panel = 'nutrition' | 'ingredients';

interface DishFactsProps {
  facts: DishFactsData;
  /** Open the panel above the buttons (dish stage) or below them (top of the AR view). */
  placement?: 'above' | 'below';
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Nutrition and Ingredients buttons over the 3D dish or the AR camera. Nothing
 * shows until the guest taps one; each opens a small panel.
 */
export function DishFacts({ facts, placement = 'above', align = 'left', className }: DishFactsProps) {
  const [open, setOpen] = useState<Panel | null>(null);
  const tabs = [
    ...(hasNutrition(facts.nutrition) ? [{ id: 'nutrition' as const, label: 'Nutrition', icon: Flame }] : []),
    ...(facts.ingredients.length > 0 || facts.allergens.length > 0
      ? [{ id: 'ingredients' as const, label: 'Ingredients', icon: Wheat }]
      : []),
  ];
  if (tabs.length === 0) return null;

  const panel = open && (
    <div className="pointer-events-auto min-h-0 w-[min(19rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-cream/15 bg-ink/80 p-4 text-cream shadow-2xl backdrop-blur-xl animate-fade-in">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/50">
          {open === 'nutrition' ? 'Per serving' : 'Made with'}
        </span>
        <button onClick={() => setOpen(null)} aria-label="Close" className="-m-1 p-1 text-cream/60">
          <X className="h-4 w-4" />
        </button>
      </div>
      {open === 'nutrition' ? (
        <NutritionPanel nutrition={facts.nutrition} compact />
      ) : (
        <>
          <ol>
            {facts.ingredients.map((name, i) => (
              <li key={name} className="flex items-baseline gap-3 border-b border-cream/10 py-2 last:border-0">
                <span className="font-mono text-[11px] text-ember">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-display text-lg leading-tight">{name}</span>
              </li>
            ))}
          </ol>
          {facts.allergens.length > 0 && (
            <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-cream/55">
              Contains {facts.allergens.join(' · ')}
            </p>
          )}
        </>
      )}
    </div>
  );

  return (
    <div
      // Taps here must not place the dish in AR, and drags must not turn it
      data-ar-ui
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className={cn(
        'pointer-events-none flex flex-col gap-2',
        placement === 'above' ? 'justify-end' : 'justify-start',
        align === 'right' ? 'items-end' : 'items-start',
        className,
      )}
    >
      {placement === 'above' && panel}
      <div className="pointer-events-auto flex shrink-0 gap-1.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setOpen((o) => (o === id ? null : id))}
            aria-expanded={open === id}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur-md transition-colors',
              open === id ? 'bg-cream text-ink' : 'border border-cream/20 bg-ink/55 text-cream',
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>
      {placement === 'below' && panel}
    </div>
  );
}
