const dRepMetadata = {
  "@context": {
    "@language": "en-us",
    CIP100: "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#",
    CIP108: "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0108/README.md#",
    CIP119: "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0119/README.md#",
    hashAlgorithm: "CIP100:hashAlgorithm",
    body: {
      "@id": "CIP119:body",
      "@context": {
        references: {
          "@id": "CIP119:references",
          "@container": "@set",
          "@context": {
            GovernanceMetadata: "CIP100:GovernanceMetadataReference",
            Other: "CIP100:OtherReference",
            label: "CIP100:reference-label",
            uri: "CIP100:reference-uri",
            referenceHash: {
              "@id": "CIP108:referenceHash",
              "@context": {
                hashDigest: "CIP108:hashDigest",
                hashAlgorithm: "CIP100:hashAlgorithm"
              }
            }
          }
        },
        comment: "CIP100:comment",
        externalUpdates: {
          "@id": "CIP100:externalUpdates",
          "@context": {
            title: "CIP100:update-title",
            uri: "CIP100:update-uri"
          }
        },
        paymentAddress: "CIP119:paymentAddress",
        givenName: "CIP119:givenName",
        image: {
          "@id": "CIP119:image",
          "@context": {
            ImageObject: "https://schema.org/ImageObject"
          }
        },
        objectives: "CIP119:objectives",
        motivations: "CIP119:motivations",
        qualifications: "CIP119:qualifications",
        title: "CIP108:title",
        abstract: "CIP108:abstract",
        rationale: "CIP108:rationale"
      }
    },
    authors: {
      "@id": "CIP100:authors",
      "@container": "@set",
      "@context": {
        name: "http://xmlns.com/foaf/0.1/name",
        witness: {
          "@id": "CIP100:witness",
          "@context": {
            witnessAlgorithm: "CIP100:witnessAlgorithm",
            publicKey: "CIP100:publicKey",
            signature: "CIP100:signature"
          }
        }
      }
    }
  },
  authors: [
    {
      name: "MESH",
      witness: {
        publicKey: "",
        signature: "",
        witnessAlgorithm: ""
      }
    }
  ],
  hashAlgorithm: "blake2b-256",
  body: {
    comment: "Mesh is an open-source project focused on building quality developer tools for Web3 builders at the Cardano Ecosystem. The Mesh DRep is operated collectively by Mesh core contributors.",
    externalUpdates: [],
    abstract: "Mesh is an open-source project focused on building quality developer tools for Web3 builders at the Cardano Ecosystem. The Mesh DRep is operated collectively by Mesh core contributors.",
    rationale: "",
    title: "MESH - DRep",
    givenName: "MESH",
    image: {
      "@type": "ImageObject"
    },
    motivations: "The biggest threat to Governance is apathy, or worse, uninformed engagement. As long-time Cardano builders, we see it as our responsibility to participate meaningfully in Cardano’s governance. It matters to us because we build on it every day",
    objectives: "We are a no-drama, no-politics DRep. We don’t engage in public disputes nor do we take side with any political entities or parties. We prefer writing code over tweeting, and contributing over disrupting",
    paymentAddress: "addr1zy4uesaj92wk8ljlsh4p7jzndnzrflchaz5fzug3zxg4nayafhxhu32dys6pvn6wlw8dav6cmp4pmtv7cc3yel9uu0nqn6xrah",
    qualifications: "We’ve been building non-stop on Cardano for years. We’re experienced developers with a deep personal and professional stake in the ecosystem. Governance affects our work and our future, so we’re here to help guide it with integrity and care",
    references: [
      {
        "@type": "Link",
        label: "https://meshjs.dev/",
        uri: "https://meshjs.dev/"
      }
    ]
  }
};
