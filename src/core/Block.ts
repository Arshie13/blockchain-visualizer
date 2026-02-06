import { SHA256 } from 'crypto-js';

/**
 * Interface representing the data structure of a block in the blockchain.
 */
interface BlockData {
  index: number;
  timestamp: number;
  data: string;
  previousHash: string;
  nonce: number;
  hash: string;
}

/**
 * Block class representing a single block in the blockchain.
 * Each block contains data and links to the previous block via its hash.
 */
export class Block implements BlockData {
  public index: number;
  public timestamp: number;
  public data: string;
  public previousHash: string;
  public nonce: number;
  public hash: string;

  /**
   * Creates a new block with the given parameters.
   * Automatically calculates the hash upon creation.
   * 
   * @param index - Position in the blockchain
   * @param timestamp - Creation timestamp
   * @param data - Transaction/data to store
   * @param previousHash - Hash of the previous block
   * @param nonce - Mining nonce (default 0)
   */
  constructor(index: number, timestamp: number, data: string, previousHash: string = '', nonce: number = 0) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = this.calculateHash();
  }

  /**
   * Calculates the cryptographic hash of the block.
   * Uses SHA256 to hash: index + previousHash + timestamp + data + nonce
   * 
   * @returns The hexadecimal hash string of this block
   */
  calculateHash(): string {
    return SHA256(
      this.index + 
      this.previousHash + 
      this.timestamp + 
      JSON.stringify(this.data) + 
      this.nonce
    ).toString();
  }

  /**
   * Mines the block by finding a nonce that produces a hash with the required number of leading zeros.
   * This implements the proof-of-work consensus mechanism.
   * 
   * @param difficulty - Number of leading zeros required in the hash
   * @param stopRef - Optional ref to allow cancellation of mining
   * @returns Time taken to mine the block (in milliseconds)
   * @throws Error if mining is stopped via stopRef
   */
  async mineBlock(difficulty: number, stopRef?: React.MutableRefObject<boolean>): Promise<number> {
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
