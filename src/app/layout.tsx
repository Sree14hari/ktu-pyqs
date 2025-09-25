import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'KTU PYQ Finder - Previous Year Question Papers',
  description: 'Easily find, browse, and download APJ Abdul Kalam Technological University (KTU) previous year question papers (PYQs) for all branches and semesters.',
  keywords: 'KTU, APJ Abdul Kalam Technological University, PYQ, Question Papers, Previous Year Questions, KTU PYQ Finder, Engineering, B.Tech',
  manifest: '/manifest.json',
  verification: {
    google: 'UxZm8TRlYXQwnN3FSNL8_YWDoyHx-UwmSqfQSN9fD_s',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Pixelify+Sans:wght@400..700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
