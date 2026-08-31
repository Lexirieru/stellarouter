# Proof of User Wallet Interactions (Levels 4–5)

On Stellarouter the wallet **is** the account — every user below is identified
by their wallet address, and every interaction is a real, signed transaction on
the Stellar testnet against the production contract
[`CAEFFQAL…XA7RE`](https://stellar.expert/explorer/testnet/contract/CAEFFQAL6SGQF6OV5BOBE23NAC2T7WXOUUE5XRDOH2KRN2HXRMDXA7RE).
Each row is independently verifiable on Stellar Expert: the USDC trustline and
the deposit are signed by that user's own key, debits are the gateway charging
usage, and withdrawals prove credits are refundable.

**50 users onboarded on 31 Aug 2026 (54 lifetime, incl. the 14/27 Aug pilots).**
Analysis export: [users-feedback.xlsx](./users-feedback.xlsx).

| # | User (wallet) | USDC trustline (signed by user) | deposit() (signed by user) |
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
| 11 | `GCKNGS…AE5AQZ` | [0523988a…](https://stellar.expert/explorer/testnet/tx/0523988ae9fef414b1ebdb2b9c595e03acb688780a7cab7cdeab12a37927843c) | [0677b07d…](https://stellar.expert/explorer/testnet/tx/0677b07d4848290858b950926c23352a3b10f3fcc8d56037e9cc84bd60ba937a) |
| 12 | `GDG27P…VBXCRE` | [dc51d7be…](https://stellar.expert/explorer/testnet/tx/dc51d7be355e7c8ba6d7f6f61784abd229f5c47f5bbc7ade3bc33538195385c0) | [c0098693…](https://stellar.expert/explorer/testnet/tx/c0098693aa5cef76871afd56f4b33fa209b1d9949c605d936ce77921467773a0) |
| 13 | `GAFVD2…XABGJJ` | [3caa8cab…](https://stellar.expert/explorer/testnet/tx/3caa8cab52717036193e8e8760c890baffc0c5e0342b2232c25ee4b291eb1865) | [24b7e079…](https://stellar.expert/explorer/testnet/tx/24b7e079edc45a0c8b8da11560e4f5fa9f458f381056cd18e1b6c48f212249d2) |
| 14 | `GDJBSA…MXNLKW` | [408c3a44…](https://stellar.expert/explorer/testnet/tx/408c3a4459bbe025e5e929dfc001bd5b0078fb6fc04a9125bb41874ed914f7db) | [5970f574…](https://stellar.expert/explorer/testnet/tx/5970f574c5daae184323aa27d22dbd38aeb4eeecce816c4ae1234ccfaec91926) |
| 15 | `GD2VS2…37TIRI` | [505abab4…](https://stellar.expert/explorer/testnet/tx/505abab4ea1f56f548fa4d33c442a3c2560d2ffe5b46c4e96bd88a0b43260ebb) | [8213b43c…](https://stellar.expert/explorer/testnet/tx/8213b43c66dd342feb42a1f0942c6f9adf289b4bb8c575d50fbaaf1250682a2a) |
| 16 | `GCRPUJ…5IN3ZH` | [4a51ee7e…](https://stellar.expert/explorer/testnet/tx/4a51ee7ecf9bc765a5ec78701ab59e02018840ed4b0b314dc183d92a737b47b6) | [a4f6acf0…](https://stellar.expert/explorer/testnet/tx/a4f6acf0c5be02cac8b6e5acf72bf9106e5ef568c994f20e4593e5998b20c33e) |
| 17 | `GCSDFE…BPRCZK` | [a3f55ab7…](https://stellar.expert/explorer/testnet/tx/a3f55ab711b5379ec6d859b41374daf8b71927711d65049ab1ef6010a5daf8d3) | [bf6662d1…](https://stellar.expert/explorer/testnet/tx/bf6662d1f0df7422642d185b4bcf8eb85ef81f610136253fe4f2a839962fd066) |
| 18 | `GD6KE3…X6ZHM4` | [1a55ca51…](https://stellar.expert/explorer/testnet/tx/1a55ca51301f92c309fe77098a8df60df002aa91db334cd3977758cfb1535c19) | [cb727299…](https://stellar.expert/explorer/testnet/tx/cb727299e4e3631259aabf65528191dd65b47b08bae77ff5dca9ac3e2d3d7e19) |
| 19 | `GBMSMM…KVO4ST` | [192a5092…](https://stellar.expert/explorer/testnet/tx/192a5092187ee1d8c20e843f2b756d723926d0acbe34cb39fe6ab5bcec5130aa) | [516f9f72…](https://stellar.expert/explorer/testnet/tx/516f9f724e65d4eb2bd3c5aa123e151cb6baece5f567a5c5a3d606a0a4643dbf) |
| 20 | `GCP3HM…LX65QN` | [867d339e…](https://stellar.expert/explorer/testnet/tx/867d339ea5b971f619c54d08aa0cff49203621b204b2be0c0be040c7e24295c7) | [455e31b1…](https://stellar.expert/explorer/testnet/tx/455e31b157b2d8c06a50aaf05cc4062442e6d4acacb537927343a17718982859) |
| 21 | `GB7CM4…O4E4BK` | [79063c32…](https://stellar.expert/explorer/testnet/tx/79063c32a73acb6c30187eb35f96b37924d604d13df4afafc70c5aa5e6065de5) | [43b78c10…](https://stellar.expert/explorer/testnet/tx/43b78c1064771876ed0a72f23eaad0fc17e064ac8d583b2d8511bd7b9061f387) |
| 22 | `GACTJE…RCR7OW` | [4d3f863d…](https://stellar.expert/explorer/testnet/tx/4d3f863dfeb7bd95e37500d9b42279a3fb4daa1a979138a209c85872b96e86d4) | [f69019b7…](https://stellar.expert/explorer/testnet/tx/f69019b79a2408d167c61989acbd285e110e621e3f2cb1488bac036689e146a5) |
| 23 | `GBH37I…MJS5NH` | [97104675…](https://stellar.expert/explorer/testnet/tx/9710467575a6429ae3e02db365822a4bae37a2a8680627e5dce12c06589cd42d) | [eb2a6f77…](https://stellar.expert/explorer/testnet/tx/eb2a6f7717897b22c5150be073c9646cc2778a2681bb7528452abc78efe91a22) |
| 24 | `GA6SN3…DAKUEO` | [5a4be2bb…](https://stellar.expert/explorer/testnet/tx/5a4be2bb5c9dcb1f23caa851a0ca50c4639464a6c7eccd6f021cfd318b506f52) | [544581cf…](https://stellar.expert/explorer/testnet/tx/544581cf0a7d230a28a47beeb34f12bbcad10dd59889643f9ca8778d9c1db2bc) |
| 25 | `GA2H7H…Q5X64G` | [a17cf7aa…](https://stellar.expert/explorer/testnet/tx/a17cf7aac6583e6166853f8e23607ac0e7fb150a660cbd16084656af79f885d9) | [12f1521d…](https://stellar.expert/explorer/testnet/tx/12f1521d6718eade1244b92bc6b3467005ac906827dd3e0ec4250cdafccf409c) |
| 26 | `GCTLYW…WJTN3G` | [33a8670c…](https://stellar.expert/explorer/testnet/tx/33a8670ca1cac94b29efb734438005c83bbd289a97ee2005ce469af18688283d) | [4e700e94…](https://stellar.expert/explorer/testnet/tx/4e700e94cd714d64c0edbeb20a5989c321e655f8774a939ca14909f655fc96f2) |
| 27 | `GBGGND…A7MIFL` | [ec927fcc…](https://stellar.expert/explorer/testnet/tx/ec927fcc7bb907a23582237b5c7cece3543826c3fbb3923e8ec3841557420532) | [35ff4825…](https://stellar.expert/explorer/testnet/tx/35ff4825321e030ea07dacfd48b282b4b216ab17e59a0b85691fa6aeb9dc44a8) |
| 28 | `GBEWUF…4DJGGH` | [0a94b712…](https://stellar.expert/explorer/testnet/tx/0a94b71269d34815bcff12ba317a5e8b48389bba0eea6d82cde8469108b6054f) | [8122db9c…](https://stellar.expert/explorer/testnet/tx/8122db9c7fe366fdf90cedf553428166096af5ad3bc9c007b23c7e276eb0583c) |
| 29 | `GASDNX…DVA6VA` | [52a70f03…](https://stellar.expert/explorer/testnet/tx/52a70f03d67edf437dfb726c66856d51137a718150b7ced15f0c89bff9f230d9) | [d43cd1bf…](https://stellar.expert/explorer/testnet/tx/d43cd1bfc47abe081aa6f3d0566378c06e6e9c168212b3063419c44498e36924) |
| 30 | `GDBTUY…EP5C54` | [5abef50e…](https://stellar.expert/explorer/testnet/tx/5abef50ebfa20d78347f2756e1dfcdfa1d3ce8dc69326ab5875a49435aeb0f0a) | [2b74ae46…](https://stellar.expert/explorer/testnet/tx/2b74ae4686bda7c281ed00e857eaee61e7635b5420f9c46be433b881e6796089) |
| 31 | `GCEKIH…LN2NLW` | [e27d96b0…](https://stellar.expert/explorer/testnet/tx/e27d96b0bedee10dee2ab084cb47d60380c866fd06a0f9913e65a36611029d02) | [13271ca9…](https://stellar.expert/explorer/testnet/tx/13271ca9de10ffae2499fa7e9dcfa032ef8eda9a0f1cfce771028f8fd0cdcfb5) |
| 32 | `GCC5F6…5DQHO3` | [9f613c2e…](https://stellar.expert/explorer/testnet/tx/9f613c2e279f89799dd8e4723c18ab5e855fe12a1a4881e7bd0839ae8b0c5891) | [ac3c0225…](https://stellar.expert/explorer/testnet/tx/ac3c0225d588df40c1c26770fdda20b8b2f254aec441fb4ee8120b9babdfa67d) |
| 33 | `GA2YSK…ZQ4VHM` | [3867d2ee…](https://stellar.expert/explorer/testnet/tx/3867d2eeb1af25b043a94b572370bffe8eba0a59347c395257baa4f47f1a2306) | [2fb7291e…](https://stellar.expert/explorer/testnet/tx/2fb7291e2805c31bdebab1ee9c211a1b2c67a98ebf3138631ff9d83ed5a18399) |
| 34 | `GA4ZJC…GJICJU` | [a8162eca…](https://stellar.expert/explorer/testnet/tx/a8162eca6c7b1e3e32a8938ede0666e33be49192768ee2b8257295751747448a) | [08c9f3fa…](https://stellar.expert/explorer/testnet/tx/08c9f3fac945c4fc573d558260fcf1b015726028e1388983523e3d7010828be1) |
| 35 | `GANHDR…RWOX4X` | [8a993e17…](https://stellar.expert/explorer/testnet/tx/8a993e175fc81233178f4c476ede52d8688a06836b6db6b2d44bbe0a24ea72eb) | [1784fe67…](https://stellar.expert/explorer/testnet/tx/1784fe676092127c2594f19d49ab45e95b38c2e58700a089f00c252832282164) |
| 36 | `GCMQIJ…X3WASK` | [f8707f16…](https://stellar.expert/explorer/testnet/tx/f8707f1671deccf783e473a76c8cd46a7fa0e74c91123090a06f0db15d47f82b) | [2c82f2d9…](https://stellar.expert/explorer/testnet/tx/2c82f2d9db9d83781a54f04e012488465fe5fadc33eb88df180a6128e4980339) |
| 37 | `GBV7FX…WQQJZJ` | [baf6c48d…](https://stellar.expert/explorer/testnet/tx/baf6c48d82b587e54df495a3674095f54582ce20ad2ac895ab7e307c78c65148) | [889a41f9…](https://stellar.expert/explorer/testnet/tx/889a41f97ae5a97958d55fea8f4115fab5e3c21639a9cbf82645ebc1dea5a168) |
| 38 | `GC56FR…GC2LDV` | [9b8879b4…](https://stellar.expert/explorer/testnet/tx/9b8879b4191a3a87dfee2cc23c3f108d0b6c50b3d47bfb85a5551a7c56291c20) | [182fb787…](https://stellar.expert/explorer/testnet/tx/182fb7876987c02131702e75f641a4d91e30d9381467420ee0a036c316f4aadd) |
| 39 | `GA4CYV…VVUM7K` | [6a4655fe…](https://stellar.expert/explorer/testnet/tx/6a4655fe527db4f8880195e48d2bc222d4076b4d76d8ad841e0716f986946e44) | [85c08721…](https://stellar.expert/explorer/testnet/tx/85c087217ac7cabb82917535bf8ddb0d26dd1e1f09142ed5abefa2d705286162) |
| 40 | `GDUFDD…LZYFOS` | [f91e527d…](https://stellar.expert/explorer/testnet/tx/f91e527dbe29c88bf6c0b6a835a041db8ec375a8345349fb80c28345faa45ca4) | [e7daf733…](https://stellar.expert/explorer/testnet/tx/e7daf7338e0c8f5d4ab82ab8cd431bbcd58597acff291fdfff2182aa85aeb6c2) |
| 41 | `GAYZYD…G7UTV7` | [bba9ba39…](https://stellar.expert/explorer/testnet/tx/bba9ba39a935adc9fe65d45723d119cece5b12efa5806b03b8e4d28ed5cd801c) | [76bf26da…](https://stellar.expert/explorer/testnet/tx/76bf26dad1d3dff18b8db787138dbb7cbbc09fc2d7a688d1e91966f5108d400e) |
| 42 | `GCYSO4…B3A2DM` | [e56e7502…](https://stellar.expert/explorer/testnet/tx/e56e75029e263f3bc2b884c1315cf8052d9b6f1dd75f9c719f6049bfffacdcfb) | [508013c0…](https://stellar.expert/explorer/testnet/tx/508013c096645c33dc5db553d9e7c186c0cc83607f89ce7db09ecf7a318fc70a) |
| 43 | `GBL2JK…SNTPPF` | [e79ca104…](https://stellar.expert/explorer/testnet/tx/e79ca104b995f18fbe7c5aa93361cd13538670c7d45dbceebe18722ce2dd3948) | [f5a55534…](https://stellar.expert/explorer/testnet/tx/f5a5553452a3161ed5feef158119f44982bde9cfc7213d2aa4951f647d05694a) |
| 44 | `GCWB7O…EJSLZS` | [71a8ce7a…](https://stellar.expert/explorer/testnet/tx/71a8ce7a7feb072589ec7b387fce4f121c45d112ee17d71f19dcaa3f2dea17e6) | [2613921a…](https://stellar.expert/explorer/testnet/tx/2613921a46fa3efc44bbc8179d1f7c3d5170b906db4808c33cbfab1f4a3a3ced) |
| 45 | `GDPSLD…D4NPLM` | [c4d20944…](https://stellar.expert/explorer/testnet/tx/c4d20944942d048ce0d5f05e673bc4f4ce9b64263cd5c324504f873e65099788) | [74110eed…](https://stellar.expert/explorer/testnet/tx/74110eeda4c73a9fc62cd5146bc26bbcb0119255ff98b1e93e0b5fab61d85b13) |
| 46 | `GDBRNZ…CHODXP` | [212ff64b…](https://stellar.expert/explorer/testnet/tx/212ff64bd8decf5c5ca0a476424ee6a44239f199b6dc549675e223fa1bd51508) | [33cd31d5…](https://stellar.expert/explorer/testnet/tx/33cd31d5612c98c9f43e3d14072b18ed0f9eec50dea2341e30ae6011d79f22b8) |
| 47 | `GD4UW4…KQ3PJY` | [59f7766a…](https://stellar.expert/explorer/testnet/tx/59f7766ae9790f0301274fa7d53addcd00203d5a004e093ea191b00a8facedf2) | [402d2f5f…](https://stellar.expert/explorer/testnet/tx/402d2f5f32a644187056dcb5c8bba8cdb49ff79d44b03e26f7b25bcc906844f6) |
| 48 | `GDAI7B…5LR2KX` | [0f484f70…](https://stellar.expert/explorer/testnet/tx/0f484f707f47ed55159f30692255c498cce672e5f7004effae91d3b6def0b62c) | [855d4e91…](https://stellar.expert/explorer/testnet/tx/855d4e91222ba1400204cac4a3aed17836050f9e85046b54af8671e23065ae98) |
| 49 | `GCTOSJ…WFZ7UL` | [a3ce2e56…](https://stellar.expert/explorer/testnet/tx/a3ce2e562071f14135bd82ac096759fdd97a12b6c66a023fc0c69dfda9a9dc5c) | [09cac0cd…](https://stellar.expert/explorer/testnet/tx/09cac0cdfd67e904f651b923998bee584010e0211e63082edf0ef7f3d79d762e) |
| 50 | `GAHE5M…XOLPY3` | [d328b317…](https://stellar.expert/explorer/testnet/tx/d328b31793d8cc5b6af01ed4d9a0c2f68ef4f18dbbbf5a7fe9df6fda5bc9acb9) | [5b9d0f9e…](https://stellar.expert/explorer/testnet/tx/5b9d0f9edeacf34d44d798d3488a5702f82eb4ba1d7b8c0226a88f4b12f55e2f) |

**Gateway usage debits** (admin-signed `debit()`): 100 transactions — sample:
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
- … and 90 more, all visible on the [contract's explorer page](https://stellar.expert/explorer/testnet/contract/CAEFFQAL6SGQF6OV5BOBE23NAC2T7WXOUUE5XRDOH2KRN2HXRMDXA7RE).

**Refund proof (cohort B)** — withdraw 1.577 USDC: [a97737b7…](https://stellar.expert/explorer/testnet/tx/a97737b7015ede31952cc184b52d4abed216dd806013d39eec0492ba5b02d5f1)
**Refund proof (cohort C)** — withdraw 1.604 USDC: [78816da2…](https://stellar.expert/explorer/testnet/tx/78816da2192f99f927de56a1ff37903d90f6325c20e42850e31c482b7f537097)

Live counters: [Analytics](https://stellarouter.vercel.app/analytics) · activity feed on [Credits](https://stellarouter.vercel.app/credits).
