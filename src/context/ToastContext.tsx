"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
  type?: ToastType;
}

interface ToastContextType {
  showToast: (title: string, subtitle?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((title: string, subtitle?: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-2), { id, title, subtitle, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2.5 pointer-events-none w-full max-w-sm px-4">
            <AnimatePresence>
              {toasts.map((toast) => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="pointer-events-auto w-full bg-[#1a2905]/90 border border-[#FFF8B9]/30 backdrop-blur-xl text-[#FFF8B9] rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-start gap-3.5 relative"
                >
                  <div className="p-1 rounded-full bg-[#8ba848]/20 shrink-0 text-emerald-400 mt-0.5">
                    {toast.type === "error" ? (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    ) : toast.type === "info" ? (
                      <Info className="h-5 w-5 text-cyan-400" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>

                  <div className="flex-1 pr-4 font-sans">
                    <div className="font-extrabold text-sm text-white leading-snug">
                      {toast.title}
                    </div>
                    {toast.subtitle && (
                      <div className="text-xs text-[#FFF8B9]/70 mt-0.5 leading-relaxed font-medium">
                        {toast.subtitle}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-[#FFF8B9]/40 hover:text-[#FFF8B9] transition-colors p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
