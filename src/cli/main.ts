import { Blockchain } from '../core/Blockchain';
import { Block } from '../core/Block';
import { Transaction } from '../core/Transaction';
import * as readline from 'readline';

// read user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Demo 1: Block & Chain Fundamentals + Mining with Adjustable Difficulty
function demoBasicMining(difficulty?: number) {
  
  // Test different difficulty levels
  const difficulties = difficulty !== undefined ? [difficulty] : [1, 2, 3];
  
  for (const difficulty of difficulties) {
    
    const blockchain = new Blockchain(difficulty);
    
    // Give some initial balances (through mining)
    blockchain.wallet.setBalance('Miner1', 0);
    
    // Add some transactions
    const tx1 = new Transaction('Alice', 'Bob', 10);
    const tx2 = new Transaction('Bob', 'Charlie', 5);
    
    // For demo purposes, use coinbase transactions directly in block
    blockchain.addTransaction(tx1);
    blockchain.addTransaction(tx2);
    
    // Mine a block
    const { miningTime } = blockchain.addBlock('Miner1');
    console.log(`Block mined in ${miningTime.toFixed(2)}ms`);
    console.log(`Block mined: ${blockchain.chain[blockchain.chain.length - 1].hash}`)
    
    // Verify chain
    const validation = blockchain.isValid();
    console.log(`Chain valid: ${validation.isValid}`);
    if (!validation.isValid && validation.invalidBlocks.length > 0) {
      for (const err of validation.invalidBlocks) {
        console.log(`  ${err}`);
      }
    }
  }
}

//Demo 2: Mining Rewards & Balance Tracking
function demoMiningRewards() {
  
  const blockchain = new Blockchain(2, 50); // 50 coins reward
  
  // Give Alice some initial coins (through coinbase from genesis)
  blockchain.wallet.setBalance('Alice', 100);
  
  console.log('\n--- Initial State ---');
  console.log('Alice has 100 coins');
  
  // Create transaction
  const tx1 = new Transaction('Alice', 'Bob', 30);
  console.log(`\nAdding transaction: Alice -> Bob: 30 coins`);
  blockchain.addTransaction(tx1);
  
  // Check balance before mining
  console.log(`Alice balance before mining: ${blockchain.wallet.getBalance('Alice')}`);
  console.log(`Bob balance before mining: ${blockchain.wallet.getBalance('Bob')}`);
  
  // Mine block (Miner1 gets reward)
  console.log('\n--- Mining Block ---');
  const { miningTime } = blockchain.addBlock('Miner1');
  console.log(`Block mined in ${miningTime.toFixed(2)}ms`);
  
  // Show balances after mining
  console.log('\n--- Balances After Mining ---');
  blockchain.wallet.printBalanceSummary();
  
  // Try invalid transaction (insufficient funds)
  console.log('\n--- Testing Insufficient Funds ---');
  const tx2 = new Transaction('Bob', 'Charlie', 100); // Bob only has 30
  const added = blockchain.addTransaction(tx2);
  console.log(`Transaction added: ${added}`);
}


//Demo 3: Tamper Detection
function demoTamperDetection() {
  
  const blockchain = new Blockchain(2);
  
  // Give Miner1 and Miner2 some initial balance through mining rewards
  blockchain.wallet.setBalance('Miner0', 0);
  blockchain.wallet.setBalance('Miner1', 0);
  
  // Add some transactions with COINBASE (mining rewards)
  blockchain.addTransaction(new Transaction('COINBASE', 'Alice', 100));
  blockchain.addBlock('Miner0');
  
  blockchain.addTransaction(new Transaction('Alice', 'Bob', 10));
  blockchain.addTransaction(new Transaction('Bob', 'Charlie', 5));
  blockchain.addTransaction(new Transaction('Charlie', 'Dave', 2));
  blockchain.addBlock('Miner1');
  
  // Mine additional blocks
  console.log('\n--- Mining 2 More Blocks ---');
  blockchain.addTransaction(new Transaction('User0', 'User1', 1));
  blockchain.addBlock('Miner0');
  blockchain.addTransaction(new Transaction('User1', 'User2', 1));
  blockchain.addBlock('Miner1');
  
  console.log('\nChain before tampering:');
  const validationBefore = blockchain.isValid();
  console.log(`Valid: ${validationBefore.isValid}`);
  
  // Tamper with block #2
  console.log('\n--- Tampering with Block #2 ---');
  const tamperedBlock = blockchain.chain[2];
  console.log(`Original data: ${tamperedBlock.data.length} transactions`);
  
  // Modify the data (tamper)
  tamperedBlock.data = [new Transaction('FAKE', 'Hacker', 999)];
  // Note: We don't recalculate hash, so it will fail validation
  
  console.log('Modified block data to contain fake transaction');
  
  // Validate chain
  console.log('\n--- Validating Chain After Tampering ---');
  const validationAfter = blockchain.isValid();
  console.log(`Chain Valid: ${validationAfter.isValid}`);
  
  if (!validationAfter.isValid) {
    console.log('\nInvalid blocks detected:');
    for (const error of validationAfter.invalidBlocks) {
      console.log(`  - ${error}`);
    }
  }
}


//Demo 4A: Multi-Miner Race
function demoMultiMinerRace() {
  
  const difficulty = 2;
  const minerA_startNonce = 0;
  const minerB_startNonce = 1;
  
  console.log(`\nDifficulty: ${difficulty} leading zeros`);
  console.log('Miner A: searching even nonces (0, 2, 4, ...)');
  console.log('Miner B: searching odd nonces (1, 3, 5, ...)');
  
  // Create a block to mine
  const previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const block = new Block(1, Date.now(), [new Transaction('Alice', 'Bob', 10)], previousHash);
  
  const target = '0'.repeat(difficulty);
  
  // Race condition simulation
  let nonceA = minerA_startNonce;
  let nonceB = minerB_startNonce;
  const startTime = performance.now();
  
  let winner: 'A' | 'B' | null = null;
  let winningNonce = 0;
  let winningHash = '';
  
  // Simulate miners racing
  while (true) {
    // Miner A checks
    const hashA = Block.prototype.calculateHash.call({
      index: block.index,
      timestamp: block.timestamp,
      data: block.data,
      previousHash: block.previousHash,
      nonce: nonceA,
    } as Block);
    
    if (hashA.substring(0, difficulty) === target) {
      winner = 'A';
      winningNonce = nonceA;
      winningHash = hashA;
      break;
    }
    
    // Miner B checks
    const hashB = Block.prototype.calculateHash.call({
      index: block.index,
      timestamp: block.timestamp,
      data: block.data,
      previousHash: block.previousHash,
      nonce: nonceB,
    } as Block);
    
    if (hashB.substring(0, difficulty) === target) {
      winner = 'B';
      winningNonce = nonceB;
      winningHash = hashB;
      break;
    }
    
    nonceA += 2;
    nonceB += 2;
    
    // Safety limit
    if (nonceA > 1000000) {
      console.log('Taking too long, limiting search...');
      break;
    }
  }
  
  const miningTime = performance.now() - startTime;
  
  console.log(`\n--- Race Results ---`);
  console.log(`Winner: Miner ${winner}`);
  console.log(`Winning nonce: ${winningNonce}`);
  console.log(`Winning hash: ${winningHash.substring(0, 20)}...`);
  console.log(`Mining time: ${miningTime.toFixed(2)}ms`);
  
  // Show that only winner gets reward
  console.log(`\n--- Reward Distribution ---`);
  if (winner === 'A') {
    console.log('Miner A gets the 50 coin reward!');
    console.log('Miner B gets nothing (race lost)');
  } else {
    console.log('Miner B gets the 50 coin reward!');
    console.log('Miner A gets nothing (race lost)');
  }
}

//Demo 4B: Fork Resolution
function demoForkResolution() {
  
  // Create two separate nodes (blockchains)
  const nodeA = new Blockchain(2, 50);
  const nodeB = new Blockchain(2, 50);
  
  console.log('\n--- Initial State ---');
  console.log('Node A and Node B start with same genesis block');
  
  // Both nodes have the same first block
  nodeA.addTransaction(new Transaction('Alice', 'Bob', 10));
  const block1A = nodeA.addBlock('MinerA');
  console.log(`Node A: Block 1 mined by MinerA in ${block1A.miningTime.toFixed(2)}ms`);
  
  // Copy to Node B (both start with same chain)
  nodeB.chain = Blockchain.deepCopy(nodeA.chain);
  nodeB.wallet = nodeA.wallet.copy();
  
  // Now create a fork - Node A and Node B mine different blocks
  console.log('\n--- Fork Created ---');
  console.log('Node A mines Block 2 (from Alice -> Bob)');
  console.log('Node B mines Block 2 (from Charlie -> Dave)');
  
  // Node A extends with one transaction
  nodeA.addTransaction(new Transaction('Alice', 'Bob', 10));
  nodeA.addBlock('MinerA');
  console.log(`Node A: Block 2 mined`);
  
  // Node B extends with different transaction
  nodeB.addTransaction(new Transaction('Charlie', 'Dave', 20));
  nodeB.addBlock('MinerB');
  console.log(`Node B: Block 2 mined`);
  
  // Show chains before resolution
  console.log('\n--- Before Fork Resolution ---');
  console.log(`Node A chain length: ${nodeA.chain.length}`);
  console.log(`Node B chain length: ${nodeB.chain.length}`);
  
  const validationA = nodeA.isValid();
  const validationB = nodeB.isValid();
  console.log(`Node A valid: ${validationA.isValid}`);
  console.log(`Node B valid: ${validationB.isValid}`);
  
  // Node A extends its chain more (becomes longer)
  console.log('\n--- Node A Extends Chain ---');
  nodeA.addTransaction(new Transaction('Bob', 'Charlie', 5));
  nodeA.addBlock('MinerA');
  console.log(`Node A chain length: ${nodeA.chain.length}`);
  
  // Fork resolution - Node B adopts Node A's chain (longer wins)
  console.log('\n--- Fork Resolution ---');
  console.log('Node B compares chains:');
  console.log(`  Node A: ${nodeA.chain.length} blocks`);
  console.log(`  Node B: ${nodeB.chain.length} blocks`);
  
  // Node B resolves fork by adopting Node A's chain
  nodeB.resolveFork(nodeA);
  
  console.log('\n--- After Fork Resolution ---');
  console.log(`Node B now has ${nodeB.chain.length} blocks (adopted Node A's chain)`);
  console.log('Node B balances recalculated based on winning chain:');
  nodeB.wallet.printBalanceSummary();
}

//Interactive menu using readline
function showMenu(): Promise<void> {
  return new Promise((resolve) => {
    console.log('\n' + '='.repeat(60));
    console.log('         Blockchain Demo Menu');
    console.log('='.repeat(60));
    console.log('  1. Basic Mining (select difficulty)');
    console.log('  2. Mining Rewards & Balance Tracking');
    console.log('  3. Tamper Detection');
    console.log('  4. Multi-Miner Race');
    console.log('  5. Fork Resolution');
    console.log('  6. Run All Demos');
    console.log('  0. Exit');
    console.log('='.repeat(60));
    
    rl.question('Select a demo (0-6): ', (answer) => {
      const choice = answer.trim();
      console.log('');
      
      switch (choice) {
        case '1':
          // Ask for difficulty first
          rl.question('Enter difficulty (1-5) or press Enter for all [1-3]: ', (diffAnswer) => {
            const diff = diffAnswer.trim();
            if (diff && /^[1-5]$/.test(diff)) {
              demoBasicMining(parseInt(diff, 10));
            } else {
              demoBasicMining();
            }
            promptContinue(resolve);
          });
          return;
        case '2':
          demoMiningRewards();
          break;
        case '3':
          demoTamperDetection();
          break;
        case '4':
          demoMultiMinerRace();
          break;
        case '5':
          demoForkResolution();
          break;
        case '6':
          demoBasicMining();
          demoMiningRewards();
          demoTamperDetection();
          demoMultiMinerRace();
          demoForkResolution();
          break;
        case '0':
          console.log('Goodbye!');
          rl.close();
          process.exit(0);
        default:
          console.log('Invalid choice. Running all demos...\n');
          demoBasicMining();
          demoMiningRewards();
          demoTamperDetection();
          demoMultiMinerRace();
          demoForkResolution();
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('  Demo Complete!');
      console.log('='.repeat(60));
      
      promptContinue(resolve);
    });
  });
}

function promptContinue(resolve: () => void) {
  // Ask if user wants to run another demo
  rl.question('\nRun another demo? (y/n): ', (answer) => {
    if (answer.trim().toLowerCase() === 'y') {
      showMenu().then(resolve);
    } else {
      console.log('Goodbye!');
      rl.close();
      process.exit(0);
    }
  });
}

//Main entry point
async function main() {
  // Check for command line argument (non-interactive mode)
  if (typeof process !== 'undefined' && process.argv) {
    const args = process.argv.slice(2);
    
    // If a demo number is provided as argument, run it non-interactively
    if (args.length > 0 && /^[0-6]$/.test(args[0])) {
      const choice = args[0];
      
      switch (choice) {
        case '1':
          demoBasicMining();
          break;
        case '2':
          demoMiningRewards();
          break;
        case '3':
          demoTamperDetection();
          break;
        case '4':
          demoMultiMinerRace();
          break;
        case '5':
          demoForkResolution();
          break;
        case '6':
          demoBasicMining();
          demoMiningRewards();
          demoTamperDetection();
          demoMultiMinerRace();
          demoForkResolution();
          break;
        case '0':
          console.log('Goodbye!');
          process.exit(0);
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('  Demo Complete!');
      console.log('='.repeat(60));
      return;
    }
  }
  // No argument provided - run interactive mode
  await showMenu();
}

// Run the main function
main();
