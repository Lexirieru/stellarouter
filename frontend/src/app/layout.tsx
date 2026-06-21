import type { Metadata } from "next";
import { WalletProvider, CursorBubble, ConnectWalletButton } from "@stellarouter/ui";
import { ConsoleNav } from "@/components/ConsoleNav";
import "@stellarouter/ui/brand.css";
import "@stellarouter/ui/cursor.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stellarouter — Console",
  description: "Stellarouter app: connect wallet, top up USDC, and use any LLM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <CursorBubble />
        <WalletProvider>
          <div className="flex min-h-screen">
            <ConsoleNav />
            <div className="flex flex-1 flex-col">
              <header className="flex items-center justify-end border-b border-black/10 px-6 py-3">
                <ConnectWalletButton />
              </header>
              <main className="flex flex-1 flex-col">{children}</main>
            </div>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
