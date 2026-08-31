"use client";

// Floating feedback collector (product validation, Level 4). Posts to the
// gateway's /feedback endpoint with the connected wallet attached when present.

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useWallet } from "@stellarouter/ui";
import { GATEWAY } from "@/lib/gateway";

export function FeedbackWidget() {
  const { address } = useWallet();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function submit() {
    if (rating < 1 || text.trim().length < 3) {
      setState("error");
      setErrorMsg("Pick a rating and write at least a few words.");
      return;
    }
    setState("sending");
    try {
      const r = await fetch(`${GATEWAY}/feedback`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating, text: text.trim(), wallet: address ?? undefined, page: pathname }),
      });
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d.message || d.error || `HTTP ${r.status}`);
      setState("sent");
      setText("");
      setRating(0);
      setTimeout(() => { setOpen(false); setState("idle"); }, 1600);
    } catch (e) {
      setState("error");
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-72 rounded-2xl border border-black/10 bg-[var(--background,#f1efe9)] p-4 shadow-xl">
          <div className="text-sm font-semibold">How is Stellarouter?</div>
          <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={rating === n}
                onClick={() => setRating(n)}
                className={`text-xl transition-transform hover:scale-110 ${n <= rating ? "" : "opacity-30 grayscale"}`}
              >
                ⭐
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What worked? What broke? What's missing?"
            rows={3}
            className="mt-2 w-full resize-none rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40"
          />
          {state === "error" && (
            <p className="mt-1 text-xs text-red-600">{errorMsg}</p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">
              {address ? "Signed as your wallet" : "Anonymous"}
            </span>
            <button
              onClick={() => void submit()}
              disabled={state === "sending" || state === "sent"}
              className="rounded-full bg-[var(--color-darkblue)] px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {state === "sending" ? "Sending…" : state === "sent" ? "Thanks! ✓" : "Send"}
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-black/10 bg-[var(--color-darkblue)] px-4 py-2 text-sm font-medium text-white shadow-lg transition-opacity hover:opacity-90"
      >
        {open ? "Close" : "Feedback"}
      </button>
    </div>
  );
}
