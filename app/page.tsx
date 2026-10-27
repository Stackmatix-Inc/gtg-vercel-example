import { GTG_PATH, readTagId } from "@/lib/gtg";
import { tagKind } from "@/lib/snippets";
import { HealthChecks } from "./health-checks";
import styles from "./page.module.css";

export default function Home() {
  const tagId = readTagId();
  return (
    <main id="main" className={styles.main}>
      <h1>Google tag gateway on Vercel</h1>
      <p>
        This site loads Google tags from <code>{GTG_PATH}/</code> on its own domain. A Next.js
        Route Handler forwards those requests to Google tag gateway and adds the visitor
        geolocation that Vercel provides.
      </p>

      <h2>Tag</h2>
      {tagId ? (
        <p>
          <code>{tagId}</code> ({tagKind(tagId) === "gtm" ? "Google Tag Manager" : "gtag.js"}) via{" "}
          <code>{tagId.toLowerCase()}.fps.goog</code>
        </p>
      ) : (
        <p className={styles.fail}>Set GTG_TAG_ID to a G-, GT-, GTM-, AW- or DC- tag ID.</p>
      )}

      <h2>Health checks</h2>
      <HealthChecks />
      <p>
        The geolocation check fails on <code>localhost</code>: only Vercel adds the visitor geo
        headers.
      </p>

      <h2>Request flow</h2>
      <pre className={styles.flow}>{`browser -> ${GTG_PATH}/*          (your domain, Vercel)
        -> app/metrics/[[...path]]/route.ts
           + Host: <tag-id>.fps.goog
           + X-Forwarded-CountryRegion / Country / Region / Geolocation
           + X-Forwarded-For: <client IP>
        -> https://<tag-id>.fps.goog${GTG_PATH}/*  (Google)`}</pre>
    </main>
  );
}
