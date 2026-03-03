// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {BulkSender} from "../src/BulkSender.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract BulkSenderTest is Test {
    BulkSender public bulkSender;
    MockERC20 public token;

    address alice = address(0x1);
    address bob = address(0x2);
    address carol = address(0x3);

    function setUp() public {
        bulkSender = new BulkSender();
        token = new MockERC20();
        token.mint(address(this), 1000e18);
    }

    function test_BulkSendNative() public {
        vm.deal(address(this), 10 ether);

        address[] memory recipients = new address[](2);
        recipients[0] = bob;
        recipients[1] = carol;

        uint256 amountPerRecipient = 1 ether;
        uint256 totalRequired = amountPerRecipient * 2;

        uint256 bobBefore = bob.balance;
        uint256 carolBefore = carol.balance;

        bulkSender.bulkSendNative{value: totalRequired}(recipients, amountPerRecipient);

        assertEq(bob.balance, bobBefore + amountPerRecipient);
        assertEq(carol.balance, carolBefore + amountPerRecipient);
    }

    function test_BulkSendNative_RefundExcess() public {
        vm.deal(address(this), 10 ether);

        address[] memory recipients = new address[](1);
        recipients[0] = bob;

        uint256 amountPerRecipient = 1 ether;
        uint256 excessSent = 5 ether;

        uint256 senderBefore = address(this).balance;

        bulkSender.bulkSendNative{value: excessSent}(recipients, amountPerRecipient);

        assertEq(bob.balance, amountPerRecipient);
        assertEq(address(this).balance, senderBefore - amountPerRecipient);
    }

    function test_BulkSendToken() public {
        address[] memory recipients = new address[](2);
        recipients[0] = bob;
        recipients[1] = carol;

        uint256 amountPerRecipient = 100e18;
        uint256 totalRequired = amountPerRecipient * 2;

        token.approve(address(bulkSender), totalRequired);
        bulkSender.bulkSendToken(address(token), recipients, amountPerRecipient);

        assertEq(token.balanceOf(bob), amountPerRecipient);
        assertEq(token.balanceOf(carol), amountPerRecipient);
    }

    function test_RevertWhen_EmptyRecipients() public {
        address[] memory recipients;
        vm.expectRevert(BulkSender.EmptyRecipientsList.selector);
        bulkSender.bulkSendNative(recipients, 1 ether);
    }

    function test_RevertWhen_ZeroAmount() public {
        address[] memory recipients = new address[](1);
        recipients[0] = bob;

        vm.expectRevert(BulkSender.ZeroAmount.selector);
        bulkSender.bulkSendNative{value: 1 ether}(recipients, 0);
    }

    function test_RevertWhen_InsufficientNative() public {
        address[] memory recipients = new address[](1);
        recipients[0] = bob;

        vm.expectRevert(BulkSender.InsufficientBalance.selector);
        bulkSender.bulkSendNative{value: 0.5 ether}(recipients, 1 ether);
    }

    receive() external payable {}
}
