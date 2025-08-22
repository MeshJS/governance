import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import styles from './WalletConnect.module.css';

export default function WalletConnect() {
  const {
    availableWallets,
    isLoadingWallets,
    connectedWallet,
    isConnecting,
    isDisconnecting,
    connectWallet,
    disconnectWallet,
    error,
    clearError,
  } = useWallet();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when wallet connects/disconnects
  useEffect(() => {
    if (connectedWallet || isConnecting || isDisconnecting) {
      setIsDropdownOpen(false);
    }
  }, [connectedWallet, isConnecting, isDisconnecting]);

  const handleConnectWallet = async (walletName: string) => {
    try {
      await connectWallet(walletName);
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
    }
  };

  const toggleDropdown = () => {
    if (!isLoadingWallets && availableWallets.length > 0) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  // Show error toast
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // If wallet is connected, show wallet info
  if (connectedWallet) {
    return (
      <div className={styles.walletConnected}>
        <div className={styles.walletInfo}>
          <img
            src={connectedWallet.icon}
            alt={connectedWallet.name}
            className={styles.walletIcon}
          />
          <div className={styles.walletDetails}>
            <span className={styles.walletName}>{connectedWallet.name}</span>
            {connectedWallet.balance && (
              <span className={styles.walletBalance}>
                {parseFloat(connectedWallet.balance).toFixed(2)} ADA
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleDisconnectWallet}
          disabled={isDisconnecting}
          className={styles.disconnectButton}
        >
          {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>
    );
  }

  // If loading wallets, show loading state
  if (isLoadingWallets) {
    return (
      <button className={styles.walletButton} disabled>
        Loading Wallets...
      </button>
    );
  }

  // If no wallets available, show message
  if (availableWallets.length === 0) {
    return (
      <button className={styles.walletButton} disabled>
        No Wallets Found
      </button>
    );
  }

  // Show connect wallet button with dropdown
  return (
    <div className={styles.walletConnectContainer} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        disabled={isConnecting}
        className={styles.walletButton}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {isDropdownOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>Select Wallet</span>
          </div>
          {availableWallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => handleConnectWallet(wallet.name)}
              className={styles.walletOption}
              disabled={isConnecting}
            >
              <img
                src={wallet.icon}
                alt={wallet.name}
                className={styles.walletOptionIcon}
              />
              <div className={styles.walletOptionInfo}>
                <span className={styles.walletOptionName}>{wallet.name}</span>
                <span className={styles.walletOptionVersion}>v{wallet.version}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className={styles.errorToast}>
          <span>{error}</span>
          <button onClick={clearError} className={styles.errorClose}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
