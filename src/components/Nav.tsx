"use client";

import { useEffect, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile account menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
        className={`whitespace-nowrap rounded-lg px-1.5 py-1 text-xs font-medium transition sm:px-3 sm:py-1.5 sm:text-sm ${
          active ? "bg-ink text-white" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        {label}
      </Link>
    );
  };

  // Tour / account content shared between the always-visible desktop bar and
  // the mobile dropdown — only the layout direction differs between the two.
  const accountContent = (stacked: boolean) => (
    <div className={stacked ? "flex flex-col items-stretch gap-2" : "flex items-center gap-2"}>
      <button
        onClick={openTutorial}
        className={`rounded-full border-2 border-ink bg-white px-2 py-0.5 font-pixel text-[9px] uppercase text-ink shadow-pixelSm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${
          stacked ? "text-center" : ""
        }`}
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
            className={`rounded-full px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-ink ${
              stacked ? "text-center" : ""
            }`}
            title="Log out"
          >
            Log out
          </button>
        </>
      ) : (
        <Link
          href="/join"
          className="rounded-full border-2 border-ink bg-dhlYellow px-3 py-1 text-center font-pixel text-[10px] text-ink shadow-pixelSm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
        >
          Log in / Join
        </Link>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-20 border-b-[3px] border-ink bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 tracking-tight text-ink"
        >
          <span className="text-xl">🏃‍♀️</span>
          <span className="font-pixel text-[11px] uppercase leading-tight sm:text-xs">
            <span className="sm:hidden">DHL</span>
            <span className="hidden sm:inline">
              Den Hurtigste Løber (DHL)
              <br />
              <span className="ml-1">Thursday Challenge</span>
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1">
          {link("/", "Dashboard")}
          {link("/log", "Log a run", "nav-log")}
          {link("/admin", "Admin")}
        </nav>

        <div className="hidden shrink-0 items-center justify-end sm:flex">
          {accountContent(false)}
        </div>

        {/* Mobile account menu — the desktop bar above is hidden below sm:,
            so this is the only way phone users can see who's logged in,
            log out, or open the tour. */}
        <div className="relative sm:hidden">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink shadow-pixelSm"
            style={{
              background: data?.team ? data.team.colorHex : "white",
            }}
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            {data?.team ? (
              <span className="text-base">{characterEmoji(data.team.character)}</span>
            ) : (
              <span className="text-base">👤</span>
            )}
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-30 mt-2 w-56 rounded-md border-[3px] border-ink bg-white p-3 shadow-pixel"
              onClick={() => setMenuOpen(false)}
            >
              {accountContent(true)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
