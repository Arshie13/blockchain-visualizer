import { useState, useEffect, useRef, type ChangeEvent, type MouseEvent } from 'react';
import { Block, Blockchain } from './core/Block';
import './App.css';

const App: React.FC = () => {
  const [blockchain, setBlockchain] = useState<Blockchain>(new Blockchain(2));
  const [data, setData] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(2);
  const [mining, setMining] = useState<boolean>(false);
  const [miningTime, setMiningTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [editData, setEditData] = useState<string>('');
  const stopMiningRef = useRef<boolean>(false);

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

  const handleStopMining = (): void => {
    stopMiningRef.current = true;
  };

  const handleTamperBlock = (index: number): void => {
    const newChain = new Blockchain(blockchain.difficulty);
    newChain.chain = Blockchain.deepCopy(blockchain.chain);
    
    // Tamper the specific block
    const tamperedBlock = new Block(
      newChain.chain[index].index,
      newChain.chain[index].timestamp,
      'TAMPERED!',
      newChain.chain[index].previousHash,
      newChain.chain[index].nonce
    );
    tamperedBlock.hash = tamperedBlock.calculateHash();
    newChain.chain[index] = tamperedBlock;
    
    setBlockchain(newChain);
  };

  const handleUpdateEdit = (index: number): void => {
    const newChain = new Blockchain(blockchain.difficulty);
    newChain.chain = Blockchain.deepCopy(blockchain.chain);
    newChain.chain[index].data = editData;
    newChain.chain[index].hash = newChain.chain[index].calculateHash();
    setBlockchain(newChain);
    setEditingIndex(-1);
    setEditData('');
  };

  const handleDataChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setData(e.target.value);
  };

  const handleDifficultyChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setDifficulty(Number(e.target.value));
  };

  const handleEditChange = (index: number, e: ChangeEvent<HTMLInputElement>): void => {
    setEditingIndex(index);
    setEditData(e.target.value);
  };

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
          const prevHashMatch = index === 0 || blockchain.chain[index - 1].hash === block.previousHash;
          return (
            <div key={index} className={`block ${!isValid ? 'invalid' : ''}`}>
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
                  <button onClick={() => handleTamperBlock(index)}>💥 Tamper Data</button>
                  <input
                    type="text"
                    value={editingIndex === index ? editData : block.data}
                    onChange={(e) => handleEditChange(index, e)}
                    onBlur={() => handleUpdateEdit(index)}
                    placeholder="Edit block data..."
                    className="edit-input"
                  />
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