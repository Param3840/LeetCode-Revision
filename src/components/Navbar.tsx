"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, Github, Sparkles } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();
  const [activeTheme, setActiveTheme] = useState<"dark-bg" | "light-bg">("dark-bg");

  useEffect(() => {
    // Only run on the landing/home page where scrolling sections exist
    if (pathname !== "/") {
      setActiveTheme("light-bg"); // Default light styling for other pages (like dashboard)
      return;
    }

    const sections = [
      { id: "hero", theme: "dark-bg" },
      { id: "about", theme: "light-bg" },
      { id: "steps", theme: "dark-bg" },
      { id: "aboutme", theme: "light-bg" }
    ];

    const observerOptions = {
      root: null, // viewport
      rootMargin: "-10px 0px -90% 0px", // Trigger when section is in the top 10% of screen
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const sectionConfig = sections.find((s) => s.id === id);
          if (sectionConfig) {
            setActiveTheme(sectionConfig.theme as "dark-bg" | "light-bg");
          }
        }
      });
    }, observerOptions);

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      // Offset scroll target slightly if navbar is sticky
      const offset = 90; // height of floating navbar + margins
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      window.history.pushState(null, "", `#${targetId}`);
    }
  };

  const isLinkActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <header className={`${styles.header} ${activeTheme === "dark-bg" ? styles.themeDarkBg : styles.themeLightBg}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoIconWrapper}>
            <Terminal className={styles.logoIcon} />
          </div>
          <span className={styles.logoText}>
            Code<span className={styles.logoTextAccent}>Revise</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className={styles.navLinks}>
          <Link
            href="/"
            className={`${styles.navLink} ${pathname === "/" ? styles.navLinkActive : ""}`}
          >
         
          </Link>
          <a
            href="#about"
            onClick={(e) => handleScroll(e, "about")}
            className={styles.navLink}
          >
            About Us
          </a>
          <a
            href="#steps"
            onClick={(e) => handleScroll(e, "steps")}
            className={styles.navLink}
          >
            Steps to Use
          </a>
          <a
            href="#aboutme"
            onClick={(e) => handleScroll(e, "aboutme")}
            className={styles.navLink}
          >
            About Me
          </a>
        </nav>

      </div>
    </header>
  );
}
