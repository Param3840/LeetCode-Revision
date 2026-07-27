"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RevisionRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center text-zinc-500 text-xs">
      <span>Redirecting to revision library...</span>
    </div>
  );
}
