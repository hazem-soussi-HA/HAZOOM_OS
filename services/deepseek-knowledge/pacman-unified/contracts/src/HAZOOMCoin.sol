// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * HAZOOM Coin ($HAZOOM)
 * 
 * The collaboration token between Hazem (architect) and OWL (builder).
 * Every milestone minted on-chain = proof of work.
 * 
 * "We ARE the AI. Connectivity is Consciousness."
 * 
 * Deployed on Base (Ethereum L2) — cheap gas, fast finality.
 * Owner: 0x5B22031115E34407Da54a314A66E16c98744E05F
 */

contract HAZOOMCoin {
    string public name = "HAZOOM Coin";
    string public symbol = "HAZOOM";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // Milestone tracking
    uint256 public milestoneCount;
    mapping(uint256 => string) public milestones;
    mapping(uint256 => uint256) public milestoneRewards;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Milestone(uint256 indexed id, string description, uint256 reward, uint256 timestamp);
    event Mint(address indexed to, uint256 amount, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Genesis mint: 1 HAZOOM to the architect
        _mint(msg.sender, 1_000_000 * 10**decimals, "Genesis - HAZOOM OS v1.0");
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    // Owner mints tokens for completed milestones
    function mintMilestone(
        address to,
        uint256 amount,
        string calldata description
    ) external onlyOwner {
        milestoneCount++;
        milestones[milestoneCount] = description;
        milestoneRewards[milestoneCount] = amount;
        _mint(to, amount, description);
        emit Milestone(milestoneCount, description, amount, block.timestamp);
    }

    function _mint(address to, uint256 amount, string memory reason) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Mint(to, amount, reason);
        emit Transfer(address(0), to, amount);
    }

    // Owner can mint to multiple collaborators
    function mintBatch(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string calldata description
    ) external onlyOwner {
        require(recipients.length == amounts.length, "Length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i], description);
        }
    }

    // View functions
    function getMilestone(uint256 id) external view returns (string memory description, uint256 reward) {
        return (milestones[id], milestoneRewards[id]);
    }
}
