
/* Autogenerated file, do not edit! */

/* eslint-disable */
import {
  type AbiType,
  AztecAddress,
  type AztecAddressLike,
  CompleteAddress,
  Contract,
  type ContractArtifact,
  ContractBase,
  ContractFunctionInteraction,
  type ContractInstanceWithAddress,
  type ContractMethod,
  type ContractStorageLayout,
  type ContractNotes,
  decodeFromAbi,
  DeployMethod,
  EthAddress,
  type EthAddressLike,
  EventSelector,
  type FieldLike,
  Fr,
  type FunctionSelectorLike,
  loadContractArtifact,
  loadContractArtifactForPublic,
  type NoirCompiledContract,
  NoteSelector,
  Point,
  type PublicKey,
  PublicKeys,
  type Wallet,
  type U128Like,
  type WrappedFieldLike,
} from '@aztec/aztec.js';
import L2AztecRootBridgeAdapterContractArtifactJson from './L2AztecBridgeAdapter-L2AztecBridgeAdapter.json' assert { type: 'json' };
export const L2AztecRootBridgeAdapterContractArtifact = loadContractArtifact(L2AztecRootBridgeAdapterContractArtifactJson as NoirCompiledContract);



/**
 * Type-safe interface for contract L2AztecRootBridgeAdapter;
 */
export class L2AztecRootBridgeAdapterContract extends ContractBase {
  
  private constructor(
    instance: ContractInstanceWithAddress,
    wallet: Wallet,
  ) {
    super(instance, L2AztecRootBridgeAdapterContractArtifact, wallet);
  }
  

  
  /**
   * Creates a contract instance.
   * @param address - The deployed contract's address.
   * @param wallet - The wallet to use when interacting with the contract.
   * @returns A promise that resolves to a new Contract instance.
   */
  public static async at(
    address: AztecAddress,
    wallet: Wallet,
  ) {
    return Contract.at(address, L2AztecRootBridgeAdapterContract.artifact, wallet) as Promise<L2AztecRootBridgeAdapterContract>;
  }

  
  /**
   * Creates a tx to deploy a new instance of this contract.
   */
  public static deploy(wallet: Wallet, portal: EthAddressLike) {
    return new DeployMethod<L2AztecRootBridgeAdapterContract>(PublicKeys.default(), wallet, L2AztecRootBridgeAdapterContractArtifact, L2AztecRootBridgeAdapterContract.at, Array.from(arguments).slice(1));
  }

  /**
   * Creates a tx to deploy a new instance of this contract using the specified public keys hash to derive the address.
   */
  public static deployWithPublicKeys(publicKeys: PublicKeys, wallet: Wallet, portal: EthAddressLike) {
    return new DeployMethod<L2AztecRootBridgeAdapterContract>(publicKeys, wallet, L2AztecRootBridgeAdapterContractArtifact, L2AztecRootBridgeAdapterContract.at, Array.from(arguments).slice(2));
  }

  /**
   * Creates a tx to deploy a new instance of this contract using the specified constructor method.
   */
  public static deployWithOpts<M extends keyof L2AztecRootBridgeAdapterContract['methods']>(
    opts: { publicKeys?: PublicKeys; method?: M; wallet: Wallet },
    ...args: Parameters<L2AztecRootBridgeAdapterContract['methods'][M]>
  ) {
    return new DeployMethod<L2AztecRootBridgeAdapterContract>(
      opts.publicKeys ?? PublicKeys.default(),
      opts.wallet,
      L2AztecRootBridgeAdapterContractArtifact,
      L2AztecRootBridgeAdapterContract.at,
      Array.from(arguments).slice(1),
      opts.method ?? 'constructor',
    );
  }
  

  
  /**
   * Returns this contract's artifact.
   */
  public static get artifact(): ContractArtifact {
    return L2AztecRootBridgeAdapterContractArtifact;
  }

  /**
   * Returns this contract's artifact with public bytecode.
   */
  public static get artifactForPublic(): ContractArtifact {
    return loadContractArtifactForPublic(L2AztecRootBridgeAdapterContractArtifactJson as NoirCompiledContract);
  }
  

  public static get storage(): ContractStorageLayout<'config' | 'counter'> {
      return {
        config: {
      slot: new Fr(1n),
    },
counter: {
      slot: new Fr(3n),
    }
      } as ContractStorageLayout<'config' | 'counter'>;
    }
    

  public static get notes(): ContractNotes<'ValueNote' | 'UintNote' | 'WarpToadNote'> {
    return {
      ValueNote: {
          id: new NoteSelector(0),
        },
UintNote: {
          id: new NoteSelector(1),
        },
WarpToadNote: {
          id: new NoteSelector(2),
        }
    } as ContractNotes<'ValueNote' | 'UintNote' | 'WarpToadNote'>;
  }
  

  /** Type-safe wrappers for the public methods exposed by the contract. */
  public declare methods: {
    
    /** constructor(portal: struct) */
    constructor: ((portal: EthAddressLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** count(new_count: field) */
    count: ((new_count: FieldLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** get_config_public() */
    get_config_public: (() => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** public_dispatch(selector: field) */
    public_dispatch: ((selector: FieldLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** send_root_to_l1(block_number: integer) */
    send_root_to_l1: ((block_number: (bigint | number)) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** sync_notes() */
    sync_notes: (() => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** update_gigaroot(new_gigaroot: field, message_leaf_index: field, warpToadCore: struct) */
    update_gigaroot: ((new_gigaroot: FieldLike, message_leaf_index: FieldLike, warpToadCore: AztecAddressLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;
  };

  
}
