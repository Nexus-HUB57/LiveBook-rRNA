"use client";

import Script from "next/script";

const GA4_MEASUREMENT_ID = "G-JMSH5LJ6GF";
const GTM_CONTAINER_ID = "G-JMSH5LJ6GF"; // GA4 acts as container reference

/**
 * Google Tag Manager + GA4 integration for Next.js.
 *
 * Uses next/script for optimal loading strategy:
 *   - dataLayer bootstrap runs inline (before paint)
 *   - gtag.js loads afterInteractive
 *   - GTM noscript fallback in body
 *
 * IDs extracted from moltbook.com GTM container runtime.
 */
export function GoogleTagManager() {
  return (
    <>
      {/* ── dataLayer bootstrap (runs before any tag fires) ── */}
      <Script id="gtm-datalayer" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        `}
      </Script>

      {/* ── GA4 config ── */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA4_MEASUREMENT_ID}', {
            send_page_view: true,
            cookie_flags: 'SameSite=None;Secure',
          });
        `}
      </Script>

      {/* ── GTM loader ── */}
      <Script id="gtm-loader" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){
            w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),
                dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');
        `}
      </Script>
    </>
  );
}

/**
 * GTM noscript fallback — must be placed as high as possible in <body>.
 * Fires for non-JS environments.
 */
export function GTMNoScript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="GTM"
      />
    </noscript>
  );
}