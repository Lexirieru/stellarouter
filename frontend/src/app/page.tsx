import { ConnectWalletButton, Logo } from "@stellarouter/ui";
import { Playground } from "@/components/Playground";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-4">
        <Logo className="h-5 w-auto text-[var(--color-dark)]" />
        <ConnectWalletButton />
      </header>
      <Playground />
    </main>
  );
}
