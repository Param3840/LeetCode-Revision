"use client";

import React from "react";
import { Github, Mail, Phone, BookOpen, Briefcase } from "lucide-react";
import styles from "./AboutMe.module.css";

export default function AboutMe() {
  return (
    <section id="aboutme" className={styles.aboutMeSection}>
      <div className={styles.aboutMeContainer}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          <span className={styles.label}>The Creator</span>
          <h2 className={styles.title}>Paramveer Kumar Singh</h2>
          <p className={styles.quote}>
            "B.Tech Computer Science student at Galgotias University with a strong focus on Data Structures & Algorithms and Web Development."
          </p>

          <div className={styles.contactList}>
            <div className={styles.contactItem}>
              <Mail className="h-4 w-4" />
              <a href="mailto:paramveersingh240303@gmail.com" className={styles.contactLink}>
                paramveersingh240303@gmail.com
              </a>
            </div>
            <div className={styles.contactItem}>
              <Phone className="h-4 w-4" />
              <span className={styles.contactText}>+91 82877 84156</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          <p className={styles.storyText}>
            Hey, I'm Paramveer! As a B.Tech Computer Science student, my primary passion lies in mastering Data Structures and Algorithms and building robust web applications. I love solving complex computational problems through clean, highly efficient code.
          </p>
          <p className={styles.storyText}>
            I created <strong>CodeRevise</strong> to solve a recurring challenge in interview preparation: keeping track of what needs review. Pushing LeetCode solutions to GitHub is easy, but actually revising those solutions systematically from raw directories is tedious. CodeRevise turns your public GitHub repositories into structured, interactive study guides.
          </p>
          <p className={styles.storyText}>
            This platform runs entirely inside your browser (no database signup, no user accounts), loading your repository details live and keeping your checklist progress cached locally inside your storage.
          </p>

          {/* Education & Experience highlights */}
          <div className={styles.highlightsGrid}>
            <div className={styles.highlightCard}>
              <BookOpen className="h-5 w-5 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <h4 className={styles.highlightTitle}>Education</h4>
                <p className={styles.highlightDesc}>
                  B.Tech in Computer Science (2022 – 2026)<br />
                  Galgotias University, Uttar Pradesh
                </p>
              </div>
            </div>

            <div className={styles.highlightCard}>
              <Briefcase className="h-5 w-5 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <h4 className={styles.highlightTitle}>Internship</h4>
                <p className={styles.highlightDesc}>
                  Java Intern (2025)<br />
                  Wipro TalentNext Student Training
                </p>
              </div>
            </div>
          </div>
          
          <div className={styles.buttonContainer}>
            <a 
              href="https://github.com/paramveersingh240303" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.githubButton}
            >
              <Github className="h-4 w-4" />
              <span>Follow my GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
