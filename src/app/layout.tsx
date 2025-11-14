
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';
import ClarityClient from "@/app/component/clarity-client";
import AppNavbar from '@/components/layout/navbar';
import { ThemeProvider } from '@/components/theme-provider';


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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;700&display=swap" rel="stylesheet" />
        
        {/* Google tag (gtag.js) */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-03SCGES35Z"></Script>
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-03SCGES35Z');
          `}
        </Script>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "u3s24vnhxx");
          `}
        </Script>

        
        {/* Gatekeeper and Ezoic Scripts */}
        <Script src="https://cmp.gatekeeperconsent.com/min.js" data-cfasync="false"></Script>
        <Script src="https://the.gatekeeperconsent.com/cmp.min.js" data-cfasync="false"></Script>
        <Script id="ezstandalone-init">
          {`
            window.ezstandalone = window.ezstandalone || {};
            ezstandalone.cmd = ezstandalone.cmd || [];
          `}
        </Script>
      </head>
      <body className="font-body antialiased h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative w-full flex flex-col items-center z-20">
              <AppNavbar />
          </div>
          <main className="pt-16">{children}</main>
          <Toaster />
          <Analytics />
          <ClarityClient />
          <Script
            data-name="BMC-Widget"
            data-cfasync="false"
            src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
            data-id="sree14hari"
            data-description="Support me on Buy me a coffee!"
            data-message=""
            data-color="#5F7FFF"
            data-position="Right"
            data-x_margin="18"
            data-y_margin="18"
            strategy="lazyOnload"
          ></Script>
        </ThemeProvider>
      </body>
    </html>
  );
}
