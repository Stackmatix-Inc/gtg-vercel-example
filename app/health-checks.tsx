"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Check = { label: string; url: string };
type Status = "pending" | "ok" | "fail";

const CHECKS: Check[] = [
  { label: "Routing", url: "/metrics/healthy" },
  { label: "Geolocation headers", url: "/metrics/?validate_geo=healthy" },
];

async function runCheck(url: string): Promise<Status> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    return res.ok && (await res.text()).trim() === "ok" ? "ok" : "fail";
  } catch {
    return "fail";
  }
}

/** Calls Google's two gateway health endpoints through the proxy. */
export function HealthChecks() {
  const [statuses, setStatuses] = useState<Status[]>(CHECKS.map(() => "pending"));

  useEffect(() => {
    Promise.all(CHECKS.map((check) => runCheck(check.url))).then(setStatuses);
  }, []);

  return (
    <ul className={styles.checks}>
      {CHECKS.map((check, i) => (
        <li key={check.url}>
          <span className={styles[statuses[i]]}>{statuses[i]}</span>
          {check.label} - <a href={check.url}><code>{check.url}</code></a>
        </li>
      ))}
    </ul>
  );
}
