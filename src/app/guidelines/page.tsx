import type { Metadata } from "next";
import GuidelinesClient from "./GuidelinesClient";

export const metadata: Metadata = {
  title: "Privacy and Guidelines — GCK Confessions",
  description: "Anonymity, moderation standards, and posting rules for safe sharing.",
};

export default function GuidelinesPage() {
  return (
    <main className="flex-1">
      <GuidelinesClient />
    </main>
  );
}
