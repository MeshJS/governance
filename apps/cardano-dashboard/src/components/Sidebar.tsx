import React from "react";
import styles from "./Sidebar.module.css";
import { FaPiggyBank, FaChartLine, FaUsers, FaGavel, FaProjectDiagram, FaGithub, FaNpm, FaFileAlt, FaLightbulb, FaUser } from "react-icons/fa";

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
    return (
        <div className={styles.sidebar}>
            <ul>
                {navItems.map((item, index) => (
                    <li key={index} className={styles.navItem}>
                        {item.icon}
                        <span>{item.name}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
