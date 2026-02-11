'use client';

import { RolePreviewProvider } from '@/lib/RolePreviewContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <RolePreviewProvider>{children}</RolePreviewProvider>;
}
