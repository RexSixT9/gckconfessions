import type { Metadata } from "next";
import GuidelinesClient from "./GuidelinesClient";

export const metadata: Metadata = {
  title: "Privacy & Guidelines — GCK Confessions",
  description:
    "How we handle your privacy and the community guidelines for GCK Confessions.",
};

export default function GuidelinesPage() {
  return (
    <main className="flex-1">
      <GuidelinesClient />
    </main>
  );
}
