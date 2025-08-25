
[GENERAL] Proposal title  
Mesh - Mimir: Optimising open source Docs & Tools for AI use


[GENERAL] Budget
100,000 Ada


[GENERAL] Problem Statement

More and more devs using AI models in day to day coding tasks, yet, due to lack of ai-compatible tools & docs, ai models often output low quality making it difficult to use ai for onchain development

[GENERAL] Summarize your solution to the problem (200-character limit including spaces)

With Mesh Mimir, we build solutions to optimise and upgrade open source tools and docs for ai models, ensuring that ai is able to provide more accurate quality code when building on cardano


[SOLUTION]

Mimir comprises a set of tools that are geared towards the AI era of web3 coding.

With the Mesh SDK we have seen demand for ready to use libraries that allow building seamless offchain code. Yet, we experince that building applications on Cardano using AI assistance remains challenging due to hallucination and blockchain's inherent complexities.

Hence we are looking at a number of approaches that aim to minimize hallucination as well as enhance LLM's (Large Language Model) abilities to comprehend complexities and their security implications.
Initially this requires improving the documentation on multiple levels. Starting with code interfaces which shall be used by the LLM. Then a broader set of examples that show and explain common use cases in clear standardised formats. Important is that these formats require continued refining to enable meaningful code understanding and utilization by AI systems. This also requires a holistic approach as there is not just one source of information in our decentralized ecosystem. Hence AI optimised public documentation, which is included in the training data for upcoming AI models, lays the foundation.

The next step focuses on Context Engineering and has the goal to optimize the flow of relevant information towards the LLM. A key part of this process is the introduction of Retrieval-Augmented Generation (RAG) as a foundational system, which allows the LLM to pull in accurate, up-to-date documentation at any instance. Instead of relying only on what it learned during the training, the LLM can now retrieve up to date documentation, interface definitions, and examples from a structured knowledge base. This helps to reduce hallucination and ensures that the LLM reflects the current state of Mesh and wider Cardano tooling.

One important improvement in this process is Contextual Retrieval. Unlike regular retrieval methods that only use embeddings or keyword search, Contextual Retrieval adds an extra LLM call during preprocessing. This call generates a short, specific context for each chunk of the document. This context is then added to the chunk before creating embeddings and search indexes. By adding this background information, the system makes sure the LLM gets the most accurate and relevant information. This improves retrieval a lot because it keeps important context that normally gets lost when documents are split into smaller parts.

RAG acts as the link between live documentation and LLM reasoning. Its usefulness depends on how well the underlying material is written and organised, which is why efforts to improve coverage and clarity are so important. As the quality of the documentation improves, so does the LLM's ability to assist accurately. This lays the groundwork for the next stages, where LLMs go beyond suggestions and begin interacting directly with blockchain through MCP servers and the code they help to write.

Now that the LLM has a solid understanding of coding with Mesh and is able to assist in a helpful manner, MCP Servers (Model Context Protocol) come into play. These servers allow an AI agent to call external tools. We want to wrap the existing Mesh functionalities in MCP Server tools. This allows an Agent to interact directly with the blockchain. Initially this is geared towards testing in a testnet environment, but other applications remain to be seen. Additionally MCP Servers act as a bridge into the AI powered IDEs (Integrated development environments), allowing us to serve relevant documentation and additional contextual information during an agent's runtime. Enabling coding agents to make informed and increasingly sensible decisions when building dApps on Cardano.

Finally we do not want to build our solution in a silo! Thus we are focusing on a Collaboration driven approach for building out these tools. In this kick off proposal we will collaborate with No.Witness labs to cross test each other's AI compatibility.

[IMPACT]

[IMPACT] Please define the positive impact your project will have on the wider Cardano community

Giving LLMs a rich understanding of the Mesh SDK, will have a significant impact on the developer experience building on Cardano. Mesh is already used by many first time and seasoned Cardano developers and with Mimir these developers will have a powerful AI assistant at their side to help them navigate the numerous complexities.
Furthermore this lays the foundation for deeper AI web3 interaction as AI usage shifts from assisting towards agentic behaviour. With initial steps involving vibe-coding and spec-driven coding agents. Moving towards increasingly autonomous agents directly interacting with blockchains through MCP servers and the code they wrote.
Impact Factors:
Better DevEx
Lower Barrier to entry for new Cardano developers
Groundwork for agentic web3 tooling
Collaboration and exchange of expertise in the ecosystem

Overall envisioned impact is to make it more fast, safe and reliable for AI models to carry out developer tasks, eventually enabling:

Improved onboarding: AI-native devs (the majority of new devs) will get accurate, fast, contextual help when building on Cardano with Mesh.

Increased Developer productivity: Cuts time spent searching docs, guessing UTxO logic, or debugging code while improving code generation and its quality carried out by AI models

Ecosystem-first: Sets a standard that other Cardano SDKs or projects can easily adopt and adapt to improve AI compatibility. Also a great CIP candidate.

Long-term value: Lays the foundation for effective tools for AI agents to interact with, enables new clients, ensures long-term compatibility while accessing new markets

[CAPABILITY & FEASIBILITY]

[CAPABILITY & FEASIBILITY] What is your capability to deliver your project with high levels of trust and accountability? How do you intend to validate if your approach is feasible?

Mesh has been a longtime contributor to the cardano open source developer ecosystem. Our tools are widely used and we have proven our skills and commitment by building and maintaining essential tools which empower many to build on cardano since 2022. Over the time, by non-stop breathing and building Cardano, we have gained some finest expertise which makes it quite likely that we are able to validate and achieve our proposal objectives properly. 

We are also proud and glad to have participated in catalyst since Fund 10, and as of today, we are well familiar with the process of completing proposals. For more information about all our funded proposals, their progress and details, we have built a dashboard which makes it easy for you to assess and audit our capabilities of delivering on our promises keeping the style of "don't trust, verify":
https://gov.meshjs.dev/catalyst-proposals 

Furthermore, we already have experience writing documentation and also interactive documentation for human developers. Now we are applying this expertise towards AI driven developers.

This new set of developers has different needs. Hence we are reformatting and enhancing existing material, which is well with our scope of capabilities.
Additionally we have already begun building MCP servers to test our AI integration. This Proposal is meant to scale our efforts towards a comprehensive solution. 

[PROJECT MILESTONES]

[PROJECT MILESTONES] What are the key milestones you need to achieve in order to complete your project successfully?

1. Optimize Documentation

In the first Milestone we are re -factoring and -formating our documentation on all levels to meet the requirements of AI driven developements.

Milestone timeline: December 2025
Milestone Budget: 25.000 ADA
Milestone outcomes: 

- Refactored code base featuring ai-optmised  inline documentation.
- Improved web docs focusing on scrapability and compatability with AI systems
- Create & publish a twitter thread to inform the public

Acceptance criteria: 

- Completed Refactoring of  code base featuring ai-optmised  inline documentation
- Completed web docs page focusing on scrapability and competability with AI systems
- Published twitter thread to inform the public on milestone achievements

Evidence of milestone completion:

- Link to the respective Pull requests adding inline documentation
- Link to the refined web docs page, containing AI ready documentation
- Link to a twitter thread to inform the public

2. Build Context Engineering Toolset

Milestone timeline: January 2026
Milestone Budget: 25.000 ADA
Milestone outcomes:

- Develop a RAG driven AI assistent embeded in the web docs page.
- Create & publish a twitter thread to inform the public
- Provide URLs to the relevant Pull Requests adding the RAF driven ai-assistent to the code-base

Acceptance criteria:

- Completed web docs integrated AI chat using our RAG solution.
- Published twitter thread to inform the public
- Share link to the relevant Pull Requests adding the RAF driven ai-assistent to the code-base

Evidence of milestone completion:
- Link to additinoal feature "Ask AI" in web docs page.
- Link to twitter thread to inform the public
- Links to relevant Pull Requests adding the RAF driven ai-assistent to the code-base

3. Build MCP Servers

Milestone timeline: February 2026
Milestone Budget: 20.000 ADA
Milestone outcomes:

- Mesh-providers MCP for querying Blockchain state, utilizing and covering the Blockfrost API.
- Mesh-core MCP for using Mesh's low level features.
- Mesh-transaction MCP for contructing and submitting Transactions

Acceptance criteria: 

- Completed Mesh MCP Providers.
- Completed Mesh MCP Core.
- Completed Mesh MCP Transactions
- Published twitter thread to inform the public

Evidence of milestone completion:

- Public MCP Servers with reasonable rate-limits, as well as their open- source code.
- Link to twitter thread to inform the public

4. Refine Flow & Integration Tests

Milestone timeline: May 2026
Milestone Budget: 20.000 ADA
Milestone outcomes:

- Comprehensive testing and refining  of the software products built in the previous milestones.
- Colaboratory peer testing with No.Witness labs.
- Discord bot to showcase the MCP servers abilities.

Acceptance criteria:

- Completed overview of internal testing efforts.
- Completed Test Report for our partner No.Witness labs.
- Completed Discord bot with small but reasonable rate-limits for bot usage. (AI API usage has significant operational cost and in this only for showcasing puposes.)
- Published twitter thread to inform the public

Evidence of milestone completion: 

- Link to Collaboratory Test Reports and Discord bot with on-request test access.
- Link to Twitter thread to inform the public
- Links to relevant Pull Requests adding the milestone outcomes to the code-base

5. Wrap up and final Documentation

Milestone timeline: June 2026
Milestone Budget: 10.000 ADA
Milestone outcomes:

- Create and submit Proposal Close Out Report
- Create and submit Proposal Close Out Video
- Create Docs and step-bystep-guide for users on how to use the tools
- Create a twitter thread on the milestones completion to inform the public
- License all code on a public github repository under a open source licence

Acceptance criteria:

- Completed Close Out Report
- Completed Close Out Video
- Completed how-to-use guides and Docs
- Published twitter thread to inform the public
- Published all code under open source licence

Evidence of milestone completion: 

- Link to completed Close Out Report
- Link to completed Close Out Video
- Link to completed guides and Docs
- Link to the project repository on Mesh github with an active open source license 
- Link to Twitter thread to inform the public

[RESOURCES]

[RESOURCES] Who is in the project team and what are their roles?

Quirin: The Project is lead by Quirin, Mesh Lead Developer on the Mesh-Mulitisg and Mesh-Mimir, an experienced longterm contributor and developer in the Cardano open source dev ecosystem
https://github.com/QSchlegel

Santosh: A young developer who joined Mesh in Q2 2025 with a strong development background in AI which brings in the very experience & expertise needed for high quality solutions for Web3 <> AI tools & tooling
https://github.com/smutyala1at 

Mesh Contributors: Since Mesh Mimir impacts the Mesh internal projects in general, further Mesh devs will opt in/out to help on specific worktasks, making sure that we always have all developer capacities rdy when needed and well aligned to ensure that our general stack is able to effectively adapt/adopt to Mesh-ai features and utilities.
https://gov.meshjs.dev/contributors

[BUDGET & COSTS]

[BUDGET & COSTS] Please provide a cost breakdown of the proposed work and resources

The budget breakdown of the proposal deliverables, already outlined in the Proposal Milestones, consists of: 

Milestone 1 Budget: 25,000.00 ADA
Milestone 2 Budget: 25,000.00 ADA
Milestone 3 Budget: 20,000.00 ADA
Milestone 4 Budget: 20,000.00 ADA
Milestone 5 Budget: 10,000.00 ADA

[VALUE FOR MONEY]

[VALUE FOR MONEY] How does the cost of the project represent value for money for the Cardano ecosystem?

The clearest way for open-source tools to demonstrate "value for money" is through real usage data by looking at how actively the code is adopted across the developer ecosystem and by which kinds of projects. At Mesh, more than 900 dependent projects currently use our code, with around 10k npm package downloads each month. This positions Mesh as one of the most widely adopted open-source stacks in the Cardano ecosystem, supporting projects across the full spectrum of use cases. These metrics show that the budgets we receive translate directly into solutions that are practical, widely used, and that solve real developer problems.

Funding from this proposal allows us to reward contributors and maintainers of the codebase, while ensuring that all projects depending on Mesh continue to benefit from a rich, constantly evolving feature set—available entirely free, without paywalls, and protected by an open-source license.

For a deeper look into Mesh usage metrics in 2025, see: Mesh Stats.
https://gov.meshjs.dev/mesh-stats 

With Mesh Mimir, our goal is to achieve adoption metrics on par with our other open-source tools. As a fully open-source project, Mimir aims to improve the developer experience for projects building on Cardano, making development faster, safer, and AI-ready.

2) A movement, starting with a project

We are in the age of AI, yet using AI for Cardano development remains difficult (tbh, AI currently simply sucks at Web3 coding-tasks). The inherently decentralized nature of the ecosystem means there is no single source of truth (SSoT) for AI to reliably draw from, so, its not rly easy to get AI understanding context of input and expecting high quality output. Mimir is designed to close that gap—not by enforcing a central SSoT, but by providing dedicated tooling that acknowledges AI as part of the community and supports its effective use.

As one of the most widely adopted SDKs in the Cardano ecosystem, Mesh is well-positioned to, indeed, take a leading role in making Cardano accessible to AI models and all developers who are using more and more AI tools to improve their capacities and perfomances. Furthermore, by orienting Mesh towards AI usability, we aim to gain & gather expertise, refine best practices, and share these insights with other projects across the ecosystem while encouraging collaborations to join our efforts to make Cardano development more AI-friendly and effective. Our collaboration with No.Witness Lab is a first spark and we look forward to initiate further collaborations with Cardano dev-projects since no single entity is able to solve the issues we address. Apes strong together, you know.. ^^



