# Wallet Integration with Mesh.js

This document describes the wallet integration implemented in the Cardano Dashboard using Mesh.js.

## Overview

The wallet integration allows users to connect their Cardano wallets (like Eternl, Nami, Flint, etc.) to the dashboard using the CIP-30 standard. Users can view their wallet information, balance, and network details.

## Features

- **Automatic Wallet Detection**: Automatically detects available wallets on the user's device
- **Wallet Connection**: Connect to any CIP-30 compatible wallet
- **Persistent Connections**: Wallet connections are remembered across browser sessions
- **Wallet Information Display**: Shows wallet name, icon, balance, and network
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Responsive Design**: Works on both desktop and mobile devices

## Technical Implementation

### Components

1. **WalletContext** (`src/contexts/WalletContext.tsx`)
   - Manages wallet state and connections
   - Handles wallet discovery and connection logic
   - Provides wallet information to the rest of the application

2. **WalletConnect** (`src/components/WalletConnect/WalletConnect.tsx`)
   - UI component for wallet connection
   - Dropdown menu for wallet selection
   - Displays connected wallet information

### Key Features

- **Wallet Discovery**: Uses `BrowserWallet.getAvailableWallets()` to find available wallets
- **Connection Management**: Uses `BrowserWallet.enable(walletName)` to connect
- **Balance Retrieval**: Fetches ADA balance using `wallet.getLovelace()`
- **Network Detection**: Gets network ID (0 for testnet, 1 for mainnet)
- **Address Management**: Retrieves wallet addresses for display

### State Management

The wallet context manages:
- Available wallets list
- Currently connected wallet
- Connection status (connecting, disconnecting)
- Error states
- Loading states

### Persistence

Wallet connections are stored in localStorage with a 1-hour expiration to ensure security while maintaining user convenience.

## Usage

### For Users

1. Click the "Connect Wallet" button in the header
2. Select your preferred wallet from the dropdown
3. Approve the connection in your wallet
4. View your wallet information and balance
5. Use the disconnect button to disconnect when done

### For Developers

The wallet context provides several hooks and functions:

```typescript
import { useWallet } from '@/contexts/WalletContext';

function MyComponent() {
  const {
    availableWallets,
    connectedWallet,
    isConnecting,
    connectWallet,
    disconnectWallet,
    error
  } = useWallet();

  // Use wallet data and functions
}
```

## Supported Wallets

Any wallet that implements the CIP-30 standard is supported, including:
- Eternl
- Nami
- Flint
- Yoroi
- Daedalus
- And many others

## Security Considerations

- Wallet connections expire after 1 hour
- No private keys are ever stored or transmitted
- All wallet interactions use the secure CIP-30 protocol
- Users must explicitly approve connections in their wallet

## Error Handling

The system handles various error scenarios:
- No wallets available
- Connection failures
- Network issues
- Wallet permission denials

Errors are displayed as user-friendly toast messages and automatically clear after 5 seconds.

## Future Enhancements

Potential future improvements:
- Transaction signing capabilities
- Asset management
- Staking information
- DRep functionality
- Multi-wallet support
- Wallet switching without reconnection

## Dependencies

- `@meshsdk/core`: Core wallet functionality
- `@meshsdk/react`: React integration utilities
- React Context API for state management
- CSS Modules for styling

## Browser Compatibility

Requires a modern browser with:
- ES6+ support
- LocalStorage support
- Modern CSS features
- Web Crypto API support (for wallet operations)
