import CryptoJS from 'crypto-js';

//Helper function to create SHA256 hash
function sha256(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

//Transaction type - represents a transfer of coins from one wallet to another 
export interface TransactionData {
  sender: string;
  receiver: string;
  amount: number;
  timestamp: number;
  signature?: string;
}

//Transaction class representing a transfer of coins between wallets. 
export class Transaction implements TransactionData {
  public sender: string;
  public receiver: string;
  public amount: number;
  public timestamp: number;
  public signature?: string;

  //Creates a new transaction
  constructor(sender: string, receiver: string, amount: number) {
    this.sender = sender;
    this.receiver = receiver;
    this.amount = amount;
    this.timestamp = Date.now();
  }

  //Calculates the hash of this transaction.   
  calculateHash(): string {
    return sha256(
      this.sender + 
      this.receiver + 
      this.amount + 
      this.timestamp
    );
  }

  //Checks if this is a coinbase transaction (mining reward)   
  isCoinbase(): boolean {
    return this.sender === 'COINBASE';
  }

  //Validates the transaction 
  isValid(): boolean {
    // Coinbase transactions are always valid
    if (this.isCoinbase()) {
      return this.amount > 0;
    }

    // Regular transactions must have valid sender, receiver, and positive amount
    if (!this.sender || !this.receiver) {
      return false;
    }

    if (this.amount <= 0) {
      return false;
    }

    return true;
  }

  
  //Returns a string representation of the transaction.   
  toString(): string {
    if (this.isCoinbase()) {
      return `COINBASE -> ${this.receiver}: ${this.amount} coins`;
    }
    return `${this.sender} -> ${this.receiver}: ${this.amount} coins`;
  }
}
