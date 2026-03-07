import { Transaction } from './Transaction';


//Wallet class for managing user balances.
export class Wallet {
  public balances: Map<string, number>;

  //Creates a new wallet manager.   
  constructor() {
    this.balances = new Map<string, number>();
  }

  
  //Gets the balance of a specific wallet address.
  getBalance(address: string): number {
    return this.balances.get(address) || 0;
  }

  //Sets the balance for a specific wallet address
  setBalance(address: string, amount: number): void {
    this.balances.set(address, amount);
  }
  
  //Adds to the balance of a specific wallet address.   
  addBalance(address: string, amount: number): void {
    const current = this.getBalance(address);
    this.balances.set(address, current + amount);
  }

  //Subtracts from the balance of a specific wallet address.
  subtractBalance(address: string, amount: number): boolean {
    const current = this.getBalance(address);
    if (current < amount) {
      return false;
    }
    this.balances.set(address, current - amount);
    return true;
  }

  //Validates if a sender has sufficient balance for a transaction   
  hasSufficientBalance(sender: string, amount: number): boolean {
    return this.getBalance(sender) >= amount;
  }

  
  //Processes a transaction and updates balances   
  processTransaction(transaction: Transaction): boolean {
    // Validate transaction
    if (!transaction.isValid()) {
      return false;
    }

    // Handle coinbase transactions (mining rewards)
    if (transaction.isCoinbase()) {
      this.addBalance(transaction.receiver, transaction.amount);
      return true;
    }

    // Handle regular transactions
    if (!this.hasSufficientBalance(transaction.sender, transaction.amount)) {
      return false;
    }

    this.subtractBalance(transaction.sender, transaction.amount);
    this.addBalance(transaction.receiver, transaction.amount);
    return true;
  }

  //Recalculates all balances from the blockchain
  recalculateBalances(transactions: Transaction[]): void {
    // Reset all balances
    this.balances.clear();

    // Process each transaction in order
    for (const tx of transactions) {
      this.processTransaction(tx);
    }
  }
  
  //Creates a deep copy of this wallet   
  public copy(): Wallet {
    const newWallet = new Wallet();
    for (const [address, balance] of this.balances) {
      newWallet.balances.set(address, balance);
    }
    return newWallet;
  }
  
  //Returns a formatted string of all balances
  getBalanceSummary(): string {
    const lines: string[] = [];
    for (const [address, balance] of this.balances) {
      lines.push(`  ${address}: ${balance} coins`);
    }
    return lines.length > 0 ? lines.join('\n') : '  (no balances)';
  }
  
  //Prints the balance summary to console.
  printBalanceSummary(): void {
    console.log('\n=== Balance Summary ===');
    console.log(this.getBalanceSummary());
  }
}
