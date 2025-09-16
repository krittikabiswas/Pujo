// src/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState, useEffect } from 'react' // <- Add useEffect
import * as algosdk from 'algosdk'

// --- DAO Imports ---
import ConnectWallet from './components/ConnectWallet'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'

// --- Direct Algod Client ---
const ALGOD_SERVER = "https://testnet-api.algonode.cloud"
const ALGOD_TOKEN = ""
const ALGOD_PORT = ""
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)

// --- ADD THIS: Token Constants ---
const APP_ID = 1002
const ANJ_TOKEN_ID = 1003 // ← Replace with your actual ANJ Token Asset ID

const Home: React.FC = () => {
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [donationAmount, setDonationAmount] = useState(0)
  const [info, setInfo] = useState("")
  const { activeAddress, transactionSigner } = useWallet()

  // --- ADD THIS: State for token balance ---
  const [anjBalance, setAnjBalance] = useState(0)

  const toggleWalletModal = () => setOpenWalletModal(!openWalletModal)

  // --- ADD THIS: Function to fetch token balance ---
  const fetchTokenBalance = async (address: string) => {
    try {
      const accountInfo = await algodClient.accountInformation(address).do()
      const assets = accountInfo.assets || []
      const anjAsset = assets.find((asset: any) => asset['asset-id'] === ANJ_TOKEN_ID)
      setAnjBalance(anjAsset ? anjAsset.amount : 0)
    } catch (error) {
      console.error("Error fetching token balance:", error)
      setAnjBalance(0)
    }
  }

  // --- ADD THIS: Fetch balance when wallet connects ---
  useEffect(() => {
    if (activeAddress) {
      fetchTokenBalance(activeAddress)
    } else {
      setAnjBalance(0)
    }
  }, [activeAddress])

  // --- Main Donation Logic ---
  const handleDonate = async () => {
    if (!activeAddress) {
      alert("Please connect your wallet first.")
      return
    }

    setInfo("Preparing donation...")

    const algokitClient = AlgorandClient.fromClients({ algod: algodClient })
    const suggestedParams = await algodClient.getTransactionParams().do()
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: activeAddress,
      receiver: algosdk.getApplicationAddress(APP_ID),
      amount: Math.round(donationAmount * 1_000_000),
      suggestedParams,
    })

    setInfo("Please sign the donation transaction...")
    const signedPayment = await transactionSigner([paymentTxn], [0])
    const rawPayment = Array.isArray(signedPayment) ? signedPayment[0] : signedPayment
    const sendResult = await algodClient.sendRawTransaction(rawPayment).do()

    setInfo(`Donation successful! Transaction ID: ${sendResult.txid}`)
    
    // --- ADD THIS: Refresh token balance after donation ---
    setTimeout(() => {
      if (activeAddress) {
        fetchTokenBalance(activeAddress)
      }
    }, 3000) // Wait 3 seconds for token distribution
  }

  // --- UI ---
  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content text-center rounded-lg p-8 bg-white shadow-lg">
        <div>
          <h1 className="text-5xl font-bold text-gray-800">Welcome to the Anjoli DAO</h1>
          <p className="py-6 text-xl">
            Donate ALGO to participate in the festival and receive ANJ governance tokens.
          </p>

          {/* --- ADD THIS: Display Token Balance --- */}
          {activeAddress && anjBalance > 0 && (
            <div className="mb-4 p-3 bg-teal-100 rounded-lg">
              <p className="text-lg font-semibold text-teal-800">
                Your ANJ Tokens: {anjBalance}
              </p>
              <p className="text-sm text-teal-600">Use these to vote on proposals!</p>
            </div>
          )}

          {!activeAddress && (
            <button className="btn btn-primary m-2" onClick={toggleWalletModal}>
              Connect Wallet
            </button>
          )}

          {activeAddress && (
            <>
              <div className="mt-4">
                <input
                  type="number"
                  placeholder="Amount in ALGO"
                  className="input input-bordered w-full max-w-xs"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(Number(e.target.value))}
                />
              </div>
              <div className="mt-4">
                <button className="btn btn-primary" onClick={handleDonate}>
                  Donate
                </button>
              </div>
            </>
          )}

          {info && <p className="mt-4 text-gray-600">{info}</p>}
        </div>

        <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      </div>
    </div>
  )
}

export default Home
