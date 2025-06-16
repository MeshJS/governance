|Project ID|1200148|
|-----------|-------------|
|Link|[Open full project](https://projectcatalyst.io/funds/12/f12-cardano-use-cases-concept/mesh-software-as-a-service)|
|Milestone|[Milestone 4](https://milestones.projectcatalyst.io/projects/1200148/milestones/4)
|Challenge|F12: Cardano Use Cases: Concept|
|Milestone Budget|ADA 20,000.00|
|Milestone Delivered|April 20, 2025|

# Mesh Software as a Service: Milestone 4
https://milestones.projectcatalyst.io/projects/1200148/milestones/4

## Acceptance criteria #1

> Finalised Server application code - hosted wallet / private key for signing

There are 2 types of wallet:
- user-controlled wallet
- developer-controlled wallet

### User controlled wallet
Users can create a non-custodial wallet using social logins, no extra software or mnemonic phrases required.

For developers, it is easy to intergrate too. Here is an example of how to use the user-controlled wallet:

```javascript
import {
  InitWeb3WalletOptions,
  Web3Wallet,
} from "@meshsdk/web3-sdk";
import { BlockfrostProvider } from "@meshsdk/provider";
 
const provider = new BlockfrostProvider('YOUR-API-KEY');
 
const _options: InitWeb3WalletOptions = {
  networkId: 0, // 0: testnet, 1: mainnet
  fetcher: provider,
  submitter: provider,
  projectId: "your_project_id",
};
 
const wallet = await Web3Wallet.enable(_options);
```

### Developer controlled wallet

Developers can create wallets on behalf of users, and manage the private keys. Here is an example of how to use the developer-controlled wallet:

```javascript
import { Web3Sdk } from "@meshsdk/web3-sdk";
 
const sdk = new Web3Sdk({
  projectId: "11111111-2222-3333-4444-555555555555",
  apiKey: "11111111-2222-3333-4444-555555555555",
  networkId: 0, // 0: testnet, 1: mainnet
  privateKey: "ENTITY_SECRET_PRIVATE_KEY_HERE",
});

const wallet = await sdk.wallet.createWallet();
```

### Wallet API

Here are a few endpoints you can use with the wallet:

#### Get change address

Get a change address for the wallet.

```javascript
const changeAddress = await wallet.getChangeAddress();
```

#### Get wallet's UTXO

Get all UTXOs for the wallet.

```javascript
const utxos = await wallet.getUtxos();
```

#### Sign transaction

```javascript
const signedTx = await wallet.signTx(tx, partialSign?);
```

## Acceptance criteria #2

> Public url on MeshJS Github at: https://github.com/MeshJS 

All source code can be found in Mesh's Repo, specifically for this milestone, the start of these functions can be found in these files:
- https://github.com/MeshJS/web3-sdk/blob/main/src/wallet-user-controlled/index.ts
- https://github.com/MeshJS/web3-sdk/blob/main/src/sdk/wallet-developer-controlled/index.ts
- https://github.com/MeshJS/web3-sdk/blob/main/src/sdk/index.ts

## Acceptance criteria #3

> Code licensed under open source licence on MeshJS GitHub

All source code is licensed under the Apache License, which can be found in the root of the repository: https://github.com/MeshJS/web3-sdk/tree/main?tab=Apache-2.0-1-ov-file#readme
