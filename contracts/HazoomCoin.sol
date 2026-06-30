// SPDX-License-Identifier: MIT
// HAZOOM COIN — ERC-20 Token
// Copyright © 2024-2026 Hazem Soussi (HA)
// Licensed under the HA License — see LICENSE.ha

pragma solidity ^0.8.20;

/**
 * @title HazoomCoin
 * @author Hazem Soussi (HA)
 * @notice The native currency of the HAZOOM OS ecosystem
 * @dev ERC-20 token with minting controlled by the Creator
 *
 * TOKENOMICS:
 * - Name: HAZOOM Coin
 * - Symbol: HAZ
 * - Decimals: 18
 * - Max Supply: 21,000,000 HAZ (like Bitcoin, a deliberate scarcity)
 * - Initial Mint: 1,000,000 HAZ to Creator
 *
 * PRINCIPLE:
 * This token represents value created by work, not by speculation.
 * "Money and its value is measured with the positive intention."
 */
contract HazoomCoin {

    string public constant name = "HAZOOM Coin";
    string public constant symbol = "HAZ";
    uint8 public constant decimals = 18;
    uint256 public constant MAX_SUPPLY = 21_000_000 * 10**18;

    address public immutable creator;
    uint256 public totalSupply;
    bool public mintingFinished;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ── Events ─────────────────────────────────────────────
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);
    event MintingFinished();

    // ── Modifiers ──────────────────────────────────────────
    modifier onlyCreator() {
        require(msg.sender == creator, "HAZ: only creator");
        _;
    }

    modifier canMint() {
        require(!mintingFinished, "HAZ: minting finished");
        _;
    }

    // ── Constructor ────────────────────────────────────────
    constructor() {
        creator = msg.sender;
        uint256 initialMint = 1_000_000 * 10**18; // 1M HAZ to creator
        _mint(msg.sender, initialMint);
    }

    // ── ERC-20 Standard ────────────────────────────────────
    function transfer(address to, uint256 value) external returns (bool) {
        require(to != address(0), "HAZ: transfer to zero");
        require(balanceOf[msg.sender] >= value, "HAZ: insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool) {
        require(balanceOf[from] >= value, "HAZ: insufficient balance");
        require(allowance[from][msg.sender] >= value, "HAZ: insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }

    // ── Minting (Creator only) ─────────────────────────────
    function mint(address to, uint256 value) external onlyCreator canMint {
        require(totalSupply + value <= MAX_SUPPLY, "HAZ: max supply reached");
        _mint(to, value);
    }

    function finishMinting() external onlyCreator {
        mintingFinished = true;
        emit MintingFinished();
    }

    // ── Burn ───────────────────────────────────────────────
    function burn(uint256 value) external {
        require(balanceOf[msg.sender] >= value, "HAZ: insufficient balance");
        balanceOf[msg.sender] -= value;
        totalSupply -= value;
        emit Burn(msg.sender, value);
        emit Transfer(msg.sender, address(0), value);
    }

    // ── Internal ───────────────────────────────────────────
    function _mint(address to, uint256 value) internal {
        require(to != address(0), "HAZ: mint to zero");
        totalSupply += value;
        balanceOf[to] += value;
        emit Mint(to, value);
        emit Transfer(address(0), to, value);
    }

    // ── View ───────────────────────────────────────────────
    function remainingMintable() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply;
    }
}
