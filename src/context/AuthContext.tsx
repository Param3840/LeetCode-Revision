"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { loginWithGoogle as firebaseLogin, logout as firebaseLogout } from "@/lib/firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isLoginModalOpen: boolean;
  loginModalContextText: string;
  openLoginModal: (contextText?: string, onSuccess?: () => void) => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalContextText, setLoginModalContextText] = useState("");
  
  // Keep track of the success callback after user logs in
  const successCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (token && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed as any);
        } catch (e) {
          console.error("Failed to parse user session");
        }
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await firebaseLogin();
      setIsLoginModalOpen(false);
    } catch (error) {
      console.error("AuthContext Google login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // 1. Clear all local & session storage
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // 2. Sign out of Firebase auth
      await firebaseLogout();

      // 3. Reset local React state
      setUser(null);
      setIsLoginModalOpen(false);
    } catch (error) {
      console.error("AuthContext logout error:", error);
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    } finally {
      // 4. Perform hard location redirect to Landing Page (/)
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  const openLoginModal = (contextText?: string, onSuccess?: () => void) => {
    setLoginModalContextText(contextText || "");
    successCallbackRef.current = onSuccess || null;
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    successCallbackRef.current = null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        logout,
        isLoginModalOpen,
        loginModalContextText,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
