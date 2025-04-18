mod config;

use dep::aztec::macros::aztec;

// Minimal implementation of the message bridge that can move messages between L1 <> L2.
// The bridge has a corresponding Portal contract on L1 that it is attached to

#[aztec]
pub contract RootBridge {
    use crate::config::Config;

    use dep::aztec::prelude::{AztecAddress, EthAddress, PublicImmutable};


    use dep::aztec::macros::{functions::{initializer, private, public, view}, storage::storage};

    // Storage structure, containing all storage, and specifying what slots they use.
    #[storage]
    struct Storage<Context> {
        config: PublicImmutable<Config, Context>,
    }

    // Constructs the contract.
    #[public]
    #[initializer]
    fn constructor(portal: EthAddress) {
        storage.config.initialize(Config { portal });
    }

    #[public]
    #[view]
    fn get_config_public() -> Config {
        storage.config.read()
    }

    // Consumes a L1->L2 message and calls the WarpToadCore contract to update the GigaRoot
    // @param new_gigaroot - the gigaroot from the L1 contract AztecRootBridge.sol.  Found on the event emitted in AztecRootBridge.sol sendGigaRootToL2
    // @param message_leaf_index - the location of the gigaroot.  Found on the event emitted in AztecRootBridge.sol sendGigaRootToL2
    #[public]
    fn update_gigaroot(new_gigaroot: Field, message_leaf_index: Field) {
        // let content_hash = get_mint_to_public_content_hash(to, amount);

        let config = storage.config.read();

        // TODO: secret was a parameter but we don't care about who calls this so just setting it here
        let secret = 0;

        // Consume message and emit nullifier
        context.consume_l1_to_l2_message(new_gigaroot, secret, config.portal, message_leaf_index);


        // TODO: call function on WarpToadCore

        // Mint tokens
        // Token::at(config.token).mint_to_public(to, amount).call(&mut context);
    }

    // creates a L2 to L1 message publicly
    // Sends the most recent state root to L1 to be consumed by AztecRootBridge.sol
    #[public]
    fn send_root_to_l1(
        amount: u128,
        caller_on_l1: EthAddress, // ethereum address that can call this function on the L1 portal (0x0 if anyone can call)
        nonce: Field, // nonce used in the approval message by `msg.sender` to let bridge burn their tokens on L2
    ) {
        let config = storage.config.read();

        // caller_on_l1: EthAddress, ethereum address that can call this function on the L1 portal (0x0 if anyone can call)
        let caller_on_l1 = 0x0;

        // TODO: get most recent state root from WarpToadCore
        let content: Field = 0x0;

        // Send an L2 to L1 message
        context.message_portal(config.portal, content);
    }
}
