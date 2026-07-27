"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import styles from "./ResetRevisionModal.module.css";

interface ResetRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ResetRevisionModal({ isOpen, onClose, onConfirm }: ResetRevisionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={styles.backdrop}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.35 }}
            className={styles.modalBody}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className={styles.closeButton}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className={styles.flexColumn}>
              <div className={styles.iconWrapper}>
                <AlertTriangle className={styles.icon} />
              </div>

              <div>
                <h3 className={styles.modalTitle}>
                  Reset revision progress?
                </h3>
                <p className={styles.modalDescription}>
                  This will mark all questions in this repository as Not Revised so you can start revising them again. Your analyzed repository files will remain intact.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actionsGroup}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={styles.confirmButton}
              >
                Reset Progress
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
