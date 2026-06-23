import { Suspense } from "react";
import CallClient from "./CallClient";

export default function CallPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-dark flex items-center justify-center">
          Loading call...
        </main>
      }
    >
      <CallClient />
    </Suspense>
  );
}