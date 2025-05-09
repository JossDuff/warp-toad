// hardhat 
const hre = require("hardhat");
//@ts-ignore
import { expect } from "chai";
//@ts-ignore
import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";

// aztec
//@ts-ignore
import { createPXEClient, waitForPXE, Contract, ContractArtifact, loadContractArtifact, NoirCompiledContract, Fr, NotesFilter, PXE, EthAddress, Wallet as AztecWallet } from "@aztec/aztec.js"
//@ts-ignore
import { getInitialTestAccountsWallets } from '@aztec/accounts/testing'; // idk why but node is bitching about this but bun doesnt care
// //@ts-ignore
// import {getSchnorrAccount } from "@aztec/accounts/schnorr/lazy";
import { poseidon2, poseidon3 } from 'poseidon-lite'

// artifacts
//@ts-ignore
import { WarpToadCoreContractArtifact, WarpToadCoreContract as AztecWarpToadCore } from '../contracts/aztec/WarpToadCore/src/artifacts/WarpToadCore'
import { AztecMerkleData } from "../scripts/lib/types";
import { ethers } from "ethers";
import { hashNoteHashNonce, hashPreCommitment } from "../scripts/lib/hashing";
import { calculateFeeFactor, createProof, generateNoirTest, getAztecNoteHashTreeRoot, getProofInputs } from "../scripts/lib/proving";
import { EVM_TREE_DEPTH, gasCostPerChain } from "../scripts/lib/constants";
import { WarpToadCore as WarpToadEvm, USDcoin, PoseidonT3, LazyIMT, L1AztecRootBridgeAdapter, GigaRootBridge, L1WarpToad } from "../typechain-types";

import { L2AztecRootBridgeAdapterContractArtifact, L2AztecRootBridgeAdapterContract } from '../contracts/aztec/L2AztecRootBridgeAdapter/src/artifacts/L2AztecRootBridgeAdapter'

import { GIGA_TREE_DEPTH } from "../scripts/lib/constants";

import os from 'os';

//@ts-ignore
import { sha256ToField } from "@aztec/foundation/crypto";
import { sendGigaRoot, bridgeNoteHashTreeRoot, parseEventFromTx, updateGigaRoot, receiveGigaRootOnAztec } from "../scripts/lib/bridging";

async function connectPXE() {
    const { PXE_URL = 'http://localhost:8080' } = process.env;
    console.log("creating PXE client")
    const PXE = createPXEClient(PXE_URL);
    console.log("waiting on PXE client", PXE_URL)
    await waitForPXE(PXE);

    console.log("getting test accounts")
    const wallets = await getInitialTestAccountsWallets(PXE);
    return { wallets, PXE }
}



describe("gas-burn-test", function () {
    async function deployAztecWarpToad(nativeToken: USDcoin, deployerWallet:AztecWallet) {
        const wrappedTokenSymbol = `wrpToad-${await nativeToken.symbol()}`
        const wrappedTokenName = `wrpToad-${await nativeToken.name()}`
        const decimals = 6n; // only 6 decimals what is this tether??

        const constructorArgs = [nativeToken.target, wrappedTokenName, wrappedTokenSymbol, decimals]
        const AztecWarpToad = await Contract.deploy(deployerWallet, WarpToadCoreContractArtifact, constructorArgs)
            .send()
            .deployed() as AztecWarpToadCore;

        return { AztecWarpToad};
    }
    async function deployL1Warptoad(nativeToken: USDcoin, LazyIMTLib: LazyIMT, PoseidonT3Lib: PoseidonT3) {
        const wrappedTokenSymbol = `wrpToad-${await nativeToken.symbol()}`
        const wrappedTokenName = `wrpToad-${await nativeToken.name()}`

        const maxEvmTreeDepth = EVM_TREE_DEPTH
        const WithdrawVerifier = await hre.ethers.deployContract("WithdrawVerifier", [], { value: 0n, libraries: {} })
        const L1WarpToad = await hre.ethers.deployContract("L1WarpToad", [maxEvmTreeDepth, WithdrawVerifier.target, nativeToken.target, wrappedTokenSymbol, wrappedTokenName], {
            value: 0n,
            libraries: {
                LazyIMT: LazyIMTLib,
                PoseidonT3: PoseidonT3Lib
            }
        });
        return { L1WarpToad, WithdrawVerifier }
    }

    async function deployL1GigaBridge(LazyIMTLib: LazyIMT, gigaRootRecipients: ethers.AddressLike[]) {
        const gigaTreeDepth = GIGA_TREE_DEPTH
        const gigaBridge = await hre.ethers.deployContract("GigaRootBridge", [gigaRootRecipients, gigaTreeDepth], {
            value: 0n,
            libraries: {
                LazyIMT: LazyIMTLib,
            }
        });
        return { gigaBridge }

    }

    async function deployL2AztecRootBridgeAdapterContract(aztecDeployerWallet:AztecWallet,constructorArgs:ethers.BytesLike[]):Promise<L2AztecRootBridgeAdapterContract> {
        return await Contract.deploy(aztecDeployerWallet, L2AztecRootBridgeAdapterContractArtifact, constructorArgs).send().deployed() as L2AztecRootBridgeAdapterContract;
        
    }
    async function deploy() {
        const evmWallets = await hre.ethers.getSigners()
        // const {PXE, wallets: aztecWallets} = await connectPXE()
        // const aztecDeployerWallet =  aztecWallets[0];

        // native token
        const nativeToken = await hre.ethers.deployContract("USDcoin", [], { value: 0n, libraries: {} })

        //---------------deploy the toads!!!!!!-----------------------
        // libs
        const PoseidonT3Lib = await hre.ethers.deployContract("PoseidonT3", [], { value: 0n, libraries: {} })
        const LazyIMTLib = await hre.ethers.deployContract("LazyIMT", [], { value: 0n, libraries: { PoseidonT3: PoseidonT3Lib } })

        //L1 warptoad 
        // also needs gigaBridgeProvider and L1BridgeAdapter (is just L1WarpToad)
        const { L1WarpToad, WithdrawVerifier } = await deployL1Warptoad(nativeToken, LazyIMTLib, PoseidonT3Lib)

        // Aztec warptoad
        //const { AztecWarpToad } = await deployAztecWarpToad(nativeToken, aztecDeployerWallet)
        //-----------------------------------------------------------------------

        //-----------------------infra------------------------------------
        // L1 adapters
        const L1AztecRootBridgeAdapter = await hre.ethers.deployContract("L1AztecRootBridgeAdapter", [],);

        // L1 GIGA!!!
        const gigaRootRecipients: ethers.AddressLike[] = [L1WarpToad.target, L1AztecRootBridgeAdapter.target]
        const { gigaBridge } = await deployL1GigaBridge(LazyIMTLib, gigaRootRecipients)

               
        // L2 adapters
        // aztec
        const constructorArgs = [L1AztecRootBridgeAdapter.target];
        //const L2AztecRootBridgeAdapter = await deployL2AztecRootBridgeAdapterContract(aztecDeployerWallet, constructorArgs)

 

        //-------------------connect everything together!--------------------------------------
        // initialize
        // connect adapters
        //const aztecNativeBridgeRegistryAddress = (await PXE.getNodeInfo()).l1ContractAddresses.registryAddress.toString();
        //await L1AztecRootBridgeAdapter.initialize(aztecNativeBridgeRegistryAddress, L2AztecRootBridgeAdapter.address.toString(), gigaBridge.target);
        
        //connect toads
        await L1WarpToad.initialize(gigaBridge.target, L1WarpToad.target) // <- L1WarpToad is special because it's also it's own _l1BridgeAdapter (he i already on L1!)
        //await AztecWarpToad.methods.initialize(L2AztecRootBridgeAdapter.address, L1AztecRootBridgeAdapter.target).send().wait()// all other warptoad initializations will look like this

        return { L1AztecRootBridgeAdapter, gigaBridge, L1WarpToad:L1WarpToad as L1WarpToad, nativeToken, LazyIMTLib, PoseidonT3Lib,evmWallets };
    }

    describe("burn-gas-test", function () {
        it("Should burn a lott", async function () {
            const { L1AztecRootBridgeAdapter, L1WarpToad, nativeToken, LazyIMTLib, PoseidonT3Lib, evmWallets, gigaBridge } = await deploy()
            const provider = hre.ethers.provider
            // free money!! 
            // TODO mint from USDcoin instead since that contract will not be in prod so we can then remove mint_for_testing
            const initialBalanceSender = 10n * 10n ** 18n

            // don't forget this step! i keep forgetting it ffs and the errors are really shit like: ProviderError: execution reverted: custom error 0xe450d38c was that even mean!!! >:(
            await (await nativeToken.getFreeShit(initialBalanceSender)).wait(1)
            await (await nativeToken.approve(L1WarpToad.target, initialBalanceSender)).wait(1)
            await ((await L1WarpToad.wrap(initialBalanceSender)).wait(1))
            for (let index = 0; index < 2000; index++) {
                await (await L1WarpToad.burn(Fr.random().toBigInt(),1n)).wait(1)
            }
            
        })
    } )
});
