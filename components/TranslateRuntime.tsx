"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; autoDisplay: boolean },
          elementId: string,
        ) => unknown;
      };
    };
  }
}

// Google's widget stays empty if its script arrives while the page is still starting up.
const LOAD_DELAY_MS = 2000;
const WATCH_INTERVAL_MS = 1000;
const SCRIPT_RETRY_MS = 6000;
const WATCH_LIMIT_MS = 30000;
const RELOAD_FLAG = "dhiltrip-translate-reloaded";
const SCRIPT_ID = "google-translate-script";
const NUDGE_ID = "dhiltrip-translate-nudge";
const NUDGE_DEBOUNCE_MS = 700;

let domPatched = false;

/**
 * Google Translate replaces text nodes, which makes React throw when it later
 * removes a node it no longer finds. These guards ignore those stale removals.
 */
function patchDomForTranslation() {
  if (domPatched) return;
  domPatched = true;

  const removeChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child) as T;
  };

  const insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    node: T,
    reference: Node | null,
  ): T {
    if (reference && reference.parentNode !== this) return node;
    return insertBefore.call(this, node, reference) as T;
  };
}

const selectedLanguage = () =>
  document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/)?.[1] ?? null;

const pageIsTranslated = () =>
  /translated-(ltr|rtl)/.test(document.documentElement.className);

function loadTranslator() {
  document.getElementById(SCRIPT_ID)?.remove();

  window.googleTranslateElementInit = () => {
    if (!window.google) return;
    new window.google.translate.TranslateElement(
      { pageLanguage: "en", autoDisplay: false },
      "google_translate_element",
    );
  };

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

/** Google can stop noticing new screens; adding a fresh hidden phrase makes it rescan the page. */
function nudgeTranslator() {
  document.getElementById(NUDGE_ID)?.remove();
  const nudge = document.createElement("span");
  nudge.id = NUDGE_ID;
  nudge.textContent = "Welcome to Dhil Trip";
  nudge.setAttribute("aria-hidden", "true");
  nudge.style.cssText =
    "position:fixed;left:0;bottom:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none";
  document.body.appendChild(nudge);
}

function isOwnChange(node: Node) {
  if (node.nodeName === "FONT" || (node as Element).id === NUDGE_ID) return true;
  return node.parentNode?.nodeName === "FONT";
}

function watchForNewContent() {
  let timer: number | undefined;
  const observer = new MutationObserver((records) => {
    const hasNewContent = records.some((record) =>
      [...record.addedNodes].some((node) => !isOwnChange(node)),
    );
    if (!hasNewContent) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(nudgeTranslator, NUDGE_DEBOUNCE_MS);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    window.clearTimeout(timer);
    observer.disconnect();
  };
}

/** Only loads Google's script for visitors who chose a language other than English. */
export function TranslateRuntime() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const language = selectedLanguage();
    if (!language) return;

    patchDomForTranslation();

    let loadTimer: number | undefined;
    let watchTimer: number | undefined;
    let waited = 0;
    let stopWatchingContent: (() => void) | undefined;

    const watch = () => {
      waited += WATCH_INTERVAL_MS;
      if (pageIsTranslated()) {
        window.sessionStorage.removeItem(RELOAD_FLAG);
        window.clearInterval(watchTimer);
        stopWatchingContent = watchForNewContent();
        return;
      }

      const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (combo && combo.options.length > 0) {
        combo.value = language;
        combo.dispatchEvent(new Event("change"));
      } else if (!combo && waited % SCRIPT_RETRY_MS === 0) {
        // The script can fail on a weak connection, so ask for it again.
        loadTranslator();
      }

      if (waited >= WATCH_LIMIT_MS) {
        window.clearInterval(watchTimer);
        if (window.sessionStorage.getItem(RELOAD_FLAG)) {
          window.sessionStorage.removeItem(RELOAD_FLAG);
          setFailed(true);
        } else {
          window.sessionStorage.setItem(RELOAD_FLAG, "1");
          window.location.reload();
        }
      }
    };

    const start = () => {
      loadTimer = window.setTimeout(() => {
        loadTranslator();
        watchTimer = window.setInterval(watch, WATCH_INTERVAL_MS);
      }, LOAD_DELAY_MS);
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      window.removeEventListener("load", start);
      window.clearTimeout(loadTimer);
      window.clearInterval(watchTimer);
      stopWatchingContent?.();
    };
  }, []);

  return (
    <>
      <div id="google_translate_element" className="hidden" aria-hidden="true" />
      {failed && (
        <div
          role="status"
          className="fixed inset-x-3 top-3 z-[300] mx-auto flex max-w-sm items-center justify-between gap-3 rounded-xl bg-[#5A4300] px-4 py-2.5 text-sm text-white shadow-lg"
        >
          <span>Translation is unavailable right now.</span>
          <button
            onClick={() => window.location.reload()}
            className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#5A4300]"
          >
            Try again
          </button>
        </div>
      )}
    </>
  );
}
