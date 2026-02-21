"use client";
import { useEffect, useState, type PropsWithChildren } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useHasActiveAiKey, useAiStore } from "@/store/ai-store";

type RequireAiKeyProps = PropsWithChildren<{
  fallback: string;
}>;

export default function RequireAiKey({
  children,
  fallback,
}: RequireAiKeyProps) {
  const hasKey = useHasActiveAiKey();
  const router = useRouter();
  const pathname = usePathname();

  const [hydrated, setHydrated] = useState(() => {
    return useAiStore.persist?.hasHydrated?.() ?? false;
  });

  useEffect(() => {
    if (hydrated) return;

    const unsub = useAiStore.persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });

    return () => unsub?.();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || hasKey || pathname === fallback) return;
    const params = new URLSearchParams();
    if (pathname) {
      params.set("from", pathname);
    }
    router.replace(`${fallback}?${params.toString()}`);
  }, [fallback, hasKey, hydrated, pathname, router]);

  if (!hydrated || !hasKey) {
    return null;
  }

  return children;
}
