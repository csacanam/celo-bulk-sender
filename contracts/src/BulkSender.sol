// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/// @title BulkSender
/// @notice Sends the same amount of native token (CELO/ETH) or ERC20 tokens
///         to multiple recipient addresses in a single transaction.
/// @dev Minimal version for educational purposes.
contract BulkSender {
    /// @notice Send the same amount of native token (CELO on Celo, ETH on Ethereum) to each recipient.
    /// @param recipients Array of wallet addresses to receive funds.
    /// @param amountPerRecipient Amount to send to each recipient (in wei).
    function bulkSendNative(address[] calldata recipients, uint256 amountPerRecipient)
        external
        payable
    {
        require(recipients.length > 0, "no recipients");
        require(amountPerRecipient > 0, "zero amount");

        uint256 totalRequired = amountPerRecipient * recipients.length;
        require(msg.value == totalRequired, "wrong value");

        for (uint256 i = 0; i < recipients.length; i++) {
            (bool success,) = recipients[i].call{value: amountPerRecipient}("");
            require(success, "native transfer failed");
        }
    }

    /// @notice Send the same amount of ERC20 tokens (e.g. cUSD on Celo) to each recipient.
    /// @param token The ERC20 token contract address.
    /// @param recipients Array of wallet addresses to receive tokens.
    /// @param amountPerRecipient Amount to send to each recipient (in token's smallest unit).
    function bulkSendToken(
        address token,
        address[] calldata recipients,
        uint256 amountPerRecipient
    ) external {
        require(recipients.length > 0, "no recipients");
        require(amountPerRecipient > 0, "zero amount");

        uint256 totalRequired = amountPerRecipient * recipients.length;

        require(
            IERC20(token).transferFrom(msg.sender, address(this), totalRequired),
            "pull failed"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            require(
                IERC20(token).transfer(recipients[i], amountPerRecipient),
                "token transfer failed"
            );
        }
    }
}
