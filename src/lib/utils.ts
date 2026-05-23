import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl(endpoint: string): string {
  if (!endpoint) return "";
  if (endpoint.startsWith("http")) return endpoint;
  
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Check if running on local development machines or standard run.app domains
  if (
    typeof window !== "undefined" && 
    (window.location.hostname === "localhost" || 
     window.location.hostname === "127.0.0.1" || 
     window.location.hostname.endsWith("run.app") ||
     window.location.hostname.endsWith("googleusercontent.com"))
  ) {
    return cleanEndpoint;
  }

  // Check if a custom VITE_API_BASE_URL is provided in environment config (mainly when deploying to external host like Firebase Hosting)
  const customBase = import.meta.env.VITE_API_BASE_URL;
  if (customBase && customBase.trim().length > 0) {
    const base = customBase.endsWith("/") ? customBase.slice(0, -1) : customBase;
    return `${base}${cleanEndpoint}`;
  }

  // Deployed to production/hosting platforms like Firebase Hosting (lumina-b5275.web.app):
  // Direct API requests to the active, live Cloud Run server instance
  return `https://ais-pre-p5mnit4kjormulu6xg73tt-443608093980.europe-west2.run.app${cleanEndpoint}`;
}

export function formatDate(date: any) {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}
