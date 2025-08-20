

[GENERAL] Proposal title
Mesh: Cross Chain production-ready wallet SDK
[GENERAL] Name and surname of main applicant
Mesh

[GENERAL] Budget
100,000 Ada

[GENERAL] What is the exact problem you want to solve? (200-character limit including spaces)
Developers face fragmented wallet integrations across Cardano and Bitcoin, with no unified, developer-friendly SDK for multi-chain wallet interfaces and modules

[GENERAL] Summarize your solution to the problem (200-character limit including spaces)
Deliver a cross-chain wallet SDK with unified interfaces, Cardano & Bitcoin core modules, developer-friendly wallets, docs & packaging


[SOLUTION] Please describe your proposed solution.

So, since we are always keen to further enhance and update our open source stack and to make it as easy as possible for devs to build on Cardano, we come with this proposal which will deliver a production-ready, cross-chain wallet SDK that simplifies and unifies wallet integration for developers. The process begins with developing standardized interfaces, including a multi-chain wallet interface, core Bitcoin and Cardano interfaces, a Bitcoin interface, and a CIP30 interface. These interfaces provide the foundation for consistency and usability across chains.
Building on this, the project will implement and deploy core modules for both Cardano and Bitcoin. These modules will handle essential wallet logic such as secret phrase and key generation, address creation, syncing, signing, and verification, providing robust and reliable foundations for application development.
To further improve usability, the SDK will deliver developer-friendly wallets, including a CIP30 headless wallet for Cardano with the latest features, and a Bitcoin headless wallet with standard endpoints. These headless wallets are tailored for developer testing and integration, making it easier to embed blockchain functionality into applications.
The final stage of the project will focus on packaging, documentation, and reporting. The SDK will be packaged as a library, published to NPM, and fully documented within Mesh Playground. Developers will receive detailed guidance on implementation, while a close-out report and video will ensure transparency and accessibility for the community.
A simple & solid step-by-step approach guarantees that the SDK will not only be cross-chain but also production-ready, consistent, and easy to adopt for developers building on Cardano and Bitcoin.

[IMPACT] Please define the positive impact your project will have on the wider Cardano community.
Leveling up the Mesh open source stack, this proposal will lower barriers for developers by providing a unified SDK that simplifies cross-chain wallet integrations between Cardano and Bitcoin. By delivering consistent interfaces, core modules, and developer-friendly wallets, the SDK empowers builders to focus on creating high-quality applications rather than solving fragmented wallet challenges. This accelerates dApp development, fosters interoperability, and strengthens Cardano’s position as a developer-friendly ecosystem. With clear documentation, packaging, and open-source availability, the SDK will serve as a reliable, production-ready foundation for teams of all sizes, ultimately driving adoption, innovation, and collaboration in the wider Cardano community

[CAPABILITY & FEASIBILITY] What is your capability to deliver your project with high levels of trust and accountability? How do you intend to validate if your approach is feasible?

Mesh has been a longtime contributor to the cardano open source developer ecosystem. Our tools are widely used and we have proven our skills and commitment by building and maintaining essential tools which empower many to build on cardano since 2022. Over the time, by non-stop breathing and building Cardano, we have gained some finest expertise which makes it quite likely that we are able to validate and achieve our proposal objectives properly. 

We are also proud and glad to have participated in catalyst since Fund 10, and as of today, we are well familiar with the process of completing proposals. For more information about all our funded proposals, their progress and details, we have built a dashboard which makes it easy for you to assess and audit our capabilities of delivering on our promises keeping the style of "don't trust, verify”:
https://gov.meshjs.dev/catalyst-proposals 
[Project Milestones] What are the key milestones you need to achieve in order to complete your project successfully?
# Mesh New Wallet - Fund 14 Catalyst Proposal Milestones

## Project Overview
Development of comprehensive wallet interfaces and core modules for the Mesh SDK ecosystem.

## Milestones

### Milestone 1 - Wallet Interfaces Development
**Budget:** ₳20,000.00  
**Timeline:** December 2025

#### Outcomes:
- Develop Interfaces:
  - Develop Multi-chain wallets interface
  - Develop Core bitcoin interface
  - Develop Core cardano interface
  - Develop Bitcoin interface
  - Develop CIP30 interface
- Post a twitter thread to inform the public

#### Acceptance Criteria:
- Complete development for interfaces for all wallets such as:
  - completed development of the Multi-chain wallets interface
  - completed development of the Core bitcoin interface
  - completed development of the Core cardano interface
  - completed development of the Bitcoin interface
  - completed development of the CIP30 interface
- Post a twitter thread to inform the public

#### Evidence of Completion:
- Public link to the developed code on Mesh GitHub
- Public link to post on Twitter/X to inform the Public

---

### Milestone 2 - Wallet Core Development
**Budget:** ₳20,000.00  
**Timeline:** January 2026

#### Outcomes:
- Wallet core:
  - Develop and deploy Cardano core module
  - Develop and display Bitcoin core module
  - Publish all code base updates on the respective github repository
- Post a twitter thread to inform the public

#### Acceptance Criteria:
- Completed development for wallet core module, including
  - Implementation of base logic for wallet
  - Generation of secret phrase and all keys
  - Building all addresses, like payment, stake, DRep, script addresses
  - sync wallet
  - sign transactions
  - sign data and verify signatures
- Post a twitter thread to inform the public

#### Evidence of Completion:
- Public link to the developed code on Mesh GitHub
- Public link to post on Twitter/X to inform the Public

---

### Milestone 3 - Cardano Developer Friendly Wallets
**Budget:** ₳20,000.00  
**Timeline:** February 2026

#### Outcomes:
- Cardano developer friendly wallets:
  - develop and deploy a CIP30 headless wallet
  - Publish all code base updates on the respective github repository
- Post a twitter thread to inform the public

#### Acceptance Criteria:
- Completed development of mesh wallet with all latest CIP30 features
- Published code-base updates at the respective github repository
- Published a twitter thread to inform the public

#### Evidence of Completion:
- Public link to the developed code on Mesh GitHub
- Public link to post on Twitter/X to inform the Public

---

### Milestone 4 - Bitcoin Developer Friendly Wallets
**Budget:** ₳20,000.00  
**Timeline:** March 2026

#### Outcomes:
- Bitcoin developer friendly wallets:
  - develop a Bitcoin "standard" headless wallet
  - Publish all code base updates on the respective github repository
- Post a twitter thread to inform the public

#### Acceptance Criteria:
- Completed development of bitcoin wallet with all the standard endpoints
- Published code-base updates at the respective github repository
- Published a twitter thread to inform the public

#### Evidence of Completion:
- Public link to the developed code on Mesh GitHub
- Public link to post on Twitter/X to inform the Public

---

### Milestone 5 - Packaging, Documentation & Reporting
**Budget:** ₳20,000.00  
**Timeline:** April 2026

#### Outcomes:
- Packaging, Documentation & Reporting
  - Add documentation to Mesh Playground
  - Package the wallet as a library
  - Publish to NPM
  - Close out Report
  - Close out Video
  - Publish all code base updates on the respective github repository
- Post a twitter thread to inform the public

#### Acceptance Criteria:
- Completed Packaging
- Completed Docs for Developers
- Completed Close Out Report
- Completed Close Out Video
- Published code-base updates at the respective github repository
- Published a twitter thread to inform the public

#### Evidence of Completion:
- Public link to the developed code on Mesh GitHub
- Public link to Documentation for developers
- Public link to the Close Out Report
- Public link to the Close Out Video
- Public link to post on Twitter/X to inform the Public


[RESOURCES] Who is in the project team and what are their roles?


The proposal tasks will be distributed amongst well experienced Mesh contributors which will individually opt in/out at respective milestone tasks to ensure that we always have all capacities needed to achieve our deliverables. You can learn more about our contributors community at:
https://gov.meshjs.dev/contributors 

[BUDGET & COSTS] Please provide a cost breakdown of the proposed work and resources.

The budget breakdown of the proposal deliverables, already outlined in the Proposal Milestones, consists of: 
Milestone 1: Interfaces
Budget: 20,000.00 Ada

Milestone 2: Wallet Core
Budget: 20,000.00 Ada

Milestone 3: Cardano developer friendly wallets
Budget: 20,000.00 Ada

Milestone 4: Bitcoin developer friendly wallets
Budget: 20,000.00 Ada

Milestone 5: Packaging, Documentation & Reporting
Budget: 20,000.00 Ada
[VALUE FOR MONEY] How does the cost of the project represent value for money for the Cardano ecosystem?
The most reliable way for open-source tools to show their “value for money” is by looking at real usage data-checking how actively the code is used across the developer ecosystem and identifying how many, and what kind of, projects build with our tooling. At Mesh, we currently see over 800 dependent projects making use of our SDK, with around 10k npm downloads every month. This makes Mesh one of the most widely adopted Cardano open-source stacks, supporting projects across the entire spectrum to build on Cardano. These numbers show clearly that the budgets we receive translate into strong metrics, proving that treasury funds are effectively used to deliver solutions that are practical, useful, and solve real developer problems.
The funds from this proposal directly enable us to reward contributors and maintainers of the codebase, while also ensuring that all projects depending on Mesh continue to benefit from a constantly evolving set of features available entirely free, without paywalls, and safeguarded by an open-source license. 


