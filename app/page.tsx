import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">🏆 MMA Fantasy League</h1>
      <p className="mb-6 text-gray-400">
        Welcome! Choose a section below:
      </p>
      <div className="flex flex-col gap-4">
        <Link
          href="/events"
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-lg text-white text-center"
        >
          View Events
        </Link>
        <Link
          href="/api/sync-all"
          className="bg-gray-700 hover:bg-gray-800 px-6 py-3 rounded-lg text-lg text-center"
        >
          Sync Latest UFC Data
        </Link>
      </div>
    </main>
  );
}
