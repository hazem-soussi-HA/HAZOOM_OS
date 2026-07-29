// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PrintOnDemandProofOfWork
 * @author Hazem Soussi
 * @notice Immutable proof of work + proof of concept for the Hazoom
 *         Print-on-Demand e-commerce platform.
 *
 * This contract is NOT part of the storefront runtime. It is an on-chain
 * notarization layer that records authorship, project metadata, development
 * milestones, feature-implementation status, and IPFS hashes of the codebase
 * so the work can be independently verified at any time.
 *
 * Authorship and contact for Hazem Soussi:
 *   - Email : hazem dot soussi at gmail dot com
 *   - Repo  : https://github.com/hazem-soussi-HA/hazoom
 *
 * Deploy note: deploy once, then call verifyCodebase() / setComponentHashes()
 * with the IPFS CIDs of the released code. All mutating functions are
 * restricted to the original deployer (the author).
 */

contract PrintOnDemandProofOfWork {

    // ================ AUTHORS & CONTACT ================

    address public immutable author;
    string  public constant AUTHOR_NAME     = "Hazem Soussi";
    string  public constant CONTACT_EMAIL   = "hazem.soussi@gmail.com";
    string  public constant REPO_URL        = "https://github.com/hazem-soussi-HA/hazoom";

    // ================ PROJECT METADATA ================

    string  public constant PROJECT_NAME        = "Hazoom - Print-on-Demand E-Commerce Platform";
    string  public constant PROJECT_VERSION     = "1.0.0";
    string  public constant PROJECT_DESCRIPTION = "A complete Print-on-Demand e-commerce platform with design customization, Stripe payment integration, Printify API connectivity, JWT auth, admin dashboard, and an on-chain proof-of-work notarization layer.";
    uint256 public immutable PROJECT_LAUNCH_DATE;

    // ================ CODEBASE VERIFICATION (IPFS) ================

    bytes32 public codebaseIpfsHash;  // complete repo release
    bytes32 public frontendHash;      // /client
    bytes32 public backendHash;       // /server
    bytes32 public contractHash;      // this contract source

    // ================ MILESTONES ================

    struct Milestone {
        string  name;
        string  description;
        uint256 timestamp;
        bool    completed;
    }

    mapping(uint256 => Milestone) public milestones;
    uint256 public milestoneCount;

    // ================ FEATURES ================

    struct Feature {
        string  name;
        bool    implemented;
        string  status;
        uint256 timestamp;
    }

    mapping(uint256 => Feature) public features;
    uint256 public featureCount;

    // ================ DEVELOPERS ================

    mapping(address => bool) public verifiedDevelopers;
    address[] public developerTeam;

    // ================ EVENTS ================

    event CodebaseVerified(bytes32 ipfsHash, uint256 timestamp);
    event ComponentHashesSet(bytes32 frontend, bytes32 backend, bytes32 contractHash, uint256 timestamp);
    event MilestoneAdded(uint256 indexed id, string name, uint256 timestamp);
    event MilestoneCompleted(uint256 indexed id, uint256 timestamp);
    event FeatureVerified(uint256 indexed id, string name, bool implemented);
    event DeveloperAdded(address indexed developer, uint256 timestamp);

    // ================ MODIFIERS ================

    modifier onlyAuthor() {
        require(msg.sender == author, "Only the author can perform this action");
        _;
    }

    // ================ CONSTRUCTOR ================

    constructor() {
        author = msg.sender;
        PROJECT_LAUNCH_DATE = block.timestamp;
        verifiedDevelopers[msg.sender] = true;
        developerTeam.push(msg.sender);

        // --- Features shipped (all implemented in v1.0.0) ---
        _addFeature("User Authentication System", true,  "Implemented - JWT + bcrypt");
        _addFeature("Product Management",        true,  "Implemented - catalog, search, filter");
        _addFeature("Design Customization Tool",  true,  "Implemented - canvas studio");
        _addFeature("Shopping Cart",              true,  "Implemented - localStorage + sync");
        _addFeature("Stripe Payment Integration", true,  "Implemented - test mode + webhook");
        _addFeature("Printify API Integration",   true,  "Implemented - sync + fulfill (mock mode)");
        _addFeature("Admin Dashboard",            true,  "Implemented - orders, products, analytics");
        _addFeature("Order Management",           true,  "Implemented - lifecycle + status");

        // --- Milestones ---
        _addMilestone("Project Initiation",    "Concept + architecture");
        _addMilestone("Frontend Development",  "SPA UI/UX implementation");
        _addMilestone("Backend Development",   "Express API + models + services");
        _addMilestone("Integration",           "Stripe + Printify wiring");
        _addMilestone("Testing",               "End-to-end smoke tests (17/17)");
        _addMilestone("Deployment",            "Production-ready, env-configured");
    }

    // ================ CORE FUNCTIONS ================

    /// @notice Record the IPFS hash of the full codebase release.
    function verifyCodebase(bytes32 _ipfsHash) external onlyAuthor {
        require(_ipfsHash != bytes32(0), "IPFS hash cannot be empty");
        codebaseIpfsHash = _ipfsHash;
        emit CodebaseVerified(_ipfsHash, block.timestamp);
    }

    /// @notice Granular hashes for frontend / backend / contract source.
    function setComponentHashes(
        bytes32 _frontendHash,
        bytes32 _backendHash,
        bytes32 _contractHash
    ) external onlyAuthor {
        frontendHash = _frontendHash;
        backendHash  = _backendHash;
        contractHash = _contractHash;
        emit ComponentHashesSet(_frontendHash, _backendHash, _contractHash, block.timestamp);
    }

    /// @notice Mark a milestone complete.
    function completeMilestone(uint256 _milestoneId) external onlyAuthor {
        require(_milestoneId < milestoneCount, "Invalid milestone ID");
        require(!milestones[_milestoneId].completed, "Milestone already completed");
        milestones[_milestoneId].completed = true;
        milestones[_milestoneId].timestamp = block.timestamp;
        emit MilestoneCompleted(_milestoneId, block.timestamp);
    }

    /// @notice Update a feature's implementation status.
    function verifyFeature(uint256 _featureId, bool _implemented, string memory _status) external onlyAuthor {
        require(_featureId < featureCount, "Invalid feature ID");
        features[_featureId].implemented = _implemented;
        features[_featureId].status      = _status;
        features[_featureId].timestamp   = block.timestamp;
        emit FeatureVerified(_featureId, features[_featureId].name, _implemented);
    }

    /// @notice Add a verified developer to the team.
    function addDeveloper(address _developer) external onlyAuthor {
        require(_developer != address(0), "Invalid address");
        require(!verifiedDevelopers[_developer], "Already verified");
        verifiedDevelopers[_developer] = true;
        developerTeam.push(_developer);
        emit DeveloperAdded(_developer, block.timestamp);
    }

    // ================ INTERNAL ================

    function _addMilestone(string memory _name, string memory _description) internal {
        milestones[milestoneCount] = Milestone({
            name:        _name,
            description: _description,
            timestamp:   block.timestamp,
            completed:   false
        });
        emit MilestoneAdded(milestoneCount, _name, block.timestamp);
        milestoneCount++;
    }

    function _addFeature(string memory _name, bool _implemented, string memory _status) internal {
        features[featureCount] = Feature({
            name:        _name,
            implemented: _implemented,
            status:      _status,
            timestamp:   block.timestamp
        });
        featureCount++;
    }

    // ================ VIEWS ================

    function getVerificationStatus() public view returns (
        bool    codebaseVerified,
        uint256 totalMilestones,
        uint256 completedMilestones,
        uint256 totalFeatures,
        uint256 implementedFeatures,
        uint256 launchTime
    ) {
        uint256 completed = 0;
        for (uint256 i = 0; i < milestoneCount; i++) {
            if (milestones[i].completed) completed++;
        }
        uint256 implemented = 0;
        for (uint256 i = 0; i < featureCount; i++) {
            if (features[i].implemented) implemented++;
        }
        return (
            codebaseIpfsHash != bytes32(0),
            milestoneCount,
            completed,
            featureCount,
            implemented,
            PROJECT_LAUNCH_DATE
        );
    }

    function getAllMilestones() public view returns (Milestone[] memory) {
        Milestone[] memory result = new Milestone[](milestoneCount);
        for (uint256 i = 0; i < milestoneCount; i++) {
            result[i] = milestones[i];
        }
        return result;
    }

    function getAllFeatures() public view returns (Feature[] memory) {
        Feature[] memory result = new Feature[](featureCount);
        for (uint256 i = 0; i < featureCount; i++) {
            result[i] = features[i];
        }
        return result;
    }

    function getTeam() public view returns (address[] memory) {
        return developerTeam;
    }

    /// @notice Deterministic project fingerprint for off-chain verification.
    function getProjectId() public view returns (bytes32) {
        return keccak256(abi.encodePacked(
            PROJECT_NAME,
            PROJECT_VERSION,
            author,
            PROJECT_LAUNCH_DATE,
            codebaseIpfsHash
        ));
    }
}
