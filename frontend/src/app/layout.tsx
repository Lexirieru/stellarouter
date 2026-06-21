import type { Metadata } from "next";
import { WalletProvider, CursorBubble } from "@stellarouter/ui";
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
      <body className="h-full">
        <CursorBubble />
        <WalletProvider>
          <div className="flex h-screen overflow-hidden">
            <ConsoleNav />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
