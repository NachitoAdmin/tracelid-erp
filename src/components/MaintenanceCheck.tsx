'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const OWNER_EMAIL = 'nachitobot888@gmail.com';

export default function MaintenanceCheck({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Skip check for login and maintenance pages
    if (pathname === '/login' || pathname === '/maintenance') {
      return;
    }

    // Check localStorage for user
    const userStr = localStorage.getItem('tracelid-user');
    
    if (!userStr) {
      // Not logged in, redirect to login
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // If user email is not the owner, redirect to maintenance
      if (user.email !== OWNER_EMAIL) {
        router.push('/maintenance');
      }
    } catch {
      // Invalid user data, redirect to login
      router.push('/login');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
