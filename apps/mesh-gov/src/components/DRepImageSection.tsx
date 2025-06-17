import Image from 'next/image';
import styles from './DRepImageSection.module.css';

export default function DRepImageSection() {
    return (
        <div className={styles.imageSection}>
            <div className={styles.imageContainer}>
                <Image
                    src="/drep-image.png"
                    alt="Mesh DRep Visualization"
                    width={800}
                    height={600}
                    className={styles.drepImage}
                    priority
                />
            </div>
        </div>
    );
} 