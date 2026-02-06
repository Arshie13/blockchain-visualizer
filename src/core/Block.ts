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

/**
 * Blockchain class managing a chain of blocks.
 * Provides methods for adding blocks, validation, and deep copying.
 */
export class Blockchain {
  public chain: Block[];      // Array of blocks in the chain
  public difficulty: number;   // Mining difficulty (leading zeros required)

  /**
   * Creates a new blockchain with the specified difficulty.
   * Initializes with a genesis block.
   * 
   * @param difficulty - Number of leading zeros required in mined hashes (default 2)
   */
  constructor(difficulty: number = 2) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty;
  }

  /**
   * Creates the genesis block (first block in the chain).
   * Hardcoded with index 0, "Genesis Block" data, and "0" as previousHash.
   * 
   * @returns The genesis block instance
   */
  private createGenesisBlock(): Block {
    return new Block(0, Date.now(), 'Genesis Block', '0');
  }

  /**
   * Gets the most recently added block in the chain.
   * Used when adding new blocks to know what to reference.
   * 
   * @returns The latest block in the chain
   */
  private getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Adds a new block to the blockchain.
   * Creates the block, mines it using proof-of-work, then adds it to the chain.
   * 
   * @param data - The data/transactions to store in the new block
   * @param stopRef - Optional ref to allow cancellation of mining
   * @returns Time taken to mine the block (in milliseconds)
   * @throws Error if mining is stopped
   */
  async addBlock(data: string, stopRef?: React.MutableRefObject<boolean>): Promise<number> {
    const block = new Block(
      this.chain.length, 
      Date.now(), 
      data, 
      this.getLatestBlock().hash
    );
    
    const miningTime = await block.mineBlock(this.difficulty, stopRef);
    this.chain.push(block);
    
    return miningTime;
  }

  /**
   * Validates the integrity of the entire blockchain.
   * 
   * @returns true if the chain is valid, false if any tampering is detected
   */
  isValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // Check if current block's hash matches its calculated hash
      if (current.hash !== current.calculateHash()) {
        return false;
      }

      // Check if current block's previousHash matches previous block's hash
      if (current.previousHash !== previous.hash) {
        return false;
      }
    }
    return true;
  }

  /**
   * Creates a deep copy of the blockchain.
   * 
   * @param chain - The blockchain (array of blocks) to copy
   * @returns A new array of Block instances with identical data
   */
  public static deepCopy(chain: Block[]): Block[] {
    return chain.map((block) => new Block(
      block.index,
      block.timestamp,
      block.data,
      block.previousHash,
      block.nonce
    ));
  }
}
