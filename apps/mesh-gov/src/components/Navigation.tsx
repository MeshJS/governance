import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import styles from '../styles/Navigation.module.css';

// Navigation items with paths
const navItems = [
  {
    name: 'Overview',
    path: '/',
  },
  {
    name: 'Mesh DRep',
    path: '/drep-voting',
  },
  {
    name: 'Catalyst Proposals',
    path: '/catalyst-proposals',
  },
  {
    name: 'Mesh Stats',
    path: '/mesh-stats',
  },
  {
    name: 'Projects',
    path: '/projects',
  },
  {
    name: 'Contributors',
    path: '/contributors',
  },
];

const socialLinks = [
  {
    name: 'Website',
    url: 'https://meshjs.dev/',
    icon: (
      <svg
        className={styles.socialIcon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    url: 'https://github.com/MeshJS',
    icon: (
      <svg
        className={styles.socialIcon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    name: 'Twitter',
    url: 'https://x.com/meshsdk',
    icon: (
      <svg
        className={styles.socialIcon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

const Navigation = () => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <nav className={`${styles.navCard} ${isMobile ? styles.navCardMobile : ''}`}>
      <div className={styles.logoContainer}>
        <Image
          src="/mesh-white-txt.png"
          alt="Mesh Logo"
          className={styles.logo}
          width={120}
          height={40}
          priority
        />
      </div>
      <div className={styles.navItems}>
        {navItems.map(item => (
          <Link
            key={item.path}
            href={item.path}
            className={`${styles.navItem} ${router.pathname === item.path ? styles.active : ''}`}
          >
            <span className={styles.label}>{item.name}</span>
          </Link>
        ))}
      </div>
      <div className={styles.socialLinks}>
        {socialLinks.map(link => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            title={link.name}
          >
            {link.icon}
          </a>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
