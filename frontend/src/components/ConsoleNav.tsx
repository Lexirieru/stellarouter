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

export function ConsoleNav() {
  const pathname = usePathname();
  return (
    <aside className="flex w-52 shrink-0 flex-col gap-7 border-r border-black/10 p-5">
      <Link href="/" aria-label="Home">
        <Logo className="h-5 w-auto text-[var(--color-dark)]" />
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV.map((n) => {
          const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
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

      <div className="mt-auto">
        <ConnectWalletButton />
      </div>
    </aside>
  );
}
