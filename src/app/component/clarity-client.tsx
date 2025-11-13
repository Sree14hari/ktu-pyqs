"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export default function ClarityClient() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV === "production") {
      try {
        // Initialize your project (optional if script tag already initializes)
        Clarity.init("u3s24vnhxx");

        // Example: tag the page or log an event
        Clarity.setTag("page", window.location.pathname);
        Clarity.event("page_viewed");
      } catch (e) {
        console.error("Clarity error:", e);
      }
    }
  }, []);

  return null; // nothing to render
}
