import { useState, useEffect, useRef, type ChangeEvent, type MouseEvent } from 'react';
import { Block, Blockchain } from './core';
import './App.css';

const App: React.FC = () => {
  const [data, setData] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(2);
  const [mining, setMining] = useState<boolean>(false);
  const [miningTime, setMiningTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [editData, setEditData] = useState<string>('');
  const stopMiningRef = useRef<boolean>(false);
  const [blockchain, setBlockchain] = useState<Blockchain>(new Blockchain(2));

  /**
   * Ensures the displayed blockchain stays in sync with state.
   * Runs when difficulty changes.
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setBlockchain((prev) => {
        const fresh = new Blockchain(prev.difficulty);
        fresh.chain = Blockchain.deepCopy(prev.chain);
        return fresh;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [difficulty]);

  /**
   * Update elapsed time display during mining.
   */
  useEffect(() => {
    let interval: number;
    if (mining) {
      const startTime = Date.now();
      interval = window.setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 10);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mining]);

  /**
   * Mine a new block with the provided data.
   */
  const handleMineBlock = async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    if (!data.trim()) return;
    
    setMining(true);
    setElapsedTime(0);
    setMiningTime(0);
    stopMiningRef.current = false;
    
    const newChain = new Blockchain(difficulty);
    newChain.chain = Blockchain.deepCopy(blockchain.chain);
    
    try {
      const time = await newChain.addBlock(data, stopMiningRef);
      if (!stopMiningRef.current) {
        setBlockchain(newChain);
        setData('');
        setMiningTime(time);
      }
    } catch (e) {
      alert("Mining stopped");
    }
    
    setMining(false);
  };

  /**
   * Sets the stop ref which is checked in the mining loop.
   */
  const handleStopMining = (): void => {
    stopMiningRef.current = true;
  };

  /**
   * Handler: Tamper with a specific block.
   * Creates a new block with 'TAMPERED!' data at the specified index.
   */
  const handleTamperBlock = (index: number): void => {
    const newChain = new Blockchain(blockchain.difficulty);
    newChain.chain = Blockchain.deepCopy(blockchain.chain);
    
    // Create a tampered block with modified data but same metadata
    const tamperedBlock = new Block(
      newChain.chain[index].index,
      newChain.chain[index].timestamp,
      'TAMPERED!',
      newChain.chain[index].previousHash,
      newChain.chain[index].nonce
    );
    // Recalculate hash with new data which will break the chain
    tamperedBlock.hash = tamperedBlock.calculateHash();
    newChain.chain[index] = tamperedBlock;
    
    setBlockchain(newChain);
  };

  /**
   * Saves the edited data and recalculates the hash.
   */
  const handleUpdateEdit = (index: number): void => {
    const newChain = new Blockchain(blockchain.difficulty);
    newChain.chain = Blockchain.deepCopy(blockchain.chain);
    newChain.chain[index].data = editData;
    newChain.chain[index].hash = newChain.chain[index].calculateHash();
    setBlockchain(newChain);
    setEditingIndex(-1);
    setEditData('');
  };

  /**
   * Update data input field.
   */
  const handleDataChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setData(e.target.value);
  };

  /**
   * Update difficulty setting.
   */
  const handleDifficultyChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setDifficulty(Number(e.target.value));
  };

  /**
   * Enables edit mode and initializes edit data.
   */
  const handleStartEdit = (index: number): void => {
    setEditingIndex(index);
    setEditData(blockchain.chain[index].data);
  };

  /**
   * Handler: Update the temporary edit data.
   */
  const handleEditChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEditData(e.target.value);
  };

  /** Checks whether the entire blockchain is still valid */
  const isValid = blockchain.isValid();

  return (
    <div className="app">
      <h1>Blockchain Visualizer</h1>

      <div className="controls">
        <input
          type="text"
          value={data}
          onChange={handleDataChange}
          placeholder="Block data (e.g., Alice pays Bob 10 BTC)"
          disabled={mining}
        />
        <input 
          type="number"
          value={difficulty} 
          onChange={handleDifficultyChange} 
          disabled={mining}
          min="1"
          max="6"
          title="Mining difficulty (1-6)"
        />
        <button onClick={handleMineBlock} disabled={mining || !data.trim()}>
          {mining ? `⛏ Mining... ${elapsedTime}ms` : '⛏ Mine Block'}
        </button>
        {mining && (
          <button onClick={handleStopMining} className="stop-button">
            ⏹ Stop Mining
          </button>
        )}
        {miningTime > 0 && <p>✓ Successfully mined in {miningTime.toFixed(0)}ms</p>}
      </div>

      <div className="status">
        <h2 className={isValid ? '' : 'invalid'}>
          {isValid ? '✅ Chain Valid' : '❌ Chain Invalid'}
        </h2>
      </div>

      <div className="chain">
        {blockchain.chain.map((block: Block, index: number) => {
          // Check if this block's previousHash matches the previous block's hash
          const prevHashMatch = index === 0 || blockchain.chain[index - 1].hash === block.previousHash;
          // Check if this specific block's hash is valid
          const blockHashValid = block.hash === block.calculateHash();
          
          return (
            <div 
              key={index} 
              className={`block ${!blockHashValid || !prevHashMatch ? 'invalid' : ''}`}
            >
              <div className="block-header">
                <h3>Block #{block.index}</h3>
                <div className={`link ${prevHashMatch ? 'valid-link' : 'invalid-link'}`}>
                  ↳ {block.previousHash.substring(0, 16)}...
                </div>
              </div>
              <div className="block-body">
                <p><strong>Data:</strong> <span>{block.data}</span></p>
                <p><strong>Hash:</strong> <span>{block.hash.substring(0, 32)}...</span></p>
                <p><strong>Nonce:</strong> <span>{block.nonce.toLocaleString()}</span></p>
                <p><strong>Timestamp:</strong> <span>{new Date(block.timestamp).toLocaleString()}</span></p>
              </div>
              {index > 0 && (
                <div className="block-actions">
                  <button onClick={() => handleTamperBlock(index)} title="Tamper with this block">
                    💥 Tamper
                  </button>
                  {editingIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editData}
                        onChange={(e) => handleEditChange(e)}
                        onBlur={() => handleUpdateEdit(index)}
                        placeholder="Edit block data..."
                        className="edit-input"
                        autoFocus
                      />
                      <button onClick={() => handleUpdateEdit(index)} title="Save changes">
                        ✓ Save
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleStartEdit(index)} title="Edit this block">
                      ✏️ Edit
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
