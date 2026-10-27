import type { Metadata } from "next";
import { readTagId } from "@/lib/gtg";
import { GoogleTag, GoogleTagNoscript } from "./google-tag";
import "./globals.css";

export const metadata: Metadata = {
  title: "Google tag gateway on Vercel",
  description: "Example: serve Google tags from a first-party path with a Next.js Route Handler.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const tagId = readTagId();
  return (
    <html lang="en">
      <body>
        {tagId && <GoogleTagNoscript tagId={tagId} />}
        {tagId && <GoogleTag tagId={tagId} />}
        {children}
      </body>
    </html>
  );
}
