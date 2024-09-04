'use client'

import {createWeb3Modal, defaultConfig} from '@web3modal/ethers/react'

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