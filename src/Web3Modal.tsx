'use client'

import { createWeb3Modal, defaultConfig, useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react'
// biome-ignore lint/style/useImportType: <explanation>
import { BrowserProvider, Contract, JsonRpcSigner, TransactionReceipt, ethers } from "ethers";
import type { ChatMessage } from './interface';
import { ABI } from './abi';

export interface ChatGPInstance {
  setConversation: (messages: ChatMessage[]) => void
  getConversation: () => ChatMessage[]
  focus: () => void
}

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = "8b5350f41ad0d59565171eae20c77c19"

let mainnet = {
  chainId: 696969,
  name: 'Galadriel',
  currency: 'GAL',
  explorerUrl: 'https://explorer.galadriel.com',
  rpcUrl: 'https://devnet.galadriel.com/'
}
if (process.env.NEXT_PUBLIC_NETWORK === "local") {
  mainnet = {
    chainId: 1337,
    name: 'Galadriel',
    currency: 'GAL',
    explorerUrl: 'https://explorer.galadriel.com',
    rpcUrl: 'http://127.0.0.1:8545'
  }
}


// 3. Create modal
const metadata = {
  name: "VitAIlik",
  description: "On-chain RPG game",
  // TODO:
  url: 'https://galadriel.com', // origin must match your domain & subdomain
  icons: []
}

createWeb3Modal({
    ethersConfig: defaultConfig({metadata}),
    chains: [mainnet],
    projectId,
    enableAnalytics: true // Optional - defaults to your Cloud configuration
  })
  
  export function Web3ModalProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }


  function useWeb3ModalState() {
    const { isConnected } = useWeb3ModalAccount()
    const { walletProvider } = useWeb3ModalProvider()
    const { open } = useWeb3Modal()
    return { isConnected, walletProvider, open }
  }

  export async function callStartChat(chatMessage: string, web3ModalState: ReturnType<typeof useWeb3ModalState>) {
    const { isConnected, walletProvider, open } = web3ModalState
  
    if (!isConnected) {
      await open()
      return
    }
  
    if (!walletProvider) {
      console.error("Wallet provider not found")
      return
    }
  
    const provider = new BrowserProvider(walletProvider)
    const signer: JsonRpcSigner = await provider.getSigner()
  
    // Define the contract address
    const contractAddress = "0xD3Cc97B3D3C87B19f35b8EE28494c52462664ACC";
  
    // Create a contract instance
    const contract = new Contract(contractAddress, ABI, signer);
  
    try {
      // Call the startChat function with the message
      const tx = await contract.startChat(chatMessage);
      console.log("Transaction sent! Waiting for confirmation...");
  
      // Wait for the transaction to be mined
      const receipt = await tx.wait(); // This is of type ethers.providers.TransactionReceipt
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
  
      console.log("receipt:", receipt);
  
      const chatId = await getChatId(receipt, contract);
  
      if (chatId === undefined) {
          throw new Error("Chat ID could not be determined from the transaction receipt.");
      }
  
      console.log("Chat ID retrieved:", chatId);
  
  
      while (true) {
          const newMessages: ChatMessage[] = await getNewMessages(contract, chatId);
      
      
          if (newMessages) {
              const lastMessage = newMessages.at(-1); // Get the last message in the array
      
              if (lastMessage) {
                  const role = lastMessage.role; // Accessing the role directly
                  const content = lastMessage.content; // Accessing the content directly
      
                  console.log("Extracted role:", role);
      
                  if (role === "assistant") {
                      // If the last message is from the assistant, break the loop and return the message
                      console.log("Assistant message received:", content);
                      return lastMessage; // Return the lastMessage object
                  }
              }
          } else {
              console.log("No messages received. Retrying in 2 seconds...");
          }
      
          // Wait for 2 seconds before polling again to avoid excessive network requests
          await new Promise(resolve => setTimeout(resolve, 2000));
      }
  
    } catch (error) {
      console.error("An error occurred while starting the chat:", error);
    }
  }

  async function getChatId(receipt: TransactionReceipt, contract: Contract): Promise<number | undefined> {
    let chatId: number | undefined;
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log)
        if (parsedLog && parsedLog.name === "ChatCreated") {
          // Second event argument
          chatId = ethers.toNumber(parsedLog.args[1])
        }
      } catch (error) {
        // This log might not have been from your contract, or it might be an anonymous log
        console.log("Could not parse log:", log)
      }
    }
    return chatId;
}

async function getNewMessages(
    contract: Contract,
    chatId: number
  ): Promise<ChatMessage[]> {
    console.log("Fetching message history for Chat ID:", chatId);
    const messages = await contract.getMessageHistory(chatId);
    const newMessages: ChatMessage[] = [];

    for (const message of messages) {
        if (message?.role && message?.content) {
            newMessages.push({
                role: message.role,
                content: message.content[0]?.[1] // Use optional chaining here as well
            });
        } else {
            console.log("Message has unexpected structure or missing fields:", message);
        }
    }

    return newMessages;
}