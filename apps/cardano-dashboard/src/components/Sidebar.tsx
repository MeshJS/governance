import React from "react";
import styles from "../styles/Sidebar.module.css";
import { FaPiggyBank, FaChartLine, FaUsers, FaGavel, FaProjectDiagram, FaGithub, FaNpm, FaFileAlt, FaLightbulb, FaUser, FaChevronLeft, FaChevronRight } from "react-icons/fa";
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

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
    return (
        <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
            <button
                className={styles.toggleButton}
                onClick={onToggle}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <span className={styles.toggleIcon}>
                    {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                </span>
            </button>
            <ul>
                {navItems.map((item, index) => (
                    <li key={index} className={styles.navItem}>
                        <Link href={item.href} legacyBehavior>
                            <a className={styles.navLink} tabIndex={0}>
                                {item.icon}
                                {!isCollapsed && <span className={styles.navText}>{item.name}</span>}
                            </a>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
