import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Dine<span className="text-brand-500">View</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          QR-based restaurant ordering with immersive AR menu experience
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/admin/login" className="btn-primary text-lg">
            Admin Login
          </Link>
          <Link href="/scan/demo" className="btn-secondary text-lg">
            Demo Scan
          </Link>
        </div>
      </div>
    </main>
  );
}
