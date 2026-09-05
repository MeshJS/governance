# Close Out Report


### Name of project and Project URL on IdeaScale/Fund
Mesh: Cross-Chain Production-Ready Wallet SDK

### Your Project Number
1400080

### Name of project manager
Jingles

### Date project started
January 2026

### Date project completed
September 2026

### List of challenge KPIs and how the project addressed them

This proposal was funded under **Cardano Open: Developers**, which requires funded projects to deliver open source technical tooling that strengthens the Cardano developer ecosystem. Below is how the project addressed each of the category's core requirements:

- **Open source licensing declared from day one** — The project was developed in the public [MeshJS/wallet](https://github.com/MeshJS/wallet) repository from Milestone 1 onward, and shipped as part of the [MeshJS/mesh](https://github.com/MeshJS/mesh) monorepo, which is licensed under Apache 2.0, an OSI-approved license. License: https://github.com/MeshJS/mesh/blob/main/LICENSE.md

- **Source-available from project start, on a public repository** — All development happened in the open on GitHub from the first milestone. Interfaces, core modules, and headless wallets were all pushed to public branches, PRs, and releases as they were built, rather than being open-sourced only at the end:
  - Milestone 1 (interfaces): https://github.com/MeshJS/wallet/blob/feature/bitcoin-wallet/src/multi-chain/interfaces/multi-chain-wallet.ts
  - Milestone 2 (Cardano & Bitcoin core modules): https://github.com/MeshJS/wallet/releases/tag/v2.0.0-beta.10
  - Milestone 3 (CIP30 headless wallet): https://github.com/MeshJS/wallet/pull/9
  - Milestone 4 (Bitcoin headless wallet): https://github.com/MeshJS/wallet/pull/10
  - Milestone 5 (final packaging): https://github.com/MeshJS/mesh

- **High-quality documentation available and updated regularly** — The SDK is fully documented on Mesh's developer documentation site, covering both the Bitcoin and Cardano wallet modules delivered by this proposal:
  - https://meshjs.dev/apis/wallets/bitcoin/headless-wallet
  - https://meshjs.dev/apis/wallets/bitcoin/browser-wallet
  - https://meshjs.dev/providers/bitcoin-blockstream
  - https://meshjs.dev/providers/bitcoin-maestro

- **Directly enhances the Cardano developer experience with Cardano-specific integration** — Rather than a generic multi-chain library, the SDK ships standardized, Cardano-native interfaces (CIP30, DRep/script/stake address support, transaction signing and data verification) alongside Bitcoin equivalents, unified under one multi-chain wallet interface. This removes the need for Cardano developers to hand-roll fragmented wallet integrations when building cross-chain dApps.

- **Fosters collaboration and community engagement** — Each milestone was accompanied by a public Twitter/X thread announcing progress to the wider community, keeping the developer ecosystem informed and engaged throughout delivery (see Milestones 1-4 evidence links). The final package was published to NPM as [@meshsdk/wallet](https://www.npmjs.com/package/@meshsdk/wallet), making it immediately installable by any Cardano developer.

- **Delivery timeline within 12 months** — The project ran from January 2026 to September 2026, within the category's 12-month delivery limit.

- **Primarily developing new open source technology (not a proprietary or non-technical output)** — The entire scope of the proposal was software engineering: new interfaces, wallet core logic, and headless wallet implementations, with no proprietary components and no portion of the codebase withheld from the public repository.

### List of project KPIs and how the project addressed them

The proposal defined five milestone-level KPIs. All five were completed:

- **KPI 1 — Wallet interfaces developed** (Milestone 1): Multi-chain wallet interface, core Bitcoin interface, core Cardano interface, Bitcoin interface, and CIP30 interface were all developed and published.
  - Evidence: https://github.com/MeshJS/wallet/blob/feature/bitcoin-wallet/src/multi-chain/interfaces/multi-chain-wallet.ts
  - Twitter: https://x.com/meshsdk/status/2017172545204576371

- **KPI 2 — Cardano and Bitcoin core modules implemented** (Milestone 2): Base wallet logic delivered, including secret phrase and key generation, generation of payment/stake/DRep/script addresses, wallet sync, transaction signing, and data signing/verification for both chains.
  - Evidence: https://github.com/MeshJS/wallet/releases/tag/v2.0.0-beta.10
  - Twitter: https://x.com/meshsdk/status/2064311926771814447

- **KPI 3 — Cardano developer-friendly wallet delivered** (Milestone 3): A CIP30 headless wallet implementing the latest CIP30 features was developed for Cardano, giving developers a lightweight way to test and integrate against a standards-compliant wallet.
  - Evidence: https://github.com/MeshJS/wallet/pull/9
  - Twitter: https://x.com/meshsdk/status/2076219961253446045

- **KPI 4 — Bitcoin developer-friendly wallet delivered** (Milestone 4): A standard Bitcoin headless wallet with the full set of standard endpoints was developed, mirroring the Cardano headless wallet's role for Bitcoin integrations.
  - Evidence: https://github.com/MeshJS/wallet/pull/10
  - Twitter: https://x.com/meshsdk/status/2086707767356567822

- **KPI 5 — Packaging, documentation & reporting completed** (Milestone 5): The wallet SDK was packaged as a library and published to NPM as [@meshsdk/wallet](https://www.npmjs.com/package/@meshsdk/wallet), with developer documentation published covering both the Bitcoin headless and browser wallets and their providers, alongside this close-out report and video.
  - Evidence: https://github.com/MeshJS/mesh, https://www.npmjs.com/package/@meshsdk/wallet
  - Docs: https://meshjs.dev/apis/wallets/bitcoin/headless-wallet, https://meshjs.dev/apis/wallets/bitcoin/browser-wallet, https://meshjs.dev/providers/bitcoin-blockstream, https://meshjs.dev/providers/bitcoin-maestro

Across all five milestones, every outcome and acceptance criterion outlined in the original proposal was met, and evidence (GitHub code, NPM package, documentation, and public Twitter/X threads) was published for each, keeping the project fully transparent and independently verifiable throughout delivery.

### Key achievements (in particular around collaboration and engagement)

- Delivered a unified, cross-chain wallet SDK spanning both Cardano and Bitcoin under a single set of standardized interfaces, a first for the Mesh open source stack.
- Kept the entire build cycle public and verifiable: every milestone shipped working code to public GitHub branches, PRs, or releases rather than holding work back until the end of the project.
- Published a public Twitter/X thread at the completion of every milestone, giving the wider Cardano and Bitcoin developer communities visibility into progress as it happened rather than only at project close.
- Shipped the finished SDK to NPM as [@meshsdk/wallet](https://www.npmjs.com/package/@meshsdk/wallet), making it immediately reusable by the 800+ projects and roughly 10k monthly downloads that already depend on the Mesh SDK ecosystem, without any additional integration overhead.
- Extended Mesh's existing Cardano tooling (CIP30, DRep/script/stake addresses) with equivalent Bitcoin primitives (secret management, address generation, signing) behind one multi-chain interface, directly supporting developers building interoperable Cardano/Bitcoin applications.

### Key learnings

- Coordinating parallel Cardano and Bitcoin core module development (Milestone 2) took longer than originally scoped for January 2026; the milestone ultimately delivered in June 2026. Aligning secret management, signing, and address-generation logic across two fundamentally different chains surfaced more edge cases than a single-chain module would have, which is a useful sizing input for future cross-chain proposals.
- Designing the standardized multi-chain wallet interface early (Milestone 1) before implementing the chain-specific core modules paid off: it kept the Cardano and Bitcoin implementations consistent and avoided rework later in the project.
- Publishing milestone-by-milestone rather than batching everything into one release made it easier for the community and milestone reviewers to verify incremental progress, and is a pattern worth reusing on future multi-milestone proposals.

### Next steps for the product or service developed

- Continue maintaining and hardening the `@meshsdk/wallet` package as part of Mesh's actively maintained open source SDK, incorporating community feedback and bug reports through the standard MeshJS GitHub workflow.
- Expand documentation and add further usage examples/tutorials in the Mesh developer docs and Playground to help developers onboard onto the cross-chain wallet APIs.
- Explore extending the multi-chain wallet interface pattern established here to additional chains beyond Cardano and Bitcoin, and gather adoption metrics (NPM downloads, dependent projects) to evaluate demand for further cross-chain modules.
- Monitor real-world usage of the CIP30 and Bitcoin headless wallets to identify additional standard endpoints or features worth adding in future funded proposals.

### Final thoughts/comments

This proposal allowed Mesh to close a real gap in the Cardano developer ecosystem: the lack of a unified, production-ready SDK for building applications that need to interact with both Cardano and Bitcoin wallets. By keeping every milestone open source, documented, and publicly announced from day one, the project stayed true to the Cardano Open: Developers category's core requirements throughout, not just at close-out. Thank you to the Catalyst community and milestone reviewers for their support and patience, particularly around the Milestone 2 delay, and to the wider Mesh contributor community for their work on delivery.

### Links to other relevant project sources or documents.

- Project GitHub (SDK monorepo): https://github.com/MeshJS/mesh
- Wallet module GitHub: https://github.com/MeshJS/wallet
- NPM package: https://www.npmjs.com/package/@meshsdk/wallet
- Developer documentation: https://meshjs.dev/apis/wallets/bitcoin/headless-wallet
- Mesh governance & proposal tracking dashboard: https://gov.meshjs.dev/catalyst-proposals
- Original Catalyst proposal: https://projectcatalyst.io/funds/14/cardano-open-developers/mesh-cross-chain-production-ready-wallet-sdk

### Link to Close-out video - must be either YouTube or Vimeo link only

