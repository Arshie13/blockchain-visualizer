import { Block } from "./Block";
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
