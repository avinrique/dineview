'use client';

import { Box, CheckCircle2, Heart, QrCode, Ruler } from 'lucide-react';
import { ModelViewerAr } from '@/components/ar/model-viewer-ar';
import { StoryRing } from '@/components/customer/story-ring';
import { RestaurantAvatar } from '@/components/customer/restaurant-avatar';

function FloatingChip({ icon: Icon, title, body, className }: { icon: typeof Box; title: string; body: string; className: string }) {
  return (
    <div
      className={`absolute z-20 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1714]/90 px-4 py-3 text-white shadow-2xl backdrop-blur-xl animate-float ${className}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ig">
        <Icon className="h-4 w-4" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-white/60">{body}</span>
      </span>
    </div>
  );
}

/** Phone mock-up for the landing page, with the live 3D croissant as an Instagram-style post. */
export function PhonePreview() {
  return (
    <div className="relative mx-auto w-[290px] sm:w-[310px]">
      <div className="absolute -inset-12 rounded-full bg-ig opacity-25 blur-3xl" aria-hidden />
      <FloatingChip icon={Ruler} title="Real size" body="20 × 8 × 6 cm" className="-left-40 top-24 hidden sm:flex" />
      <FloatingChip icon={CheckCircle2} title="Kitchen accepted" body="Order #A41 · just now" className="-right-36 top-[44%] hidden sm:flex [animation-delay:1.5s]" />
      <FloatingChip icon={QrCode} title="Table 4 scanned" body="No app needed" className="-left-44 bottom-12 hidden sm:flex [animation-delay:3s]" />

      <div className="relative rounded-[3rem] border border-white/15 bg-[#121110] p-2.5 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white text-gray-900">
          <div className="absolute left-1/2 top-2.5 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" aria-hidden />
          <div className="flex items-center gap-2.5 px-4 pb-2.5 pt-11">
            <StoryRing className="h-8 w-8">
              <RestaurantAvatar name="Bella Vista" className="text-[10px]" />
            </StoryRing>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold">Bella Vista</p>
              <p className="text-[11px] text-gray-500">Bakery & Cakes</p>
            </div>
          </div>
          <div className="relative aspect-[4/5] bg-stage">
            <ModelViewerAr
              modelUrl="/models/dishes/croissant.glb"
              poster="/images/dishes/croissant.png"
              alt="Butter croissant in 3D"
              showArButton={false}
              showSize={false}
            />
            <span className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-ig px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
              <Box className="h-4 w-4" /> View on your table
            </span>
          </div>
          <div className="flex items-center gap-3.5 px-4 pt-3">
            <Heart className="h-6 w-6 fill-red-500 text-red-500" />
            <Box className="h-6 w-6" />
            <span className="ml-auto font-bold">$4.50</span>
          </div>
          <p className="px-4 pb-6 pt-1.5 text-[13px]">
            <span className="font-semibold">Butter Croissant</span> <span className="text-gray-600">Flaky, all-butter, baked every morning</span>
          </p>
        </div>
      </div>
    </div>
  );
}
