import { SHA256 } from 'crypto-js';

interface BlockData {
  index: number;
  timestamp: number;
  data: string;
  previousHash: string;
  nonce: number;
  hash: string;
}

export class Block implements BlockData {
  public index: number;
  public timestamp: number;
  public data: string;
  public previousHash: string;
  public nonce: number;
  public hash: string;

  constructor(index: number, timestamp: number, data: string, previousHash: string = '', nonce: number = 0) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    return SHA256(
      this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce
    ).toString();
  }

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

      // Allow UI to update every ~5ms (every 2000 iterations)
      if (this.nonce % 2000 === 0) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    }
    return performance.now() - start;
  }
}

export class Blockchain {
  public chain: Block[];
  public difficulty: number;

  constructor(difficulty: number = 2) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty;
  }

  private createGenesisBlock(): Block {
    return new Block(0, Date.now(), 'Genesis Block', '0');
  }

  private getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  async addBlock(data: string, stopRef?: React.MutableRefObject<boolean>): Promise<number> {
    const block = new Block(this.chain.length, Date.now(), data, this.getLatestBlock().hash);
    const miningTime = await block.mineBlock(this.difficulty, stopRef);
    this.chain.push(block);
    return miningTime;
  }

  isValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
    }
    return true;
  }

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
