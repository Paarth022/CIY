'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

// Wrap any page that requires the user to be signed in.
// While checking auth, renders a crafting loader.
export default function AuthGate({ children }) {
  const { user, ready } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/signup?next=${encodeURIComponent(pathname || '/create')}`);
    }
  }, [ready, user, router, pathname]);

  if (!ready || !user) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh]">
        <div className="mc-slot rounded-2xl p-10 text-center scanlines">
          <div className="loader mx-auto mb-4" />
          <div className="font-pixel text-[10px] tracking-[0.25em] text-primary/70">
            {ready ? 'REDIRECTING_TO_SIGNUP' : 'LOADING_CRAFTER_DATA'}
          </div>
        </div>
      </div>
    );
  }

  return children;
}
