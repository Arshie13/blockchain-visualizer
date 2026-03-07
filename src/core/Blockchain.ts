import { Block } from "./Block";
import { Transaction } from "./Transaction";
import { Wallet } from "./Wallet";

//Blockchain class managing a chain of blocks. 
export class Blockchain {
  public chain: Block[];           // Array of blocks in the chain
  public difficulty: number;        // Mining difficulty (leading zeros required)
  public wallet: Wallet;            // Wallet for balance tracking
  public coinbaseReward: number;    // Reward for mining a block
  public pendingTransactions: Transaction[]; // Transactions waiting to be mined

  
  //Creates a new blockchain with the specified difficulty.
  constructor(difficulty: number = 2, coinbaseReward: number = 50) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty;
    this.wallet = new Wallet();
    this.coinbaseReward = coinbaseReward;
    this.pendingTransactions = [];
  }
  
  //Creates the genesis block (first block in the chain)
  private createGenesisBlock(): Block {
    const genesisTx = new Transaction('COINBASE', 'System', this.coinbaseReward);
    return new Block(0, Date.now(), [genesisTx], '0');
  }

  //Gets the most recently added block in the chain
  private getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  //Adds a transaction to the pending transactions list   
  addTransaction(transaction: Transaction): boolean {
    // Validate transaction format
    if (!transaction.isValid()) {
      console.log('Invalid transaction:', transaction.toString());
      return false;
    }

    this.pendingTransactions.push(transaction);
    return true;
  }

  //Adds a new block to the blockchain (synchronous version for CLI)
  addBlock(minerAddress: string): { miningTime: number; success: boolean } {
    // Create coinbase transaction first
    const coinbaseTx = new Transaction('COINBASE', minerAddress, this.coinbaseReward);
    
    // Create block with pending transactions PLUS coinbase
    const blockData = [...this.pendingTransactions, coinbaseTx];
    const block = new Block(
      this.chain.length, 
      Date.now(), 
      blockData, 
      this.getLatestBlock().hash
    );
    
    // Mine the block (nonce will be found to satisfy difficulty)
    const { miningTime } = block.mineBlock(this.difficulty, minerAddress, this.coinbaseReward);
    
    // Process all transactions in the block
    for (const tx of block.data) {
      this.wallet.processTransaction(tx);
    }
    
    this.chain.push(block);
    
    // Clear pending transactions
    this.pendingTransactions = [];
    
    return { miningTime, success: true };
  }
  
  //Adds a new block to the blockchain (async version for UI)   
  async addBlockAsync(data: Transaction[], stopRef?: { current: boolean }): Promise<number> {
    const block = new Block(
      this.chain.length, 
      Date.now(), 
      data, 
      this.getLatestBlock().hash
    );
    
    const miningTime = await block.mineBlockAsync(this.difficulty, stopRef);
    this.chain.push(block);
    
    return miningTime;
  }
  
  //Validates the integrity of the entire blockchain
  isValid(): { isValid: boolean; invalidBlocks: string[] } {
    const invalidBlocks: string[] = [];
    
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // Check if current block's hash matches its calculated hash
      const calculatedHash = current.calculateHash();
      if (current.hash !== calculatedHash) {
        invalidBlocks.push(`Block #${i}: Hash mismatch (calculated: ${calculatedHash.substring(0, 20)}..., stored: ${current.hash.substring(0, 20)}...)`);
      }

      // Check if current block's previousHash matches previous block's hash
      if (current.previousHash !== previous.hash) {
        invalidBlocks.push(`Block #${i}: Previous hash mismatch (previous block hash: ${previous.hash.substring(0, 20)}..., stored previousHash: ${current.previousHash.substring(0, 20)}...)`);
      }
    }
    
    return {
      isValid: invalidBlocks.length === 0,
      invalidBlocks
    };
  }
  
  //Recalculates all balances from the blockchain.
  //Processes all transactions in order from genesis to latest.
  recalculateBalances(): void {
    // Collect all transactions from all blocks
    const allTransactions: Transaction[] = [];
    
    for (const block of this.chain) {
      allTransactions.push(...block.data);
    }
    
    // Recalculate wallet balances
    this.wallet.recalculateBalances(allTransactions);
  }
  
  //Resolves forks between two blockchains
  resolveFork(otherChain: Blockchain): boolean {
    const otherValidation = otherChain.isValid();
    const thisValidation = this.isValid();
    
    console.log(`\n--- Fork Resolution ---`);
    console.log(`This chain: ${this.chain.length} blocks, valid: ${thisValidation.isValid}`);
    console.log(`Other chain: ${otherChain.chain.length} blocks, valid: ${otherValidation.isValid}`);
    
    // If other chain is longer and valid, adopt it
    if (otherChain.chain.length > this.chain.length && otherValidation.isValid) {
      this.chain = Blockchain.deepCopy(otherChain.chain);
      this.recalculateBalances();
      console.log(`Adopted longer valid chain (${otherChain.chain.length} blocks)`);
      return true;
    }
    
    // If this chain is longer and valid, keep it
    if (this.chain.length >= otherChain.chain.length && thisValidation.isValid) {
      console.log(`Kept current chain (${this.chain.length} blocks)`);
      return false;
    }
    
    // If neither is valid, this is an error
    console.log(`Warning: Neither chain is valid!`);
    return false;
  }

  //Creates a deep copy of the blockchain
  public static deepCopy(chain: Block[]): Block[] {
    return chain.map((block) => new Block(
      block.index,
      block.timestamp,
      block.data,
      block.previousHash,
      block.nonce
    ));
  }

  //Gets all transactions from the blockchain
  public getAllTransactions(): Transaction[] {
    const transactions: Transaction[] = [];
    for (const block of this.chain) {
      transactions.push(...block.data);
    }
    return transactions;
  }

  //Prints the blockchain to console.
  public printChain(): void {
    console.log('\n=== Blockchain ===');
    for (const block of this.chain) {
      console.log(`\nBlock #${block.index}:`);
      console.log(`  Hash: ${block.hash.substring(0, 20)}...`);
      console.log(`  Previous Hash: ${block.previousHash.substring(0, 20)}...`);
      console.log(`  Nonce: ${block.nonce}`);
      console.log(`  Transactions: ${block.data.length}`);
      for (const tx of block.data) {
        console.log(`    - ${tx.toString()}`);
      }
    }
  }
}
