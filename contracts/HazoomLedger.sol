// SPDX-License-Identifier: MIT
// HAZOOM LEDGER — Transaction Ledger
// Copyright © 2024-2026 Hazem Soussi (HA)
// Licensed under the HA License — see LICENSE.ha

pragma solidity ^0.8.20;

import "./HazoomCoin.sol";

/**
 * @title HazoomLedger
 * @author Hazem Soussi (HA)
 * @notice Transaction ledger for the HAZOOM OS payment system
 * @dev Records all payments, refunds, and transfers with metadata
 *
 * PURPOSE:
 * This is not just a payment processor. It is a record of intention.
 * Every transaction carries a purpose — buying, helping, building.
 * "The money will come later. Money and its value is measured
 *  with the positive intention."
 */
contract HazoomLedger {

    HazoomCoin public immutable haz;
    address public immutable creator;

    enum TxType { Purchase, Refund, Transfer, Donation, License, Reward }
    enum TxStatus { Pending, Completed, Failed, Refunded }

    struct Transaction {
        uint256 id;
        address from;
        address to;
        uint256 amount;
        TxType txType;
        TxStatus status;
        uint256 timestamp;
        string metadata; // JSON: { "purpose": "...", "project": "..." }
    }

    uint256 public txCount;
    mapping(uint256 => Transaction) public transactions;
    mapping(address => uint256[]) public userTxIds;

    // ── Events ─────────────────────────────────────────────
    event Payment(
        uint256 indexed id,
        address indexed from,
        address indexed to,
        uint256 amount,
        TxType txType,
        string metadata
    );
    event Refund(uint256 indexed id, uint256 indexed originalId, uint256 amount);
    event StatusChange(uint256 indexed id, TxStatus newStatus);

    // ── Modifiers ──────────────────────────────────────────
    modifier onlyCreator() {
        require(msg.sender == creator, "Ledger: only creator");
        _;
    }

    // ── Constructor ────────────────────────────────────────
    constructor(address _hazAddress) {
        haz = HazoomCoin(_hazAddress);
        creator = msg.sender;
    }

    // ── Payment ────────────────────────────────────────────
    function pay(
        address to,
        uint256 amount,
        TxType txType,
        string calldata metadata
    ) external returns (uint256) {
        require(to != address(0), "Ledger: zero address");
        require(amount > 0, "Ledger: zero amount");

        uint256 id = txCount++;
        transactions[id] = Transaction({
            id: id,
            from: msg.sender,
            to: to,
            amount: amount,
            txType: txType,
            status: TxStatus.Pending,
            timestamp: block.timestamp,
            metadata: metadata
        });

        userTxIds[msg.sender].push(id);
        userTxIds[to].push(id);

        // Transfer HAZ tokens
        bool success = haz.transferFrom(msg.sender, to, amount);
        if (success) {
            transactions[id].status = TxStatus.Completed;
        } else {
            transactions[id].status = TxStatus.Failed;
            revert("Ledger: transfer failed");
        }

        emit Payment(id, msg.sender, to, amount, txType, metadata);
        return id;
    }

    // ── Refund (Creator only) ──────────────────────────────
    function refund(uint256 originalTxId) external onlyCreator {
        Transaction storage original = transactions[originalTxId];
        require(original.status == TxStatus.Completed, "Ledger: not completed");
        require(original.amount > 0, "Ledger: zero amount");

        uint256 id = txCount++;
        transactions[id] = Transaction({
            id: id,
            from: original.to,
            to: original.from,
            amount: original.amount,
            txType: TxType.Refund,
            status: TxStatus.Completed,
            timestamp: block.timestamp,
            metadata: "refund"
        });

        original.status = TxStatus.Refunded;
        userTxIds[original.from].push(id);

        emit Refund(id, originalTxId, original.amount);
        emit StatusChange(originalTxId, TxStatus.Refunded);
    }

    // ── View Functions ─────────────────────────────────────
    function getTransaction(uint256 id) external view returns (Transaction memory) {
        require(id < txCount, "Ledger: invalid id");
        return transactions[id];
    }

    function getUserTransactions(address user) external view returns (uint256[] memory) {
        return userTxIds[user];
    }

    function getTxCount() external view returns (uint256) {
        return txCount;
    }
}
