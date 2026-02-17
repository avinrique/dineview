'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { scanQrCode } from '@/lib/api-client';
import { useSession } from '@/hooks/use-session';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const { setSession } = useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.token as string;
    if (!token) return;

    scanQrCode(token)
      .then((res) => {
        setSession({
          sessionToken: res.data.sessionToken,
          restaurant: res.data.restaurant,
          table: res.data.table,
          session: res.data.session,
        });
        router.push('/menu');
      })
      .catch((err) => {
        setError(err.message || 'Invalid QR code');
      });
  }, [params.token, router, setSession]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid QR Code</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => window.history.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-lg text-gray-600">Setting up your table...</p>
      </div>
    </div>
  );
}
