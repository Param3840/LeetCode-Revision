"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const getInitials = (name: string | null) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function ProfileDropdown({ isOpen, onClose }: ProfileDropdownProps) {
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleSignOut = async () => {
    onClose();
    await logout();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2.5 w-64 bg-white border border-[#e1daab] rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 py-2.5"
      style={{ top: "100%" }}
    >
      {/* User Info Section */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[#e1daab]/40">
        {user.photoURL && !imgError ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User Profile"}
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
          <h4 className="text-sm font-bold text-[#233807] truncate font-sans">
            {user.displayName || "Revision Student"}
          </h4>
          <p className="text-[10px] text-[#233807]/60 truncate font-sans mt-0.5">
            {user.email || ""}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="px-1.5 py-1.5">
        <Link
          href="/profile"
          onClick={onClose}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#233807] hover:bg-[#FFF8B9]/30 rounded-lg transition-colors cursor-pointer"
        >
          <UserIcon className="h-4 w-4 text-[#568203]" />
          <span>View Profile</span>
        </Link>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#e1daab]/40 my-1.5" />

      {/* Logout Action */}
      <div className="px-1.5">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
        >
          <LogOut className="h-4 w-4 shrink-0 text-red-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
