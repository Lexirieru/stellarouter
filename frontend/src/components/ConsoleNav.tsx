"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, ConnectWalletButton } from "@stellarouter/ui";

const NAV = [
  { href: "/", label: "Playground" },
  { href: "/models", label: "Models" },
  { href: "/credits", label: "Credits" },
  { href: "/keys", label: "API Keys" },
  { href: "/logs", label: "Logs" },
];

// Mobile (<md): top bar — logo + wallet on the first row, horizontally scrolling nav.
// Desktop (md+): the sidebar as before.
export function ConsoleNav() {
  const pathname = usePathname();
  return (
    <aside className="flex w-full shrink-0 flex-col gap-3 border-b border-black/10 p-4 md:h-full md:w-52 md:gap-7 md:border-b-0 md:border-r md:p-5">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" aria-label="Home">
          <Logo className="h-5 w-auto text-[var(--color-dark)]" />
        </Link>
        <div className="md:hidden">
          <ConnectWalletButton />
        </div>
      </div>
      <nav className="-mx-1 flex flex-row gap-1 overflow-x-auto px-1 md:mx-0 md:flex-col md:overflow-visible md:px-0">
        {NAV.map((n) => {
          const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-[var(--color-darkblue)] text-white"
                  : "hover:bg-black/[.05]"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden md:block">
        <ConnectWalletButton />
      </div>
    </aside>
  );
}
