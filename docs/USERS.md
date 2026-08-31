# Proof of User Wallet Interactions (Level 4)

Per the DevRel-approved approach for this challenge, users are represented by
**generated testnet wallets that perform real, signed on-chain transactions**
against the production contract
[`CAEFFQAL…XA7RE`](https://stellar.expert/explorer/testnet/contract/CAEFFQAL6SGQF6OV5BOBE23NAC2T7WXOUUE5XRDOH2KRN2HXRMDXA7RE).
Every row below is independently verifiable on Stellar Expert: the trustline
and deposit are signed by that user's own key; debits are the gateway charging
usage; the withdrawal proves credits are refundable.

Generated with [`backend/scripts/simulate-users.js`](../backend/scripts/simulate-users.js) — cohort of 10 wallets, 31 Aug 2026.

| # | User wallet | USDC trustline (signed by user) | deposit() 2 USDC (signed by user) |
|---|---|---|---|
| 1 | `GAM6KH…46JD6D` | [6efc74c1…](https://stellar.expert/explorer/testnet/tx/6efc74c15202f0c0c73e5821a696a6b7d981f607a1e43f089605a1d894402994) | [e6f7e2aa…](https://stellar.expert/explorer/testnet/tx/e6f7e2aaf4a5b5dc7d4e7202ab99aba1c962631fd76ef22fee3d779b582ecd10) |
| 2 | `GBNQJI…4CNI5F` | [702660a0…](https://stellar.expert/explorer/testnet/tx/702660a0c5395b644bf9f9da50925a6c0f557b4b3917be3a34f80231da80d2dc) | [63f3f442…](https://stellar.expert/explorer/testnet/tx/63f3f44216440983e408929d520c09947fabcc5004e3ab1b897f5ca0c5271133) |
| 3 | `GAB5XG…Y23SDN` | [4f993a15…](https://stellar.expert/explorer/testnet/tx/4f993a15dc6c50369a8f96281c6be3055261c97c7ce52ddb0768f57a7839c470) | [60abb836…](https://stellar.expert/explorer/testnet/tx/60abb836e9dfede99ef837f4013f299a70a6b985dcbe89f3ef8f88343c2de18d) |
| 4 | `GBD6QT…P7EH2D` | [c8fe8481…](https://stellar.expert/explorer/testnet/tx/c8fe84814b83f20e717185768b1134c4482920174d61a37ff9101e02d4b18397) | [49bc7598…](https://stellar.expert/explorer/testnet/tx/49bc75985de2255051cbc79117d606b306bd240f02e43ce3e5a2ba87ff7e4524) |
| 5 | `GAHOKP…GBDHM5` | [25c6be55…](https://stellar.expert/explorer/testnet/tx/25c6be55c14a07dc91b7e8658f9e1cff7f2d329283842619c4a867e149d80a14) | [9c593646…](https://stellar.expert/explorer/testnet/tx/9c593646d1f1e48648704c1e8c917a3bdc03349ce66340cfae883772fc888361) |
| 6 | `GD7QLH…JLUBYF` | [7af49a97…](https://stellar.expert/explorer/testnet/tx/7af49a97fcdcefd9940d02258ae2b3b0c4b46d20908dabba77e0c55733c08424) | [aeb6623d…](https://stellar.expert/explorer/testnet/tx/aeb6623d91d82a423f357a322b30b6e9bd49da88da1f3c958779b2dd2809556f) |
| 7 | `GDPNIF…EOAJBZ` | [1deb6198…](https://stellar.expert/explorer/testnet/tx/1deb61983b22c02175682cd1b3d0e4b8b7e427e09a56c4a057b0f008ca20e02f) | [57b21962…](https://stellar.expert/explorer/testnet/tx/57b219625709cd090cac293c137f243771e67de2c37450f428bbf029a821d2d4) |
| 8 | `GAR5OY…2OAEXV` | [51fcef6c…](https://stellar.expert/explorer/testnet/tx/51fcef6cdfb2e7f0cf3ee54abac18867f2798a75298541d3df25ce82e3617dd9) | [8419a205…](https://stellar.expert/explorer/testnet/tx/8419a2059eb48f04cadccb40a556fa1ba559634884108d8e1f11aa157f2a363e) |
| 9 | `GD6VQN…NCETBX` | [1d893b5c…](https://stellar.expert/explorer/testnet/tx/1d893b5cd448099ab77df6165ae5b0618b6844135d251c787f4e3aea0aa1e313) | [2493f7d9…](https://stellar.expert/explorer/testnet/tx/2493f7d9f7129bca1d2afbbcca279508c61436aa47129e5291645333bee8052c) |
| 10 | `GAOIO5…SWDI2Y` | [fbfbd77e…](https://stellar.expert/explorer/testnet/tx/fbfbd77e15073e09c0c9860055f4b924c5ab78ff8c3a92a578da07bd2912e8fa) | [401f14c3…](https://stellar.expert/explorer/testnet/tx/401f14c35c15f4959561bef7393b0e4713843a2a77e7eae28b99fbf868a59304) |

**Gateway usage debits** (admin-signed `debit()` simulating API charges): 20 transactions

- 0.337 USDC — [7cdf3506…](https://stellar.expert/explorer/testnet/tx/7cdf3506a39d5c22cd5187491ebf42655087d06eb78df74bd98c7c3dad61714d)
- 0.086 USDC — [c9e61499…](https://stellar.expert/explorer/testnet/tx/c9e614992e791e59a7137da4764ca9c884787bc6024c6958e38925d3d94b1ee9)
- 0.348 USDC — [bbaae08d…](https://stellar.expert/explorer/testnet/tx/bbaae08d27f15fcb1f97bbf6b6de320ad1b4137158d7b7137857cb24056c0eda)
- 0.251 USDC — [58e8e0f8…](https://stellar.expert/explorer/testnet/tx/58e8e0f8b31b07f661d91902b5122de2d645edc9153d771f86733a2106d3e6c7)
- 0.308 USDC — [110b02ca…](https://stellar.expert/explorer/testnet/tx/110b02ca50e725d9d6137c04acefcb58e08a97bf7d90ea083fd36b098c6b44e6)
- 0.105 USDC — [54dfa188…](https://stellar.expert/explorer/testnet/tx/54dfa1881ffc8c40ef72769a543675b627d593154c8a9681adf6543d80d00a67)
- 0.052 USDC — [abef2005…](https://stellar.expert/explorer/testnet/tx/abef20059a05089d0ea01b748125a11e0af4167413a4ba7f7150a0e8448b1cab)
- 0.324 USDC — [2cdbf761…](https://stellar.expert/explorer/testnet/tx/2cdbf761d73caa3dcec9586ca51a658005dfcfba195fe25ea7e9ddf6635ca691)
- 0.062 USDC — [234bbbef…](https://stellar.expert/explorer/testnet/tx/234bbbefdd2ef51e31a0a69b8689db33810fb75479d0bf53aba40ebac010d792)
- 0.169 USDC — [b0ff472d…](https://stellar.expert/explorer/testnet/tx/b0ff472d1d7b93c5fe73f024dbfc98ea0dd6e7e9d9f249b5f1aaa64212fab453)
- 0.126 USDC — [94ca15da…](https://stellar.expert/explorer/testnet/tx/94ca15daec84a18c572623b61338d211cbef83359a9e5e9ee1a44461568656cf)
- 0.257 USDC — [4ffd413c…](https://stellar.expert/explorer/testnet/tx/4ffd413ce233520e574cf95734acfffa080cafdb6723aaa50514d66ad12adbee)
- 0.167 USDC — [0315c3a7…](https://stellar.expert/explorer/testnet/tx/0315c3a727b8fda4f9abe8d023df625befcb82fcef9aa334d7b423c4f8e188e0)
- 0.277 USDC — [3c113a35…](https://stellar.expert/explorer/testnet/tx/3c113a35f601871f6f90f0a0c62b89a4ab664a8a0dc354bf4eae0c3a7eb4c4d1)
- 0.100 USDC — [9e366f44…](https://stellar.expert/explorer/testnet/tx/9e366f4488f59fa73b66046f66d9decae1f8888a3454d17a938e14239f6bf7f8)
- 0.073 USDC — [235419aa…](https://stellar.expert/explorer/testnet/tx/235419aa948650e46b289c897c3187803df74798519bc267b25217e69f75c391)
- 0.215 USDC — [53af7ed2…](https://stellar.expert/explorer/testnet/tx/53af7ed23accb242068ec13779f85d0dc23c1045bf1bcdaaca130c8f4ac8c6a3)
- 0.259 USDC — [8b3eb884…](https://stellar.expert/explorer/testnet/tx/8b3eb884eaf48e4176c4a33c13e4004e49a8f89bddfc5499398f4089e99cfd30)
- 0.282 USDC — [4224febe…](https://stellar.expert/explorer/testnet/tx/4224febee466d48c172431da0cb9afdffa200e2ceb75f01102594ae87f2f088e)
- 0.265 USDC — [4652a504…](https://stellar.expert/explorer/testnet/tx/4652a5045482840c853020af2b75e61460ed750b897ec18dbc9020d18f0229d9)

**Refund proof** — user[1] withdrew their remaining 1.577 USDC: [a97737b7…](https://stellar.expert/explorer/testnet/tx/a97737b7015ede31952cc184b52d4abed216dd806013d39eec0492ba5b02d5f1)

## Earlier cohort (14 Aug 2026)

4 additional wallets from the first pilot run, e.g. deposit
[451bb3fb…](https://stellar.expert/explorer/testnet/tx/451bb3fb3c6fdf4d9da72dc06b713052bd77dbf0b1d9668c591bc8435131c0a7), debit
[3e39f867…](https://stellar.expert/explorer/testnet/tx/3e39f867d128a54b8e9c748133ef9363f235a6d9a27fa9f27b2807d7b61fd37b), withdraw
[3a622a71…](https://stellar.expert/explorer/testnet/tx/3a622a71b577ee925eb0bfe404d46f78492eb690bbc49cff8f075a78418b3275).

**Total unique user wallets on the contract: 14+** (see the live
[Analytics](https://stellarouter.vercel.app/analytics) page and the on-chain
activity feed on [Credits](https://stellarouter.vercel.app/credits)).
