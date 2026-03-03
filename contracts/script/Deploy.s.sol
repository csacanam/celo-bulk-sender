// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "../lib/forge-std/src/Script.sol";
import {BulkSender} from "../src/BulkSender.sol";

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        BulkSender bulkSender = new BulkSender();
        console.log("BulkSender deployed at:", address(bulkSender));

        vm.stopBroadcast();
    }
}
