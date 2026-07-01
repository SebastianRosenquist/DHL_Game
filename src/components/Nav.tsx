"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { characterEmoji } from "@/lib/characters";
import { apiSend, fetcher } from "@/lib/fetcher";

type Me = {
  user: { id: string; name: string } | null;
  team: { name: string; character: string; colorHex: string } | null;
  admin: boolean;
};

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useSWR<Me>("/api/me", fetcher);

  async function logout() {
    // Clears the session cookie only — the account stays in the database.
    await apiSend("/api/me", "DELETE");
    await mutate("/api/me");
    router.push("/join");
  }

  const link = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          active ? "bg-ink text-white" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="text-xl">🏃‍♀️</span>
          <span>Team Run Challenge</span>
        </Link>

        <nav className="flex items-center gap-1">
          {link("/", "Dashboard")}
          {link("/log", "Log a run")}
          {link("/admin", "Admin")}
        </nav>

        <div className="hidden min-w-[120px] items-center justify-end gap-2 sm:flex">
          {data?.user && data.team ? (
            <>
              <Link
                href="/log"
                className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
                style={{ borderColor: data.team.colorHex }}
              >
                <span>{characterEmoji(data.team.character)}</span>
                <span className="font-medium">{data.user.name}</span>
              </Link>
              <button
                onClick={logout}
                className="rounded-full px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-ink"
                title="Log out"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/join"
              className="rounded-full bg-dhlYellow px-3 py-1 text-sm font-semibold text-ink"
            >
              Log in / Join
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
