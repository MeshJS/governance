|Project ID|1200148|
|-----------|-------------|
|Link|[Open full project](https://projectcatalyst.io/funds/12/f12-cardano-use-cases-concept/mesh-software-as-a-service)|
|Milestone|[Milestone 3](https://milestones.projectcatalyst.io/projects/1200148/milestones/3)
|Challenge|F12: Cardano Use Cases: Concept|
|Milestone Budget|ADA 20,000.00|
|Milestone Delivered|April 7, 2025|

# Mesh Software as a Service: Milestone 3
https://milestones.projectcatalyst.io/projects/1200148/milestones/3

## Acceptance criteria #1

> Finalised Server application code - user-defined transaction building (what parameters are supplied, how to get info) -> expose dedicated endpoints for customized transactions (Note: the code has to be seen more as a developer tools, not end user tool. These transaction building is used to support frameworks and projects that has not have access to cardano serialization where developers / projects can define a certain JSON format, to build those transactions.)

To create user-define transaction is easy. User simply define the custom transaction in the form of JSON. Our hosted endpoint will convert the JSON to a valid Cardano transaction and return the transaction CBOR. This is useful for developers who wants to build transactions on any platform and this method does not need to integrate with any Cardano library.

For instance, developers create a transaction defined in JSON like:
```
{
  "inputs": [
    {
      "type": "PubKey",
      "txIn": {
        "txHash": "e93177a68356dc4bfdec2ec8ac48efe4c43c2d8a5fa8a9ebbc4437943c695438",
        "txIndex": 0,
        "amount": [{ "unit": "lovelace", "quantity": "2833223" }],
        "address": "addr_test1qr3a9rrclgf9rx90lmll2qnfzfwgrw35ukvgjrk36pmlzu0jemqwylc286744g0tnqkrvu0dkl8r48k0upkfmg7mncpqf0672w"
      }
    },
    {
      "type": "PubKey",
      "txIn": {
        "txHash": "fb9324c5461693f729b0a7fdab1646a79b8f439b50dc9bc85458d3ee1ca2b40b",
        "txIndex": 0,
        "amount": [{ "unit": "lovelace", "quantity": "2306918390" }],
        "address": "addr_test1qr3a9rrclgf9rx90lmll2qnfzfwgrw35ukvgjrk36pmlzu0jemqwylc286744g0tnqkrvu0dkl8r48k0upkfmg7mncpqf0672w"
      }
    }
  ],
  "changeAddress": "addr_test1qr3a9rrclgf9rx90lmll2qnfzfwgrw35ukvgjrk36pmlzu0jemqwylc286744g0tnqkrvu0dkl8r48k0upkfmg7mncpqf0672w",
  "selectionConfig": {
    "threshold": "0",
    "strategy": "experimental",
    "includeTxFees": true
  },
  "network": "preprod"
}
```

And post the data to the endpoint, [https://cloud.meshjs.dev/transaction](https://cloud.meshjs.dev/transaction) with the JSON payload. The endpoint will return the transaction CBOR.

![Screenshot 2025-03-21 at 9.28.41 AM](https://hackmd.io/_uploads/rJ7JMS5hJg.png)

## Acceptance criteria #2

> All code licensed under open source licenses on MeshJS github 

The source code can be found on GitHub https://github.com/MeshJS/mesh-saas
