import { ConnectWalletButton } from "@stellarouter/ui";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
        <span className="text-lg font-semibold tracking-tight">stellarouter</span>
        <ConnectWalletButton />
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center gap-4 px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Console</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Connect your Stellar wallet to top up USDC and start calling any LLM.
          Playground coming next.
        </p>
      </section>
    </main>
  );
}
