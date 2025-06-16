|Project ID|1200147|
|-----------|-------------|
|Link|[Open full project](https://projectcatalyst.io/funds/12/f12-cardano-open-developers/mesh-new-features-to-improve-developer-experience-and-cardano-adoption)|
|Milestones|[Milestone 4](https://milestones.projectcatalyst.io/projects/1200147/milestones/4)
|Challenge|F12: Cardano Open: Developers|
|Budget|ADA 40,000.00|
|Delivered|December 18, 2024|



## Milestone 4 Report


Hey there Milestone reviewers, voters and anyone follwoing the progress of our proposal. We are gald to also have completed Milestone 4 of the proposal, now being fully on track with previous delays.

Our Milestone acceptance criteria has been stated as:

- Finalised Modular CSL lib: Refactor to dependency injection pattern and integrate with new pattern
- Finalised Mesh Wallet: Yaci support development
- Finalised Mesh Wallet: Documentation
- Finalised Modular CSL lib: Documentation
- All code licensed under open source licenses on the MeshJS github
- 
Here our proof-of-achievement for the completion of the milestone outcomes.

### Finalised Modular CSL lib: Refactor to dependency injection pattern and integrate with new pattern


Both CSLSerializer and CardanoSDKSerializer have been implemented with dependency injection pattern. CSLSerializer is feature complete and CardanoSDKSerializer is currently undergoing beta testing.

- CSLSerializer: https://github.com/MeshJS/mesh/blob/main/packages/mesh-core-csl/src/core/serializer.ts
- CardanoSDKSerializer: https://github.com/MeshJS/mesh/blob/main/packages/mesh-core-cst/src/serializer/index.ts

### Finalised Mesh Wallet: Yaci support development

The Yaci Provider is completed and its documentation can be found on MeshJS website which includes all the methods, their descriptions and live demos, making it easy and effective for developers to use for their own projects.

- https://meshjs.dev/providers/yaci
  
### Finalised Mesh Wallet: Documentation

Full Mesh-wallet is completed and the documentation can be found on MeshJS website which includes all the methods, their descriptions and live demos.

- https://meshjs.dev/apis/wallets/meshwallet
  
### Finalised Modular CSL lib: Documentation

Full Modular CSL lib documentation is completed as well, the documentation can be found on MeshJS website where users can specify either CSLSerializer or CardanoSDKSerializer or their own custom serializer.

- Documentation: https://meshjs.dev/apis/txbuilder/basics#initializeTxbuilder
- CSLSerializer: https://github.com/MeshJS/mesh/blob/main/packages/mesh-core-csl/src/core/serializer.ts
- CardanoSDKSerializer: https://github.com/MeshJS/mesh/blob/main/packages/mesh-core-cst/src/serializer/index.ts
  
### All code licensed under open source licenses on the MeshJS github

As usual at Mesh, all work is open source and publicly accessible, ensuring that builders can make direct use of our work. All code is licenced under Apache 2.0 licences on the Mesh github, which can be found at:

All Modular CSL lib and Mesh Wallet components are licenced under: 
- https://github.com/MeshJS/mesh?tab=Apache-2.0-1-ov-file#readme


------

And thats it for Milestone Number 4. We are glad that we have been able to catch up with the previous delay and actively working on Milestone 5 now.

