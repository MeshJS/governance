import React, { useState } from "react";
import styles from "../styles/Sidebar.module.css";
import { FaPiggyBank, FaChartLine, FaUsers, FaGavel, FaProjectDiagram, FaGithub, FaNpm, FaFileAlt, FaLightbulb, FaUser } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/router";

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

const Sidebar = () => {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`${styles.sidebar} ${!isHovered ? styles.collapsed : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <ul>
                {navItems.map((item, index) => {
                    const isActive = router.pathname === item.href;
                    return (
                        <li
                            key={index}
                            className={`${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}
                        >
                            <Link href={item.href} className={styles.navLink}>
                                {item.icon}
                                {isHovered && <span className={styles.navText}>{item.name}</span>}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default Sidebar;
