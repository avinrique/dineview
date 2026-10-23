'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** QR code that opens the demo table, built from whatever URL the page is served on. */
export function DemoQr({ size = 220 }: { size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const origin = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/+$/, '');
    const target = `${origin}/scan/demo`;
    setUrl(target);
    QRCode.toDataURL(target, { width: size * 2, margin: 1 }).then(setDataUrl).catch(() => setDataUrl(null));
  }, [size]);

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-2xl bg-white p-3 shadow-lg ring-1 ring-gray-100" style={{ width: size + 24, height: size + 24 }}>
        {dataUrl && <img src={dataUrl} alt="Scan to open the demo menu" width={size} height={size} />}
      </div>
      <p className="mt-2 max-w-[260px] break-all text-center text-[11px] text-gray-400">{url}</p>
    </div>
  );
}
