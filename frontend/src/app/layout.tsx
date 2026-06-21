import type { Metadata } from "next";
import { WalletProvider, CursorBubble } from "@stellarouter/ui";
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
      <body className="min-h-full flex flex-col">
        <CursorBubble />
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
