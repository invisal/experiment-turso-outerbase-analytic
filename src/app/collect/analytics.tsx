"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function Analytic({ path }: { path: string }) {
  const pathName = usePathname();

  useEffect(() => {
    fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        referrer:
          document.referrer && !document.referrer.includes(window.location.host)
            ? document.referrer
            : undefined,
        path: pathName,
      }),
    })
      .then()
      .catch();
  }, [path, pathName]);

  return <></>;
}
