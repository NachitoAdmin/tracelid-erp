'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SaleForm from '@/components/SaleForm';

export default function OperatorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.user.role !== 'operator') {
        router.push('/');
        return;
      }
      setUser(data.user);
    };
    checkAuth();
  }, [router]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Tracelid - Operator View</h1>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
            className="text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </nav>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Enter Transaction</h2>
        <SaleForm tenantId={user.tenant.id} />
      </div>
    </div>
  );
}
