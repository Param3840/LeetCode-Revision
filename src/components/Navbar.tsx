"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, Github, Sparkles, Menu, X, User as UserIcon, LogOut, Code, HelpCircle, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProfileDropdown from "./auth/ProfileDropdown";
import LoginModal from "./auth/LoginModal";
import { getCurrentRepoUrl } from "@/lib/storage";
import styles from "./Navbar.module.css";

const getInitials = (name: string | null) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

interface NavbarProps {
  forceTheme?: "dark-bg" | "light-bg";
  hideNavLinks?: boolean;
}

export default function Navbar({ forceTheme, hideNavLinks }: NavbarProps = {}) {
  const pathname = usePathname();
  const [activeTheme, setActiveTheme] = useState<"dark-bg" | "light-bg">("dark-bg");
  const { user, loading, logout, isLoginModalOpen, openLoginModal, closeLoginModal } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isLandingPage = pathname === "/" && !hideNavLinks;

  // Reset image error state when user changes
  useEffect(() => {
    setImgError(false);
  }, [user]);

  useEffect(() => {
    if (forceTheme) {
      setActiveTheme(forceTheme);
      return;
    }

    // Only run on the landing/home page where scrolling sections exist
    if (pathname !== "/") {
      setActiveTheme("dark-bg"); // Hero section floating capsule styling
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
  }, [pathname, forceTheme]);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false); // Close mobile menu if open
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

  const hasConnectedRepo = !!getCurrentRepoUrl();

  return (
    <header className={`${styles.header} ${activeTheme === "dark-bg" ? styles.themeDarkBg : styles.themeLightBg}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logoLink} onClick={() => setIsMobileMenuOpen(false)}>
          <div className={styles.logoIconWrapper}>
            <Terminal className={styles.logoIcon} />
          </div>
          <span className={styles.logoText}>
            Code<span className={styles.logoTextAccent}>Revise</span>
          </span>
        </Link>

        {/* Navigation Links (Desktop) - Only on Landing Page */}
        {isLandingPage && (
          <nav className={styles.navLinks}>
            <Link
              href="/"
              className={`${styles.navLink} ${pathname === "/" ? styles.navLinkActive : ""}`}
            >
              Revision Platform
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
        )}

        {/* Auth slot */}
        <div className="flex items-center gap-4 relative">
          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center">
            {loading ? (
              <div className="h-7 w-16 bg-current opacity-15 animate-pulse rounded-full" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-xs font-bold text-current hover:opacity-85 transition-opacity cursor-pointer"
                >
                  {user.photoURL && !imgError ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Profile"}
                      className="w-7 h-7 rounded-full object-cover border border-[#568203]/20"
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#568203] text-[#FFF8B9] flex items-center justify-center font-bold text-[10px]">
                      {getInitials(user.displayName)}
                    </div>
                  )}
                  <span className="max-w-[90px] truncate">{user.displayName?.split(" ")[0]}</span>
                  <span className="text-[9px] opacity-75">▼</span>
                </button>
                <ProfileDropdown isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)} />
              </div>
            ) : (
              <button
                onClick={() => openLoginModal()}
                className="text-xs font-bold text-current hover:opacity-80 transition-opacity cursor-pointer uppercase tracking-wider"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center">
            {loading ? (
              <div className="h-7 w-7 bg-current opacity-15 animate-pulse rounded-full" />
            ) : (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-current hover:opacity-85 transition-opacity cursor-pointer p-1"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : user ? (
                  user.photoURL && !imgError ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Profile"}
                      className="w-7 h-7 rounded-full object-cover border border-[#568203]/20"
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#568203] text-[#FFF8B9] flex items-center justify-center font-bold text-[10px]">
                      {getInitials(user.displayName)}
                    </div>
                  )
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}
          </div>

          {/* Mobile Menu Overlay Dropdown */}
          {isMobileMenuOpen && (
            <div 
              className="absolute right-0 w-64 bg-white border border-[#e1daab] rounded-2xl shadow-2xl z-50 p-5 flex flex-col gap-4 text-[#233807] animate-in fade-in slide-in-from-top-2 duration-150"
              style={{ top: "calc(100% + 10px)" }}
            >
              {user ? (
                <>
                  {/* Logged in User Profile Info */}
                  <div className="flex items-center gap-3 pb-3 border-b border-[#e1daab]/40">
                    {user.photoURL && !imgError ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "Profile"}
                        className="w-10 h-10 rounded-full object-cover border border-[#568203]/20 shrink-0"
                        referrerPolicy="no-referrer"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#568203] text-[#FFF8B9] flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(user.displayName)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold truncate font-sans">{user.displayName || "Revision Student"}</h4>
                      <p className="text-[10px] text-[#233807]/60 truncate font-sans mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  {/* Navigation & actions */}
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[#FFF8B9]/30 rounded-lg transition-colors cursor-pointer"
                    >
                      <UserIcon className="h-4 w-4 text-[#568203]" />
                      <span>View Profile</span>
                    </Link>

                    {pathname === "/revision/dashboard" || pathname?.startsWith("/revision/dashboard") ? (
                      <Link
                        href="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[#FFF8B9]/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <Home className="h-4 w-4 text-[#568203]" />
                        <span>Home</span>
                      </Link>
                    ) : (
                      <Link
                        href="/revision/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[#FFF8B9]/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <Code className="h-4 w-4 text-[#568203]" />
                        <span>My Revision</span>
                      </Link>
                    )}

                    <div className="h-px bg-[#e1daab]/40 my-1" />

                    <button
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        await logout();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="h-4 w-4 text-red-500 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Logged out Navigation List */}
                  <div className="flex flex-col gap-3.5">
                    <Link
                      href="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-semibold hover:text-[#568203] transition-colors"
                    >
                      Revision Platform
                    </Link>
                    <a
                      href="#about"
                      onClick={(e) => handleScroll(e, "about")}
                      className="text-sm font-semibold hover:text-[#568203] transition-colors"
                    >
                      About Us
                    </a>
                    <a
                      href="#steps"
                      onClick={(e) => handleScroll(e, "steps")}
                      className="text-sm font-semibold hover:text-[#568203] transition-colors"
                    >
                      Steps to Use
                    </a>
                    <a
                      href="#aboutme"
                      onClick={(e) => handleScroll(e, "aboutme")}
                      className="text-sm font-semibold hover:text-[#568203] transition-colors"
                    >
                      About Me
                    </a>
                  </div>

                  <div className="h-px bg-[#e1daab]/40 my-0.5" />

                  {/* Mobile login action */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openLoginModal();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#233807] hover:bg-[#233807]/90 text-[#FFF8B9] font-bold text-xs rounded-xl py-3 px-4 shadow cursor-pointer transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Continue with Google</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Login Modal instance */}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </header>
  );
}
