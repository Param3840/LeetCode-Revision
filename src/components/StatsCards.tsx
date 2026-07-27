"use client";

import { motion, Variants } from "framer-motion";
import { Award, ShieldAlert, Zap, Layers } from "lucide-react";
import styles from "./StatsCards.module.css";

interface StatsCardsProps {
  total: number;
  easy: number;
  medium: number;
  hard: number;
}

export default function StatsCards({ total, easy, medium, hard }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Solved",
      value: total,
      icon: Layers,
      iconClass: styles.iconTotal,
      bgClass: styles.bgTotal,
      description: "Total recognized problems"
    },
    {
      title: "Easy Solved",
      value: easy,
      icon: Award,
      iconClass: styles.iconEasy,
      bgClass: styles.bgEasy,
      description: "Fast-paced questions"
    },
    {
      title: "Medium Solved",
      value: medium,
      icon: Zap,
      iconClass: styles.iconMedium,
      bgClass: styles.bgMedium,
      description: "Core interview standard"
    },
    {
      title: "Hard Solved",
      value: hard,
      icon: ShieldAlert,
      iconClass: styles.iconHard,
      bgClass: styles.bgHard,
      description: "Advanced algorithmic concepts"
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={styles.gridContainer}
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            className={`${styles.statCard} glow-card`}
          >
            <div>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>
                  {stat.title}
                </span>
                <div className={`${styles.iconWrapper} ${stat.bgClass}`}>
                  <Icon className={`${styles.icon} ${stat.iconClass}`} />
                </div>
              </div>
              
              <div className={styles.valueWrapper}>
                <span className={styles.value}>
                  {stat.value}
                </span>
              </div>
            </div>
            
            <p className={styles.cardDescription}>
              {stat.description}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
