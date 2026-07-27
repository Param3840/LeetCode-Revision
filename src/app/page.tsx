"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Steps from "@/components/Steps";
import AboutMe from "@/components/AboutMe";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      
      <Hero />
      
      <About />

      <Steps />

      <AboutMe />

      <Footer />
    </div>
  );
}
