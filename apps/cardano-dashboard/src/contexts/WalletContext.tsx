import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserWallet } from '@meshsdk/core';

export interface WalletInfo {
    id: string;
    name: string;
    icon: string;
    version: string;
}

export interface ConnectedWallet {
    wallet: BrowserWallet;
    id: string;
    name: string;
    icon: string;
    version: string;
    address?: string;
    balance?: string;
    networkId?: number;
}

interface WalletContextType {
    // Available wallets
    availableWallets: WalletInfo[];
    isLoadingWallets: boolean;

    // Connected wallet
    connectedWallet: ConnectedWallet | null;
    isConnecting: boolean;
    isDisconnecting: boolean;

    // Actions
    refreshAvailableWallets: () => Promise<void>;
    connectWallet: (walletName: string) => Promise<void>;
    disconnectWallet: () => Promise<void>;

    // Errors
    error: string | null;
    clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}

interface WalletProviderProps {
    children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
    const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
    const [isLoadingWallets, setIsLoadingWallets] = useState(false);
    const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load available wallets on mount
    useEffect(() => {
        refreshAvailableWallets();
    }, []);

    const refreshAvailableWallets = async () => {
        setIsLoadingWallets(true);
        setError(null);

        try {
            const wallets = await BrowserWallet.getAvailableWallets();
            setAvailableWallets(wallets);

        } catch (err) {
            console.error('Failed to get available wallets:', err);
            setError('Failed to load available wallets');
        } finally {
            setIsLoadingWallets(false);
        }
    };

    const connectWallet = async (walletName: string) => {
        setIsConnecting(true);
        setError(null);

        try {
            // Find wallet info first to get the correct ID
            const walletInfo = availableWallets.find(w => w.name === walletName);
            if (!walletInfo) {
                throw new Error('Wallet info not found');
            }

            // Enable the wallet using the ID, not the display name
            const wallet = await BrowserWallet.enable(walletInfo.id);

            // Get basic wallet information
            let address: string | undefined;
            let balance: string | undefined;
            let networkId: number | undefined;

            try {
                // Get first unused address
                const addresses = await wallet.getUnusedAddresses();
                if (addresses.length > 0) {
                    address = addresses[0];
                }

                // Get ADA balance
                const lovelace = await wallet.getLovelace();
                balance = (parseInt(lovelace) / 1000000).toString(); // Convert to ADA

                // Get network ID
                networkId = await wallet.getNetworkId();
            } catch {
                // Continue with basic connection even if some info fails
            }

            const connectedWalletData: ConnectedWallet = {
                wallet,
                id: walletInfo.id,
                name: walletInfo.name,
                icon: walletInfo.icon,
                version: walletInfo.version,
                address,
                balance,
                networkId,
            };

            setConnectedWallet(connectedWalletData);

            // Store connection in localStorage for persistence
            if (typeof window !== 'undefined') {
                localStorage.setItem('cardano-dashboard-connected-wallet', JSON.stringify({
                    name: walletName,
                    timestamp: Date.now(),
                }));
            }

        } catch (err) {
            console.error('Failed to connect wallet:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect wallet');
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = async () => {
        setIsDisconnecting(true);
        setError(null);

        try {
            // Clear connected wallet state
            setConnectedWallet(null);

            // Remove from localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem('cardano-dashboard-connected-wallet');
            }
        } catch (err) {
            console.error('Failed to disconnect wallet:', err);
            setError('Failed to disconnect wallet');
        } finally {
            setIsDisconnecting(false);
        }
    };

    const clearError = () => {
        setError(null);
    };

    // Check for existing connection on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedConnection = localStorage.getItem('cardano-dashboard-connected-wallet');
            if (savedConnection) {
                try {
                    const { name, timestamp } = JSON.parse(savedConnection);
                    const connectionAge = Date.now() - timestamp;

                    // Only restore connection if it's less than 1 hour old
                    if (connectionAge < 60 * 60 * 1000) {
                        // Check if wallet is still available
                        const walletExists = availableWallets.some(w => w.name === name);
                        if (walletExists) {
                            connectWallet(name);
                        } else {
                            // Clear invalid saved connection
                            localStorage.removeItem('cardano-dashboard-connected-wallet');
                        }
                    } else {
                        // Clear expired connection
                        localStorage.removeItem('cardano-dashboard-connected-wallet');
                    }
                } catch (err) {
                    console.error('Failed to restore wallet connection:', err);
                    localStorage.removeItem('cardano-dashboard-connected-wallet');
                }
            }
        }
    }, [availableWallets]);

    const value: WalletContextType = {
        availableWallets,
        isLoadingWallets,
        connectedWallet,
        isConnecting,
        isDisconnecting,
        refreshAvailableWallets,
        connectWallet,
        disconnectWallet,
        error,
        clearError,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}
