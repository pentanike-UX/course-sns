"use client";

import { useEffect } from "react";

const ROUTE_DETAIL_THEME_COLOR = "#101815";
const DEFAULT_THEME_COLOR = "#ffffff";

let mountedRouteDetailChrome = 0;
let restoreTimer: number | undefined;
let createdThemeMeta: HTMLMetaElement | null = null;

export default function RouteDetailChromeTone() {
  useEffect(() => {
    mountedRouteDetailChrome += 1;
    if (restoreTimer != null) {
      window.clearTimeout(restoreTimer);
      restoreTimer = undefined;
    }

    applyRouteDetailThemeColor();

    return () => {
      mountedRouteDetailChrome = Math.max(0, mountedRouteDetailChrome - 1);
      restoreTimer = window.setTimeout(() => {
        if (mountedRouteDetailChrome === 0) restorePreviousThemeColor();
      }, 80);
    };
  }, []);

  return null;
}

function applyRouteDetailThemeColor() {
  const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));

  const targetMetas = metas.length > 0 ? metas : [ensureThemeMeta()];
  targetMetas.forEach((meta) => {
    meta.setAttribute("content", ROUTE_DETAIL_THEME_COLOR);
  });
}

function restorePreviousThemeColor() {
  const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
  metas.forEach((meta) => {
    if (!meta.isConnected) return;
    meta.setAttribute("content", DEFAULT_THEME_COLOR);
  });

  if (createdThemeMeta?.isConnected) {
    createdThemeMeta.remove();
  }

  createdThemeMeta = null;
  restoreTimer = undefined;
}

function ensureThemeMeta() {
  if (createdThemeMeta?.isConnected) return createdThemeMeta;

  createdThemeMeta = document.createElement("meta");
  createdThemeMeta.name = "theme-color";
  document.head.appendChild(createdThemeMeta);
  return createdThemeMeta;
}
