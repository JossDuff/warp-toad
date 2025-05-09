# Technical overview WarpToad

### The GigaRoot
WarpToad achieves cross-chain privacy by tracking commitments inside in-contract merkle trees on each chain separately.   
It is then able to use the native bridges of the integrated rollups to bridge the roots to L1. 
On L1 a contract (the gigaBridge) will collect these roots and aggregate them by inserting them as leafs into another merkle tree. Effectively creating a larger merkle tree that contains all commitments of every integrated L2 (and L1).  
We call this tree the GigaTree and the root of that tree the GigaRoot.

### Proving   
This GigaRoot is then send back to the L2's so users can use them to create zk-proofs against. They proof that they made a valid deposit on **a** WarpToad contract on **a** chain that is integrated. Not specifying **which deposit** or even **which chain** they came from.   
We also insert the most recent root of the WarpToad instance on the chain the users is withdrawing on. So they can also proof against that. This enables users who stay on the same chain to use the anon set of every L2 instance without waiting for a gigaroot to be bridged.  
  
The GigaBridge contract can receive L2 roots asynchronously. This enables the protocol to be faster for rollups with faster bridges.  
  
### Siloing commitment per chainId  
This is all enabled because WarpToad commitments are siloed per destination chainId. A WarpToad commitment is created like this `commitment=hash(hash(nullifierPreimage, secret, destinationChainId),amount)` which is very similar to 0xbow but with the chainId added.   
We add this chainId so the user can **only** withdraw on one chain. Because the can only withdraw on **one chain**,  we dont have to worry about nullifiers.    
This requirement is enforced by the circuit who requires the chainId to be revealed on withdraw as a public input.  

### Aztec
Now on Aztec the privacy is far stronger and the anonymity set is far larger.   
Instead of creating our own merkle tree on aztec we directly push our commitments and nullifiers to the native tree of aztec.   
This means any bridging tx that start on aztec are complexly shielded. It will look like any other shielded transfer. Same for txs arriving on aztec. Further more, because bridging txs originating from aztec, look like any other shielded transfer, we inherit the entire anonymity set of aztec into WarpToad. Since any tx on aztec (even from other contracts) could have plausibly been a bridge transfer.   
This is even better in a future when there is another protocol that can integrate WarpToad at the same level Aztec can. In this future the anonymity sets of 2 separate privacy protocols can be joined,  simply by virtue of such bridge existing