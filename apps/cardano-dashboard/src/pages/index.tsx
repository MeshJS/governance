import Head from "next/head";
import pageStyles from '@/styles/PageLayout.module.css';
import styles from '@/styles/Home.module.css';
import { FaPiggyBank, FaChartLine, FaUsers, FaGavel, FaProjectDiagram, FaGithub, FaNpm, FaFileAlt, FaLightbulb, FaUser } from "react-icons/fa";
import Link from "next/link";

const navItems = [
  { name: "Treasury", icon: <FaPiggyBank />, href: "/treasury" },
  { name: "SPOs Activity", icon: <FaChartLine />, href: "/spos-activity" },
  { name: "DRep Activity", icon: <FaUsers />, href: "/drep-activity" },
  { name: "Constitutional Committee", icon: <FaGavel />, href: "/constitutional-committee" },
  { name: "Cardano Projects", icon: <FaProjectDiagram />, href: "/cardano-projects" },
  { name: "GitHub Activity", icon: <FaGithub />, href: "/github-activity" },
  { name: "npmjs Activity", icon: <FaNpm />, href: "/npmjs-activity" },
  { name: "CIP Activity", icon: <FaFileAlt />, href: "/cip-activity" },
  { name: "Catalyst", icon: <FaLightbulb />, href: "/catalyst" },
  { name: "Profile Pages", icon: <FaUser />, href: "/profile-pages" },
];

export default function Home() {
  return (
    <div className={pageStyles.pageContainer}>
      <Head>
        <title>Cardano Dashboard</title>
        <meta name="description" content="A Cardano dApp powered by Mesh" />
      </Head>
      <main>
        <h1 className={pageStyles.pageTitle}>
          Welcome to Cardano Dashboard
        </h1>
        <div className={pageStyles.section}>
          <p className={styles.introText}>
            Explore the Cardano ecosystem through our comprehensive dashboard. Monitor treasury movements,
            track SPO and DRep activities, follow project developments, and stay updated with the latest
            Cardano Improvement Proposals (CIPs). This platform provides real-time insights into the
            Cardano blockchain&apos;s governance, development, and community activities.
          </p>
          <div className={styles.navGrid}>
            {navItems.map((item, index) => (
              <Link href={item.href} key={index} className={styles.navButton}>
                <div className={styles.buttonContent}>
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <footer>
        Footer
      </footer>
    </div>
  );
}
