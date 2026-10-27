import Script from "next/script";
import { GTG_PATH } from "@/lib/gtg";
import { gtagConfigSnippet, gtmSnippet, tagKind } from "@/lib/snippets";

/** Loads GTM or gtag.js through the first-party gateway path. */
export function GoogleTag({ tagId }: { tagId: string }) {
  if (tagKind(tagId) === "gtm") {
    return (
      <Script id="gtm" strategy="beforeInteractive">
        {gtmSnippet(tagId)}
      </Script>
    );
  }
  return (
    <>
      <Script id="gtag-config" strategy="beforeInteractive">
        {gtagConfigSnippet(tagId)}
      </Script>
      <Script src={`${GTG_PATH}/`} strategy="beforeInteractive" />
    </>
  );
}

/** The gateway does not serve the noscript iframe; keep it on googletagmanager.com. */
export function GoogleTagNoscript({ tagId }: { tagId: string }) {
  if (tagKind(tagId) !== "gtm") return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(tagId)}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
