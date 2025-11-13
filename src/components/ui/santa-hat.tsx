
import { cn } from "@/lib/utils";
import React from "react";

export const SantaHat = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("transform -rotate-12", className)}
  >
    <path d="M12 2l7 4.5V14a5 5 0 0 1-10 0V6.5L12 2z" fill="#E53935" stroke="#B71C1C"/>
    <path d="M5 14a7 7 0 0 0 14 0" fill="#FFFFFF" stroke="#BDBDBD"/>
    <circle cx="12" cy="3.5" r="1.5" fill="#FFFFFF" stroke="#BDBDBD"/>
  </svg>
);
