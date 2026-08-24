// ═══════════════════════════════════════════════════════
//  wallet.js — Web3 wallet connection for HAZOOM Coin
// ═══════════════════════════════════════════════════════

// HAZOOM Coin contract (Base mainnet — update after deployment)
const HAZOOM_CONTRACT = '0x0000000000000000000000000000000000000000'; // TODO: update after deploy
const BASE_CHAIN_ID = 0x2105; // Base mainnet
const BASE_CHAIN_ID_SEPOLIA = 0x14a34; // Base Sepolia testnet

let provider = null;
let signer = null;
let walletAddress = null;
let isConnected = false;

export function getWallet() {
  return { provider, signer, walletAddress, isConnected };
}

export async function connectWallet() {
  if (!window.ethereum) {
    return { success: false, error: 'No wallet found. Install MetaMask.' };
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    walletAddress = await signer.getAddress();

    // Check if on Base
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    if (chainId !== BASE_CHAIN_ID && chainId !== BASE_CHAIN_ID_SEPOLIA) {
      // Ask to switch to Base
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }],
        });
      } catch (switchError) {
        // Base not added, try to add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          });
        } else {
          return { success: false, error: 'Please switch to Base network' };
        }
      }
    }

    isConnected = true;
    window.__wallet = { address: walletAddress, chainId };
    return { success: true, address: walletAddress };
  } catch (err) {
    console.error('Wallet connect error:', err);
    return { success: false, error: err.message };
  }
}

export async function mintMilestone(description, amount) {
  if (!isConnected || !signer) {
    return { success: false, error: 'Wallet not connected' };
  }

  try {
    const abi = [
      'function mintMilestone(address to, uint256 amount, string calldata description)',
    ];
    const contract = new ethers.Contract(HAZOOM_CONTRACT, abi, signer);
    const tx = await contract.mintMilestone(walletAddress, amount, description);
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.hash };
  } catch (err) {
    console.error('Mint error:', err);
    return { success: false, error: err.message };
  }
}

export async function getBalance() {
  if (!isConnected || !walletAddress) return 0;
  try {
    const abi = ['function balanceOf(address) view returns (uint256)'];
    const contract = new ethers.Contract(HAZOOM_CONTRACT, abi, provider);
    const bal = await contract.balanceOf(walletAddress);
    return ethers.formatUnits(bal, 18);
  } catch {
    return 0;
  }
}

export function onWalletChange(callback) {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        isConnected = false;
        walletAddress = null;
      } else {
        walletAddress = accounts[0];
      }
      callback({ type: 'account', address: walletAddress });
    });
    window.ethereum.on('chainChanged', () => {
      callback({ type: 'chain' });
      window.location.reload();
    });
  }
}
