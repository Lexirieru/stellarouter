import { Playground } from "@/components/Playground";
import { GetStarted } from "@/components/GetStarted";

export default function Home() {
  return (
    <div>
      <div className="mx-auto w-full max-w-2xl px-6 pt-6">
        <GetStarted />
      </div>
      <Playground />
    </div>
  );
}
