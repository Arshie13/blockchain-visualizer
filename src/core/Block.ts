import crypto from 'crypto-js';
import { Transaction } from './Transaction';

// Helper function to create SHA256 hash
function sha256(data: string): string {
  return crypto.SHA256(data).toString();
}

// Interface representing the data structure of a block in the blockchain.
interface BlockData {
  index: number;
  timestamp: number;
  data: Transaction[];
  previousHash: string;
  nonce: number;
  hash: string;
}

// Block class representing a single block in the blockchain.
export class Block implements BlockData {
  public index: number;
  public timestamp: number;
  public data: Transaction[];
  public previousHash: string;
  public nonce: number;
  public hash: string;


  // Creates a new block with the given parameters.
  constructor(index: number, timestamp: number, data: Transaction[], previousHash: string = '', nonce: number = 0) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = this.calculateHash();
  }

  // Calculates the cryptographic hash of the block
  calculateHash(): string {
    return sha256(
      String(this.index) + 
      this.previousHash + 
      String(this.timestamp) + 
      JSON.stringify(this.data) + 
      String(this.nonce)
    );
  }

  // Mines the block by finding a nonce that produces a hash with the required number of leading zeros
  mineBlock(difficulty: number, minerAddress: string, coinbaseReward: number = 50): { miningTime: number; coinbaseTx: Transaction } {
    const target = '0'.repeat(difficulty);
    const start = performance.now();
    
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    
    // Calculate mining time to display in page
    const miningTime = performance.now() - start;

    // Create coinbase transaction for the miner
    const coinbaseTx = new Transaction('COINBASE', minerAddress, coinbaseReward);    

    return { miningTime, coinbaseTx };
  }

  // Mines the block asynchronously (for UI responsiveness)
  async mineBlockAsync(difficulty: number, stopRef?: { current: boolean }): Promise<number> {
    const target = '0'.repeat(difficulty);

    const start = performance.now();
    
    while (this.hash.substring(0, difficulty) !== target) {
      // Check if mining should be stopped
      if (stopRef?.current) {
        throw new Error('Mining stopped');
      }

      this.nonce++;
      this.hash = this.calculateHash();

      // Yield to the UI every 2000 iterations (~5ms) to keep it responsive
      if (this.nonce % 2000 === 0) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    }
    
    return performance.now() - start;
  }
}
