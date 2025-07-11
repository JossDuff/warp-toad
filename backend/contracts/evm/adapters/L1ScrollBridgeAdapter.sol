// SPDX-License-Identifier: MIT

pragma solidity 0.8.29;

import {ILocalRootProvider, IGigaRootRecipient, IGigaRootProvider} from  "../interfaces/IRootMessengers.sol";
import {IL1BridgeAdapter} from "../interfaces/IL1BridgeAdapter.sol";
import {IScrollMessenger} from "@scroll-tech/contracts/libraries/IScrollMessenger.sol";

// no IGigaRootRecipient because we have L1SLOAD!
contract L1ScrollBridgeAdapter is IL1BridgeAdapter, ILocalRootProvider, IGigaRootRecipient {
    modifier onlyGigaBridge() {
        require(msg.sender == gigaBridge, "Not gigaBridge");
        _; // what is that?
    }

    modifier onlyDeployer() {
        require(msg.sender == deployer, "Not the deployer");
        _; // what is that?
    }
    address public l2ScrollBridgeAdapter;
    // most recent warp toad state root from the L2
    uint256 public mostRecentL2Root;
    // the L2 block that the most recent L2 root came from
    uint256 public mostRecentL2RootBlockNumber;

    address public gigaBridge;

    address deployer;

    address public l1ScrollMessenger;

    bool isInitialized = false;
    constructor(address _l1ScrollMessenger ) {
        deployer = msg.sender;
        l1ScrollMessenger = _l1ScrollMessenger;
    }

    function initialize(
        address _l2ScrollBridgeAdapter,
        address _gigaRootBridge
    ) external onlyDeployer() {
        require(isInitialized == false, "cant initialize twice");
        isInitialized = true;
        l2ScrollBridgeAdapter = _l2ScrollBridgeAdapter;
        gigaBridge = _gigaRootBridge;
    }


    function getNewRootFromL2(uint256 _l2Root, uint256 _l2BlockNumber) external {
        require(msg.sender == l1ScrollMessenger,"function not called by l1ScrollMessenger");
        require(l2ScrollBridgeAdapter == IScrollMessenger(l1ScrollMessenger).xDomainMessageSender(),"contract messaging from L2 is not the L2ScrollBridgeAdapter");

        emit ReceivedNewL2Root(_l2Root, _l2BlockNumber);

        mostRecentL2Root = _l2Root;
        mostRecentL2RootBlockNumber = _l2BlockNumber;
    }

    function receiveGigaRoot(
        uint256 _newGigaRoot
    ) external onlyGigaBridge {
        _bridgeGigaRootToL2(_newGigaRoot, 1000000);
    }

    // just incase the hardcoded gaslimit fails
    function bridgeGigaRootWithGasLimit(
        uint256 _gasLimit
    ) external {
        uint256 _newGigaRoot = IGigaRootProvider(gigaBridge).gigaRoot();
        _bridgeGigaRootToL2(_newGigaRoot, _gasLimit);
    }

    function _bridgeGigaRootToL2(uint256 _newGigaRoot, uint256 _gasLimit) internal {
        // uint256 _newGigaRoot = IGigaRootProvider(gigaBridge).gigaRoot();
        // sendMessage is able to execute any function by encoding the abi using the encodeWithSignature function
        //IScrollMessenger(l1ScrollMessenger).sendMessage{value: msg.value}(
        IScrollMessenger(l1ScrollMessenger).sendMessage{value: 0}( // can this be 0?? or can we pay for some relayer?? check docs!
            l2ScrollBridgeAdapter,
            0,
            abi.encodeWithSignature(
                "receiveGigaRoot(uint256 _gigaRoot)",
                _newGigaRoot
            ),
            _gasLimit,
            msg.sender
        );
        
    } 

    function getLocalRootAndBlock() view external returns (uint256, uint256) {
        require(
            mostRecentL2Root > 0,
            "An L2 root hasn't yet been bridged to this contract. refreshRoot must be called."
        );
        require(
            mostRecentL2RootBlockNumber > 0,
            "An L2 root hasn't yet been bridged to this contract. refreshRoot must be called."
        );
        return (mostRecentL2Root, mostRecentL2RootBlockNumber);
    }
}
