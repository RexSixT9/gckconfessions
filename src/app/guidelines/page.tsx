import type { Metadata } from "next";
import GuidelinesClient from "./GuidelinesClient";

export const metadata: Metadata = {
  title: "Privacy & Guidelines — GCK Confessions",
  description:
    "How privacy is handled and which community rules keep GCK Confessions safe for everyone.",
};

export default function GuidelinesPage() {
  return (
    <main className="flex-1">
      <GuidelinesClient />
    </main>
  );
}
