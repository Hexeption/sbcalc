import type { Metadata } from "next";
import { SkyblockCalculatorClient } from "@/components/skyblock-calculator-client";
import { generateMetadata as createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata();

export default function Page() {
  return (
    <div>
      <SkyblockCalculatorClient />
    </div>
  );
}
