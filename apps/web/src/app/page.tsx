import Link from 'next/link';
import { ArrowRight, BarChart3, Box, Check, ChefHat, QrCode, ReceiptText, Sparkles, UploadCloud } from 'lucide-react';
import { DemoQr } from '@/components/landing/demo-qr';
import { PhonePreview } from '@/components/landing/phone-preview';

const DEMO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true';

const steps = [
  { icon: QrCode, title: 'Scan the table', body: 'Guests point their camera at the table’s QR code. No app, no sign-up.' },
  { icon: Box, title: 'See it on the table', body: 'Any dish with a 3D model appears right in front of them, at its real size.' },
  { icon: ReceiptText, title: 'Order & follow along', body: 'Orders land in the kitchen instantly, and guests watch each step live.' },
];

const showcase = [
  { name: 'Butter Croissant', image: '/images/dishes/croissant.png' },
  { name: 'Strawberry Chocolate Cake', image: '/images/dishes/strawberry-chocolate-cake.png' },
  { name: 'Afternoon Tea for Two', image: '/images/dishes/afternoon-tea.png' },
  { name: 'Carrot Cake', image: '/images/dishes/carrot-cake.png' },
  { name: 'Seasonal Fruit Bowl', image: '/images/dishes/fruit-bowl.png' },
  { name: 'Italian Lemonade', image: '/images/dishes/lemonade.png' },
];

const features = [
  { icon: ChefHat, title: 'Kitchen display', body: 'New orders pop up with a chime, timers and one-tap status updates.' },
  { icon: QrCode, title: 'Table QR codes', body: 'Print a code per table, then close tables and settle bills in a tap.' },
  { icon: UploadCloud, title: '3D menu builder', body: 'Upload a photo and a 3D model and the dish is AR-ready on iPhone and Android.' },
  { icon: BarChart3, title: 'Live analytics', body: 'Revenue per day, best sellers and order volume, always up to date.' },
];

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${dark ? 'text-orange-300' : 'text-orange-600'}`}>{children}</p>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0a09] text-white">
      {/* Hero */}
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_75%_25%,rgba(249,115,22,0.22),transparent_70%),radial-gradient(40%_35%_at_15%_10%,rgba(236,72,153,0.14),transparent_70%)]"
        />
        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="text-xl font-bold tracking-tight">
            Dine<span className="bg-ig bg-clip-text text-transparent">View</span>
          </span>
          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#restaurants" className="hover:text-white">For restaurants</a>
          </nav>
          <Link href="/admin/login" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/10">
            Restaurant login
          </Link>
        </header>

        <section className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 pb-24 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:pb-32 lg:pt-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-orange-300" /> AR menus · no app needed
            </span>
            <h1 className="mt-6 font-display text-[3.4rem] font-medium leading-[1] tracking-tight sm:text-7xl lg:text-[5.5rem]">
              Your menu,
              <br />
              <em className="bg-ig bg-clip-text pr-2 text-transparent">on the table.</em>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-white/60">
              Guests scan the table, see every dish in 3D at its real size right in front of them, and order from their phone.
              Your kitchen has it a second later.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {DEMO_ENABLED && (
                <Link
                  href="/scan/demo"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-gray-900 transition hover:bg-white/90"
                >
                  Try the live demo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
              )}
              <Link href="/admin/login" className="rounded-full border border-white/15 px-6 py-3.5 font-semibold transition hover:bg-white/10">
                Restaurant dashboard
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50">
              {['iPhone & Android', 'Real-size AR', 'Live kitchen updates'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-orange-300" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <PhonePreview />
        </section>
      </div>

      {/* Try it */}
      {DEMO_ENABLED && (
        <section className="relative mx-auto max-w-6xl px-6 pb-24">
          <div className="grid items-center gap-10 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-8 md:grid-cols-[auto_1fr] md:gap-14 md:p-12">
            <DemoQr size={200} />
            <div>
              <Eyebrow dark>Try it now</Eyebrow>
              <h2 className="mt-3 font-display text-4xl font-medium leading-tight md:text-5xl">Point your phone camera at the code.</h2>
              <p className="mt-4 max-w-md text-white/60">
                It opens a demo table. Tap a dish with the <Box className="inline h-4 w-4 -translate-y-px" /> icon, then
                “View on your table”.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* How it works + showcase */}
      <section id="how" className="bg-[#faf8f5] text-gray-900">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-medium leading-tight md:text-5xl">
            From QR code to kitchen in three taps.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="rounded-3xl bg-white p-7 shadow-[0_2px_30px_rgba(0,0,0,0.05)] ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ig text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-5xl font-medium text-gray-200">0{i + 1}</span>
                </div>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 leading-relaxed text-gray-600">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-24 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>The demo menu</Eyebrow>
              <h2 className="mt-3 font-display text-4xl font-medium leading-tight md:text-5xl">Every dish, in 3D.</h2>
            </div>
            <p className="max-w-sm text-gray-600">Photoreal scans at true scale, so a croissant looks like a croissant on your table.</p>
          </div>
          <div className="-mx-6 mt-10 flex snap-x gap-4 overflow-x-auto px-6 pb-4 scrollbar-none">
            {showcase.map((dish) => (
              <Link
                key={dish.name}
                href={DEMO_ENABLED ? '/scan/demo' : '#how'}
                className="group w-60 shrink-0 snap-start overflow-hidden rounded-3xl bg-white ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-square bg-stage">
                  <img src={dish.image} alt={dish.name} className="h-full w-full object-contain p-6 drop-shadow-xl transition group-hover:scale-105" />
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
                    <Box className="h-4 w-4" />
                  </span>
                </div>
                <p className="px-5 py-4 font-semibold">{dish.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For restaurants */}
      <section id="restaurants" className="relative">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-24 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow dark>For restaurants</Eyebrow>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight md:text-5xl">Everything the floor and kitchen need.</h2>
            <p className="mt-5 max-w-md leading-relaxed text-white/60">
              One dashboard for the menu, the tables and the kitchen. Staff see orders, waiter calls and bill requests the
              moment guests send them.
            </p>
            <Link href="/admin/login" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-gray-900 hover:bg-white/90">
              Open the dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <Icon className="h-6 w-6 text-orange-300" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-white/40">
          <span>DineView · AR menus for restaurants</span>
          <Link href="/admin/login" className="hover:text-white">Restaurant login</Link>
        </div>
      </footer>
    </main>
  );
}
