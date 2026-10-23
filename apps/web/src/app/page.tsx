import Link from 'next/link';
import { QrCode, Box, ChefHat, ReceiptText, LayoutDashboard, Smartphone, ArrowRight } from 'lucide-react';
import { DemoQr } from '@/components/landing/demo-qr';

const DEMO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true';

const steps = [
  { icon: QrCode, title: 'Scan the table', body: 'Guests scan the QR code on their table. No app to install.' },
  { icon: Box, title: 'See it in AR', body: 'Any dish with a 3D model can be placed on the real table, at real size.' },
  { icon: ReceiptText, title: 'Order & track', body: 'Orders go straight to the kitchen and guests watch the status live.' },
];

const forRestaurants = [
  { icon: ChefHat, title: 'Kitchen display', body: 'New orders appear instantly with a chime and timers.' },
  { icon: QrCode, title: 'Table QR codes', body: 'Print a code per table, close tables and settle bills.' },
  { icon: LayoutDashboard, title: 'Menu & analytics', body: 'Upload photos and 3D models, and track revenue and top dishes.' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-xl font-bold text-gray-900">
          Dine<span className="text-brand-500">View</span>
        </span>
        <Link href="/admin/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Restaurant login
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-8 lg:grid-cols-[1.2fr_1fr] lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100">
            <Box className="h-3.5 w-3.5" /> AR menus for restaurants
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            Let guests see the dish <span className="text-brand-500">on their table</span> before they order.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-gray-600">
            DineView turns your menu into an interactive, AR-ready ordering experience. Guests scan, preview dishes in 3D
            right on the table, and order from their phone. Your kitchen sees it instantly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {DEMO_ENABLED && (
              <Link href="/scan/demo" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base">
                Try the guest demo <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link href="/admin/login" className="btn-secondary px-6 py-3 text-base">
              Open the restaurant dashboard
            </Link>
          </div>
        </div>

        {DEMO_ENABLED && (
          <div className="flex flex-col items-center rounded-3xl bg-white/70 p-8 shadow-xl ring-1 ring-gray-100 backdrop-blur">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Smartphone className="h-4 w-4 text-brand-500" /> Scan with your phone
            </p>
            <p className="mb-5 text-center text-sm text-gray-500">Opens a demo table. Tap any dish marked AR.</p>
            <DemoQr />
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-gray-500">How it works for guests</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-gray-400">Step {i + 1}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-gray-500">For the restaurant</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {forRestaurants.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-gray-100 p-6">
              <Icon className="mb-3 h-5 w-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
