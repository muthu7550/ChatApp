import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
      <section className="max-w-4xl text-center">
        <div className="inline-flex rounded-full border border-emerald-400/30 px-4 py-2 text-emerald-300 mb-6">
          WhatsApp ah? illa boss... ChatterBox Pro Max
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight">
          Real-time chat, calls, files, location — all in one.
        </h1>

        <p className="mt-6 text-zinc-400 text-lg">
          Production-ready chat app with MongoDB, LiveKit, file uploads,
          realtime messaging, video call, audio call and clean architecture.
        </p>

        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-black"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-xl border border-zinc-700 px-6 py-3 font-bold"
          >
            Create Account
          </Link>
        </div>
      </section>
    </main>
  );
}