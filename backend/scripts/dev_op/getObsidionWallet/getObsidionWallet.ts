//@ts-ignore
import { AccountManager, AccountWallet, AuthWitness, AuthWitnessProvider, AztecAddress, AztecNode, CompleteAddress, ContractArtifact, createAztecNodeClient, Fr, getWallet, GrumpkinScalar, PXE, Schnorr, } from "@aztec/aztec.js";
//@ts-ignore
import { DefaultAccountContract } from "@aztec/accounts/defaults";

import { ObsidionDeployerFPCContractArtifact } from "./ObsidionDeployerFPC"
import { ethers } from "ethers";
//@ts-ignore
import { computePartialAddress } from "@aztec/stdlib/contract"

/** Creates auth witnesses using Schnorr signatures. */
class SchnorrAuthWitnessProvider implements AuthWitnessProvider {
  constructor(private signingPrivateKey: GrumpkinScalar) { }

  async createAuthWit(messageHash: Fr): Promise<AuthWitness> {
    const schnorr = new Schnorr()
    const signature = await schnorr.constructSignature(
      messageHash.toBuffer(),
      this.signingPrivateKey,
    )
    return new AuthWitness(messageHash, [...signature.toBuffer()])
  }
}

/**
 * Account contract that authenticates transactions using Schnorr signatures
 * verified against a Grumpkin public key stored in an immutable encrypted note.
 */
export class ObsidionDeployerFPCContractClass extends DefaultAccountContract {
  constructor(private signingPrivateKey: GrumpkinScalar) {
    super()
  }

  async getDeploymentFunctionAndArgs() {
    const signingPublicKey = await new Schnorr().computePublicKey(this.signingPrivateKey)
    return {
      constructorName: "constructor",
      constructorArgs: [signingPublicKey.x, signingPublicKey.y],
    }
  }

  getContractArtifact(): Promise<ContractArtifact> {
    return Promise.resolve(ObsidionDeployerFPCContractArtifact)
  }

  getAuthWitnessProvider(_address: CompleteAddress): AuthWitnessProvider {
    return new SchnorrAuthWitnessProvider(this.signingPrivateKey)
  }
}

export function getObsidionDeployerFPCWallet(
  pxe: PXE,
  address: AztecAddress,
  signingPrivateKey: GrumpkinScalar,
): Promise<AccountWallet> {

  return getWallet(pxe, address, new ObsidionDeployerFPCContractClass(signingPrivateKey))
}
export async function getObsidionDeployerFPC(
  pxe: PXE, 
  nodeUrl: string,
  obsidionDeployerFPCAddress:AztecAddress,
  signingKey:string,                  //hex string
  OBSIDION_DEPLOYER_SECRET_KEY:string //hex string
) {

  let obsidionDeployerFPC

  try {
    obsidionDeployerFPC = await getObsidionDeployerFPCWallet(
      pxe,
      obsidionDeployerFPCAddress,
      GrumpkinScalar.fromString(signingKey),
    )
  } catch (error) {
    console.log("obsidionDeployerFPCWallet not found in pxe, so fetching from node")
    // in case pxe is no longer the instance that deployed the contract
    const node = createAztecNodeClient(nodeUrl)
    const contract = await node.getContract(obsidionDeployerFPCAddress)
    if (!contract) {
      throw new Error("Contract not found")
    }
    obsidionDeployerFPC = await (
      await AccountManager.create(
        pxe,
        Fr.fromString(OBSIDION_DEPLOYER_SECRET_KEY),
        new ObsidionDeployerFPCContractClass(GrumpkinScalar.fromString(signingKey)),
        contract.salt,
      )
    ).getWallet()

    await pxe.registerAccount(
      Fr.fromString(OBSIDION_DEPLOYER_SECRET_KEY),
      await computePartialAddress(contract as any) as any as Fr,
    )
    await pxe.registerContract({
      instance: contract,
      artifact: ObsidionDeployerFPCContractArtifact,
    })
  }
  console.log("obsidionDeployerFPC", obsidionDeployerFPC.getAddress().toString())
  return obsidionDeployerFPC
}