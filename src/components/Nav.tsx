"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { characterEmoji } from "@/lib/characters";
import { apiSend, fetcher } from "@/lib/fetcher";
import { TUTORIAL_OPEN_EVENT } from "@/components/Tutorial";

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

  function openTutorial() {
    // If we're not on the dashboard, jump there — the Tutorial component only
    // mounts on the home page.
    if (pathname !== "/") {
      router.push("/");
      // Give the page a tick to mount before dispatching.
      setTimeout(
        () => window.dispatchEvent(new Event(TUTORIAL_OPEN_EVENT)),
        300,
      );
    } else {
      window.dispatchEvent(new Event(TUTORIAL_OPEN_EVENT));
    }
  }

  const link = (href: string, label: string, id?: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        id={id}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          active ? "bg-ink text-white" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-20 border-b-[3px] border-ink bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 tracking-tight text-ink"
        >
          <span className="text-xl">🏃‍♀️</span>
          <span className="font-pixel text-[11px] uppercase leading-tight sm:text-xs">
            Den Hurtigste Løber (DHL)
            <br className="hidden sm:inline" />
            <span className="sm:ml-1">Thursday Challenge</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {link("/", "Dashboard")}
          {link("/log", "Log activity", "nav-log")}
          {link("/admin", "Admin")}
        </nav>

        <div className="hidden min-w-[120px] items-center justify-end gap-2 sm:flex">
          <button
            onClick={openTutorial}
            className="rounded-full border-2 border-ink bg-white px-2 py-0.5 font-pixel text-[9px] uppercase text-ink shadow-pixelSm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            title="Replay tutorial"
          >
            ? Tour
          </button>
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
              className="rounded-full border-2 border-ink bg-dhlYellow px-3 py-1 font-pixel text-[10px] text-ink shadow-pixelSm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            >
              Log in / Join
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
