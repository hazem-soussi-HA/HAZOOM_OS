// SPDX-License-Identifier: MIT
// HAZOOM LICENSE — License NFT
// Copyright © 2024-2026 Hazem Soussi (HA)
// Licensed under the HA License — see LICENSE.ha

pragma solidity ^0.8.20;

/**
 * @title HazoomLicense
 * @author Hazem Soussi (HA)
 * @notice License NFT representing usage rights to HAZOOM OS
 * @dev ERC-721-like license token (simplified, no external deps)
 *
 * PURPOSE:
 * Each License NFT represents a right to use HAZOOM OS under
 * specific terms. This is how copyright is enforced on-chain.
 *
 * LICENSE TYPES:
 * 0 = Personal (free, attribution required)
 * 1 = Educational (free for schools/universities)
 * 2 = Commercial (paid, requires Creator approval)
 * 3 = Enterprise (custom terms, SLA)
 *
 * "With great power comes great responsibility."
 */
contract HazoomLicense {

    string public constant name = "HAZOOM License";
    string public constant symbol = "HAZ-LICENSE";

    address public immutable creator;
    uint256 public licenseCount;

    enum LicenseType { Personal, Educational, Commercial, Enterprise }
    enum LicenseStatus { Active, Suspended, Revoked, Expired }

    struct License {
        uint256 id;
        address holder;
        LicenseType licenseType;
        LicenseStatus status;
        uint256 issuedAt;
        uint256 expiresAt; // 0 = never expires
        string termsURI;   // IPFS hash or URL to full terms
    }

    mapping(uint256 => License) public licenses;
    mapping(address => uint256[]) public holderLicenses;
    mapping(LicenseType => uint256) public licensePrice; // in HAZ tokens

    // ── Events ─────────────────────────────────────────────
    event LicenseIssued(
        uint256 indexed id,
        address indexed holder,
        LicenseType licenseType,
        uint256 expiresAt
    );
    event LicenseStatusChange(uint256 indexed id, LicenseStatus newStatus);
    event LicenseRenewed(uint256 indexed id, uint256 newExpiresAt);
    event PriceSet(LicenseType indexed licenseType, uint256 price);

    // ── Modifiers ──────────────────────────────────────────
    modifier onlyCreator() {
        require(msg.sender == creator, "License: only creator");
        _;
    }

    modifier validLicense(uint256 id) {
        require(id < licenseCount, "License: invalid id");
        _;
    }

    // ── Constructor ────────────────────────────────────────
    constructor() {
        creator = msg.sender;
        // Set prices in HAZ (18 decimals)
        licensePrice[LicenseType.Personal] = 0;           // Free
        licensePrice[LicenseType.Educational] = 0;        // Free
        licensePrice[LicenseType.Commercial] = 1000 * 10**18;  // 1000 HAZ
        licensePrice[LicenseType.Enterprise] = 10000 * 10**18; // 10000 HAZ
    }

    // ── Issue License ──────────────────────────────────────
    function issueLicense(
        address holder,
        LicenseType licenseType,
        uint256 expiresAt,
        string calldata termsURI
    ) external onlyCreator returns (uint256) {
        require(holder != address(0), "License: zero address");

        uint256 id = licenseCount++;
        licenses[id] = License({
            id: id,
            holder: holder,
            licenseType: licenseType,
            status: LicenseStatus.Active,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            termsURI: termsURI
        });

        holderLicenses[holder].push(id);
        emit LicenseIssued(id, holder, licenseType, expiresAt);
        return id;
    }

    // ── Issue Personal License (self-service) ──────────────
    function issuePersonalLicense(string calldata termsURI) external returns (uint256) {
        uint256 id = licenseCount++;
        licenses[id] = License({
            id: id,
            holder: msg.sender,
            licenseType: LicenseType.Personal,
            status: LicenseStatus.Active,
            issuedAt: block.timestamp,
            expiresAt: 0, // Never expires
            termsURI: termsURI
        });

        holderLicenses[msg.sender].push(id);
        emit LicenseIssued(id, msg.sender, LicenseType.Personal, 0);
        return id;
    }

    // ── Status Management (Creator only) ───────────────────
    function setLicenseStatus(
        uint256 id,
        LicenseStatus newStatus
    ) external onlyCreator validLicense(id) {
        licenses[id].status = newStatus;
        emit LicenseStatusChange(id, newStatus);
    }

    function renewLicense(
        uint256 id,
        uint256 newExpiresAt
    ) external onlyCreator validLicense(id) {
        licenses[id].expiresAt = newExpiresAt;
        licenses[id].status = LicenseStatus.Active;
        emit LicenseRenewed(id, newExpiresAt);
    }

    // ── Price Management (Creator only) ────────────────────
    function setPrice(
        LicenseType licenseType,
        uint256 price
    ) external onlyCreator {
        licensePrice[licenseType] = price;
        emit PriceSet(licenseType, price);
    }

    // ── View Functions ─────────────────────────────────────
    function getLicense(uint256 id) external view returns (License memory) {
        require(id < licenseCount, "License: invalid id");
        return licenses[id];
    }

    function getHolderLicenses(address holder) external view returns (uint256[] memory) {
        return holderLicenses[holder];
    }

    function isValid(uint256 id) external view returns (bool) {
        if (id >= licenseCount) return false;
        License memory l = licenses[id];
        if (l.status != LicenseStatus.Active) return false;
        if (l.expiresAt != 0 && l.expiresAt < block.timestamp) return false;
        return true;
    }

    function getPrice(LicenseType licenseType) external view returns (uint256) {
        return licensePrice[licenseType];
    }
}
