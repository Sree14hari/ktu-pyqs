"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Github, Instagram, Linkedin, Menu } from "lucide-react";

export default function AppNavbar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const navItems = [
    {
      name: "Home",
      link: "/",
    },
    {
        name: "SGPA",
        link: "/sgpa-calculator",
    },
    {
      name: "Compress",
      link: "/bit-compressor",
    },
    {
      name: "Notes",
      link: "/notes",
    },
    {
      name: "History",
      link: "/history",
    },
  ];

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border",
        className
      )}
    >
      <div className="container mx-auto max-w-3xl flex items-center justify-between px-4 h-16">
        <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">KTUHUB</span>
            </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 gap-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.link}
              className={cn(
                "transition-colors hover:text-foreground",
                pathname === item.link
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="hidden md:flex items-center gap-4">
            <a href="https://github.com/Sree14hari" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
            </a>
            <a href="https://www.linkedin.com/in/sree14hari" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="h-5 w-5" />
            </a>
            <a href="https://www.instagram.com/s_ree.har_i" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="h-5 w-5" />
            </a>
        </div>

        <div className="md:hidden">
           <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full h-full sm:max-w-full">
                <SheetHeader>
                    <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
                    <SheetDescription className="sr-only">Main navigation links for the site.</SheetDescription>
                </SheetHeader>
              <div className="flex flex-col h-full p-6">
                <Link href="/" onClick={handleLinkClick} className="flex items-center gap-2 mb-8">
                  <span className="text-xl font-bold text-white">KTUHUB</span>
                </Link>
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.link}
                      onClick={handleLinkClick}
                      className={cn(
                        "text-lg",
                        pathname === item.link
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col items-center gap-6">
                  <div className="flex items-center gap-6">
                    <a href="https://github.com/Sree14hari" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Github className="h-6 w-6" />
                    </a>
                    <a href="https://www.linkedin.com/in/sree14hari" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Linkedin className="h-6 w-6" />
                    </a>
                    <a href="https://www.instagram.com/s_ree.har_i" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Instagram className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
