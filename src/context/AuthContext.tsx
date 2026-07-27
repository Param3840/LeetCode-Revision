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
  
  // Keep track of the success callback after user logs in (e.g. for resuming repo analysis)
  const successCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // If user becomes logged in and there was a pending callback, run it!
      if (currentUser && successCallbackRef.current) {
        const cb = successCallbackRef.current;
        successCallbackRef.current = null;
        setTimeout(() => cb(), 0);
      }
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
      await firebaseLogout();
      if (window.location.pathname.startsWith("/profile")) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("AuthContext logout error:", error);
      throw error;
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
