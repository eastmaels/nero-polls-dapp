import { useState, useContext, useEffect } from 'react';
import { useSignature, useSendUserOp, useConfig, useEthersSigner } from '@/hooks';
import { ERC20_ABI_DPOLLS,  } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts'
import { ClientContext } from '@/contexts'
import { ethers } from 'ethers';
import Dashboard from "./dashboard"
import CreatePoll from "./create-poll"

// Define NeroNFT ABI with the mint function
const NERO_POLL_ABI = [
  // Basic ERC721 functions from the standard ABI
  ...ERC20_ABI_DPOLLS,
  // Add the mint function that exists in the NeroNFT contract
  'function mint(address to, string memory uri) returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string memory)',
];

// Contract addresses for the testnet - you would need to update these with actual addresses
const TOKEN_FACTORY_ADDRESS = '0x00ef47f5316A311870fe3F3431aA510C5c2c5a90';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { AAaddress, isConnected, simpleAccountInstance } = useSignature();
  const [isVoting, setIsVoting] = useState(false);

  const client = useContext(ClientContext);
  const signer = useEthersSigner()
  const { execute, waitForUserOpResult, sendUserOp } = useSendUserOp();
  const config = useConfig(); // Get config to access RPC URL
  const [isLoading, setIsLoading] = useState(false);
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const [polls, setPolls] = useState<any[]>([]);
  
  useEffect(() => {
    if (isConnected) {
      fetchPolls();
    }
  }, [isConnected]); // Only re-run if isConnected changes

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Reset form values
    setTxStatus('');
    setUserOpHash(null);
    
    // If switching to NFT gallery, fetch the NFTs
    if ((tab === 'dashboard' || tab === 'nft-gallery') && isConnected) {
      fetchPolls();
    }
  };

  const handleCreatePoll = async (pollForm: any) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'createPoll',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: NERO_POLL_ABI, // Use the specific ABI with mint function
        params: [
          pollForm.subject,
          pollForm.description,
          pollForm.options,
          ethers.utils.parseEther(pollForm.rewardPerResponse).toString(),
          parseInt(pollForm.duration),
          parseInt(pollForm.maxResponses),
          ethers.utils.parseEther(pollForm.minContribution).toString(),
          ethers.utils.parseEther(pollForm.targetFund).toString(),
        ],
        value: 0,
      });

      const result = await waitForUserOpResult();
      setUserOpHash(result.userOpHash);
      setIsPolling(true);

      if (result.result === true) {
        setIsPolling(false);
        fetchPolls();
      } else if (result.transactionHash) {
        setTxStatus('Transaction hash: ' + result.transactionHash);
      }
    } catch (error) {
      console.error('Error:', error);
      setTxStatus('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPolls = async () => {
    if (!isConnected || !AAaddress) return;

    try {
      setIsLoading(true);
      
      // Create a provider using the RPC URL from config
      const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
      
      // Create a contract instance for the NFT contract
      const pollsContract = new ethers.Contract(
        CONTRACT_ADDRESSES.dpollsContract,
        ERC20_ABI_DPOLLS,
        provider
      );
      
      // Get all poll IDs
      const allPollIds = await pollsContract.getAllPollIds();
      if (allPollIds.length > 0) {
        const fetchedPolls = await Promise.all(
          allPollIds.map(async (pollId: number) => {
            try {
              // Get poll details using the polls function
              const pollDetails = await pollsContract.getPoll(pollId);
              const pollResponses = await pollsContract.getPollResponses(pollId);
              const modPollResponses = pollResponses.map((response: any) => {
                return response.response
              });
              
              // Format the poll data
              return {
                id: pollId,
                creator: pollDetails.creator,
                subject: pollDetails.subject,
                description: pollDetails.description,
                options: pollDetails.options,
                rewardPerResponse: pollDetails.rewardPerResponse,
                maxResponses: pollDetails.maxResponses.toString(),
                endTime: new Date(Number(pollDetails.endTime) * 1000),
                isOpen: pollDetails.isOpen,
                totalResponses: pollDetails.totalResponses.toString(),
                funds: pollDetails.funds,
                minContribution: pollDetails.minContribution,
                targetFund: pollDetails.targetFund,
                responses: modPollResponses,
              };
            } catch (error) {
              console.error(`Error fetching Poll #${pollId}:`, error);
              return null;
            }
          })
        );

        // Filter out any null values from failed fetches
        const validPolls = fetchedPolls.filter(poll => poll !== null);
        
        if (validPolls.length > 0) {
          setPolls(validPolls);
          setTxStatus(`Found ${validPolls.length} Polls`);
        } else {
          setTxStatus('No valid polls found');
          // Show sample polls as fallback
          setPolls([
            {
              question: 'Sample Poll 1',
              options: ['Option 1', 'Option 2', 'Option 3'],
              rewardPerResponse: ethers.utils.parseEther('0.1'),
              duration: 10,
              maxResponses: 10,
              minContribution: ethers.utils.parseEther('1').toString(),
              targetFund: ethers.utils.parseEther('10').toString(),
            },
            {
              question: 'Sample Poll 2',
              options: ['Option 1', 'Option 2', 'Option 3'],
              rewardPerResponse: ethers.utils.parseEther('0.1'),
              duration: 10,
              maxResponses: 10,
              minContribution: ethers.utils.parseEther('1').toString(),
              targetFund: ethers.utils.parseEther('10').toString(),
            }
          ]);
        }
      } else {
        setTxStatus('No polls found');
        setPolls([]);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
      setTxStatus('Error fetching polls');
      
      // Fallback to sample polls in case of error
      setPolls([
        {
          question: 'Sample Poll 1',
          options: ['Option 1', 'Option 2', 'Option 3'],
          rewardPerResponse: ethers.utils.parseEther('0.1'),
          duration: 10,
          maxResponses: 10,
          minContribution: ethers.utils.parseEther('1').toString(),
          targetFund: ethers.utils.parseEther('10').toString(),
        },
        {
          question: 'Sample Poll 2',
          options: ['Option 1', 'Option 2', 'Option 3'],
          rewardPerResponse: ethers.utils.parseEther('0.1'),
          duration: 10,
          maxResponses: 10,
          minContribution: ethers.utils.parseEther('1').toString(),
          targetFund: ethers.utils.parseEther('10').toString(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">NERO Decentralized Polls</h1>
      <p className="mb-4 text-m text-gray-600">
        Where your opinion matters
      </p>
      
      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => handleTabChange('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'create-poll' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => handleTabChange('create-poll')}
        >
          Create Poll
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <Dashboard
          AAaddress={AAaddress}
          handleTabChange={handleTabChange}
          polls={polls}
          fetchPolls={fetchPolls}
        />
      )}
      {activeTab === 'create-poll' && (
        <CreatePoll handleCreatePoll={handleCreatePoll} handleTabChange={handleTabChange}/>
      )}
      {(activeTab !== 'create-poll' && activeTab !== 'dashboard') && (
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          {/* NFT Gallery */}
          {activeTab === 'nft-gallery' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your NFT Gallery</h2>
              <button
                onClick={fetchPolls}
                disabled={isLoading}
                className="mb-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isLoading ? 'Loading...' : 'Refresh Gallery'}
              </button>
              
              <div className="grid grid-cols-1 gap-4 mt-4">
                {isLoading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">Loading polls...</p>
                  </div>
                ) : polls.length > 0 ? (
                  polls.map((poll, index) => (
                    <div key={index} className="border rounded-md p-4 bg-gray-50">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full space-y-2">
                          <h3 className="font-bold text-lg">{poll.question}</h3>
                          <p className="text-sm text-gray-600">Creator: {poll.creator}</p>
                          <p className="text-sm text-gray-600">Reward per response: {ethers.utils.formatEther(poll.rewardPerResponse)} ETH</p>
                          <p className="text-sm text-gray-600">Max responses: {poll.maxResponses}</p>
                          <p className="text-sm text-gray-600">Status: {poll.isOpen ? 'Open' : 'Closed'}</p>
                          <p className="text-sm text-gray-600">Total responses: {poll.totalResponses}</p>
                          <p className="text-sm text-gray-600">Current funds: {ethers.utils.formatEther(poll.funds)} ETH</p>
                          <p className="text-sm text-gray-600">Target fund: {ethers.utils.formatEther(poll.targetFund)} ETH</p>
                          <p className="text-sm text-gray-600">End time: {poll.endTime.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 border rounded-md">
                    <p className="text-gray-500 mb-4">No polls found. Create some polls first!</p>
                    <button
                      onClick={() => handleTabChange('create-poll')}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create Your First Poll
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transaction Status */}
          {txStatus && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <p className="text-sm font-medium">
                Status: <span className={txStatus.includes('Success') ? 'text-green-600' : 'text-blue-600'}>{txStatus}</span>
              </p>
              {userOpHash && (
                <p className="text-xs mt-1 break-all">
                  <span className="font-medium">UserOpHash:</span> {userOpHash}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage; 