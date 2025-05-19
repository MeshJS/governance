import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header/Header";
import styles from "../styles/Layout.module.css";

const Layout = ({ children }: { children: React.ReactNode }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    return (
        <div className={styles.layout}>
            <Header />
            <div className={styles.content}>
                <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((c) => !c)} />
                <main className={`${styles.main} ${isCollapsed ? styles.collapsed : ''}`}>{children}</main>
            </div>
        </div>
    );
};

export default Layout;
