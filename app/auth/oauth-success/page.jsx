"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OAuthSuccessContent />
    </Suspense>
  );
}

function OAuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userText = searchParams.get("user");

    if (!token || !userText) {
      router.replace("/auth/login");
      return;
    }

    const user = JSON.parse(decodeURIComponent(userText));

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    document.cookie = `token=${token}; path=/; max-age=604800`;

    router.replace(user?.avatar ? "/chat" : "/profile");
  }, [router, searchParams]);

  return <Loading />;
}

function Loading() {
  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div className="spinner-border text-warning mb-3" />
        <h5 className="fw-bold">Signing you in...</h5>
      </div>
    </main>
  );
}