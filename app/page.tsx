import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#ff9d2e,#ff5b2f)] px-4 py-5">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 font-black text-white">
            C
          </div>
          <h1 className="m-0 text-lg font-black text-zinc-900 sm:text-xl">
            ChatterBox
          </h1>
        </div>

        <Link
          href="/auth/login"
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white no-underline"
        >
          Login
        </Link>
      </nav>

      <section className="mx-auto flex min-h-[calc(100vh-90px)] w-full max-w-5xl flex-col items-center justify-center text-center text-white">
        <div className="mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-white text-4xl font-black text-orange-500 shadow-xl">
          C
        </div>

        <p className="mb-4 rounded-full bg-white/20 px-4 py-2 text-sm font-bold">
          Chat • Call • Share
        </p>

        <h2 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
          Connect with your people easily.
        </h2>

        <p className="mt-5 max-w-xl text-base leading-7 text-white/90 sm:text-lg">
          Send messages, create groups, make calls, share files and locations in
          one simple app.
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:max-w-none sm:justify-center">
          <Link
            href="/auth/register"
            className="rounded-xl bg-white px-7 py-4 font-black text-orange-600 no-underline shadow-xl"
          >
            Create Account
          </Link>

          <Link
            href="/auth/login"
            className="rounded-xl border border-white/70 px-7 py-4 font-black text-white no-underline"
          >
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}