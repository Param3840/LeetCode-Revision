import Link from "next/link";
import { Terminal, Mail, Github, Linkedin } from "lucide-react";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.flexGroup}>
          {/* Logo & Intro */}
          <div className={styles.logoSection}>
            <Terminal className={styles.logoIcon} />
            <span className={styles.logoText}>CodeRevise</span>
            <span className={styles.logoCopyright}>© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          {/* Contact Links */}
          <div className={styles.socialLinks}>
            <a
              href="mailto:paramveer@example.com"
              className={styles.socialLink}
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href="https://github.com/Param3840/LeetCode"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
