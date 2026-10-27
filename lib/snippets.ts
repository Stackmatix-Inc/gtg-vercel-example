import { GTG_PATH } from "@/lib/gtg";

export type TagKind = "gtm" | "gtag";

export function tagKind(tagId: string): TagKind {
  return tagId.toUpperCase().startsWith("GTM-") ? "gtm" : "gtag";
}

/** Google's GTM head snippet with the script URL moved to the first-party path. */
export function gtmSnippet(tagId: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'${GTG_PATH}/?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${JSON.stringify(tagId)});`;
}

/** Standard gtag.js config; the library itself loads from `${GTG_PATH}/`. */
export function gtagConfigSnippet(tagId: string): string {
  return `window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config',${JSON.stringify(tagId)});`;
}
