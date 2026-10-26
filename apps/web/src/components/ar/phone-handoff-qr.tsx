'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const DEMO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true';

function isTouchDevice() {
  return typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
}

/**
 * On a laptop, AR isn't available, so show a QR that opens this same dish on a
 * phone (joining the demo table first). Hidden on phones and tablets.
 */
export function PhoneHandoffQr({ path }: { path: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!DEMO_ENABLED || isTouchDevice()) return;
    const origin = APP_URL || window.location.origin;
    const url = `${origin}/scan/demo?next=${encodeURIComponent(path)}`;
    QRCode.toDataURL(url, { width: 220, margin: 1 }).then(setDataUrl).catch(() => setDataUrl(null));
  }, [path]);

  if (!dataUrl) return null;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-cream/10 bg-cream/[0.04] p-4">
      <img src={dataUrl} alt="QR code to open this dish on your phone" className="h-24 w-24 rounded-lg" />
      <div className="text-sm">
        <p className="flex items-center gap-1.5 font-semibold text-cream">
          <Smartphone className="h-4 w-4 text-ember" /> See it in AR on your phone
        </p>
        <p className="mt-1 text-cream/55">Scan with your phone camera to place this dish on a real table.</p>
      </div>
    </div>
  );
}
