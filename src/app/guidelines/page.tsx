import type { Metadata } from "next";
import GuidelinesClient from "./GuidelinesClient";

export const metadata: Metadata = {
  title: "Privacy & Guidelines — GCK Confessions",
  description: "Privacy basics and posting rules for safe, anonymous sharing.",
};

export default function GuidelinesPage() {
  return (
    <main className="flex-1">
      <GuidelinesClient />
    </main>
  );
}
