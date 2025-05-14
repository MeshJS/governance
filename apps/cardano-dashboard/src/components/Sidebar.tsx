import React, { useState } from "react";
import styles from "../styles/Sidebar.module.css";
import { FaPiggyBank, FaChartLine, FaUsers, FaGavel, FaProjectDiagram, FaGithub, FaNpm, FaFileAlt, FaLightbulb, FaUser, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const navItems = [
    { name: "Treasury", icon: <FaPiggyBank /> },
    { name: "SPOs Activity", icon: <FaChartLine /> },
    { name: "DRep Activity", icon: <FaUsers /> },
    { name: "Constitutional Committee", icon: <FaGavel /> },
    { name: "Cardano Projects", icon: <FaProjectDiagram /> },
    { name: "GitHub Activity", icon: <FaGithub /> },
    { name: "npmjs Activity", icon: <FaNpm /> },
    { name: "CIP Activity", icon: <FaFileAlt /> },
    { name: "Catalyst", icon: <FaLightbulb /> },
    { name: "Profile Pages", icon: <FaUser /> },
];

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
            <button
                className={styles.toggleButton}
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <span className={styles.toggleIcon}>
                    {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                </span>
            </button>
            <ul>
                {navItems.map((item, index) => (
                    <li key={index} className={styles.navItem}>
                        {item.icon}
                        {!isCollapsed && <span>{item.name}</span>}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
