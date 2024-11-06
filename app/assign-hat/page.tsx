"use client";
import { useState } from "react";

import { getAddress } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import { ATLANTIS_HAT_ID, HATS_CONTRACT_ADDRESS } from "@/lib/constants";
import { useSafeOwner } from "@/hooks/useSafeOwner";
import { ATLANTIS_SAFE_ADDRESS } from "@/lib/constants";
import { createSafeClient } from '@safe-global/sdk-starter-kit'
import { encodeFunctionData } from 'viem'
import { abi } from '@/lib/hatsAbi'
import { Eip1193Provider } from "@safe-global/protocol-kit/dist/src/types/safeProvider";
// import { SilkEthereumProviderInterface } from "@silk-wallet/silk-wallet-sdk/dist/lib/provider/types";

export default function AssignHatPage() {
  const publicClient = usePublicClient();
  const { data: walletClient, isLoading: isWalletClientLoading } = useWalletClient();
  const { address: account, isConnected } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isMultisigOwner, isLoading: isSafeLoading } = useSafeOwner();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!account) {
        throw new Error("Account not connected");
      }

      if (!isMultisigOwner) {
        throw new Error("Not authorized to create hats");
      }

      if (!walletClient) {
        throw new Error("Wallet client not connected");
      }

      console.log('account', walletClient)

      const safeClient = await createSafeClient({
        provider: walletClient as Eip1193Provider,
        safeOptions: {
          owners: [getAddress(account)],
          threshold: 1
        }
      })

      console.log('safeClient is alright i guess')

      const createHatData = encodeFunctionData({
        abi,
        functionName: 'createHat',
        args: [
          BigInt(ATLANTIS_HAT_ID), // admin
          name, // details
          1, // maxSupply
          ATLANTIS_SAFE_ADDRESS, // eligibility
          ATLANTIS_SAFE_ADDRESS, // toggle
          true, // mutable
          '', // imageURI - using empty string as default
        ]
      })

      console.log('createHatData', createHatData)

      // For mintHat, we need the hatId that will be created
      // We can calculate it using the next hat ID for the admin hat
      const nextHatData = encodeFunctionData({
        abi,
        functionName: 'getNextId',
        args: [BigInt(ATLANTIS_HAT_ID)]
      })

      const nextHatId = await publicClient!.call({
        to: HATS_CONTRACT_ADDRESS,
        data: nextHatData
      })

      console.log('nextHatId', nextHatId)
      console.log('nextHatData', nextHatData)

      const mintHatData = encodeFunctionData({
        abi,
        functionName: 'mintHat',
        args: [
          BigInt(nextHatId.data as any), // hatId
          getAddress(recipient), // wearer
        ]
      })

      console.log('mintHatData', mintHatData)

      const txs = [
        {
          to: HATS_CONTRACT_ADDRESS,
          value: '0',
          data: createHatData
        },
        {
          to: HATS_CONTRACT_ADDRESS,
          value: '0',
          data: mintHatData
        }
      ]

      const txResult = await safeClient.send({ transactions: txs })

      console.log('txResult', txResult)

      const safeTxHash = txResult.transactions?.safeTxHash
      console.log('safeTxHash', safeTxHash)

      toast({
        variant: "default",
        title: "Success",
        description: `Successfully proposed hat creation and minting for ${name} (${recipient})`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
      console.error('the error', error)
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Assign Hat</h1>
          <p className="text-base mb-6">Please connect your wallet to assign a hat.</p>
          <Button>Connect Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-semibold">Assign Hat to Community Leader</h1>
        </header>

        {account && (
          <section>
            <h2 className="text-md text-indigo-600 font-semibold tracking-tight mb-3">
              Authorization Status
            </h2>
            <p className="text-sm">
              {isSafeLoading ? (
                "Checking permissions..."
              ) : isMultisigOwner ? (
                <span className="text-green-600 font-medium">
                  You can create and assign new hats as a Safe owner
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  You don't have permission to create new hats
                </span>
              )}
            </p>
          </section>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="address">Wallet Address</Label>
            <Input
              id="address"
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Leader Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Assigning..." : "Assign Hat"}
          </Button>
        </form>
      </div>
    </div>
  );
}
