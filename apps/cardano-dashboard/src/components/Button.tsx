import styles from "@/styles/Button.module.css";

const Button = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => {
    return (
        <button className={styles.button} onClick={onClick}>
            {children}
        </button>
    );
};

export default Button;
