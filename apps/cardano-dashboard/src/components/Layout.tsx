import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header/Header";
import styles from "../styles/Layout.module.css";

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className={styles.layout}>
            <Header />
            <div className={styles.content}>
                <Sidebar />
                <main className={styles.main}>{children}</main>
            </div>
        </div>
    );
};

export default Layout;
