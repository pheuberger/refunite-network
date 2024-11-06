"use client";
import { useState, useEffect } from "react";

import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { abi as HatsAbi } from "@/lib/hatsAbi";

export default function AccountPage() {
  const { address, isConnected } = useAccount();
  const [hatId, setHatId] = useState<string | null>(null);

  const hatsContractAddress = "0x3bc1A0Ad72417f2d411118085256fC53CBdDd137"; // Hats protocol contract address
  const hatsId = BigInt("0x0000027f00020001000000000000000000000000000000000000000000000000"); // https://app.hatsprotocol.xyz/trees/11155111/639?hatId=639.2.1

  const {
    data: hatData,
    isError,
    isLoading,
  } = useReadContract({
    address: hatsContractAddress,
    abi: HatsAbi,
    functionName: "viewHat",
    args: [hatsId],
  });

  useEffect(() => {
    if (hatData) {
      setHatId(hatData.toString());
    }
  }, [hatData]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Account</h1>
          <p className="text-base mb-6">Please connect your wallet to view your account details.</p>
          <Button>Connect Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Account</h1>
          {/* <Button variant="outline" size="sm">Edit Profile</Button> */}
        </header>

        <section className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://robohash.org/${address}`} alt="User avatar" />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">Community Leader</h2>
            <p className="text-sm font-mono font-semibold text-indigo-600">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Unknown"}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-md text-indigo-600 font-semibold tracking-tight mb-3">Hat Status</h2>
          <div className="font-mono">
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : isError ? (
              <p className="text-red-500">Error loading Hat data</p>
            ) : hatId ? (
              <p className="break-all">{hatId}</p>
            ) : (
              <p className="text-gray-500">No Hat assigned</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-md text-indigo-600 font-semibold tracking-tight mb-3">Actions</h2>
          <div className="flex gap-4">
            <Button variant="default" onClick={() => alert("View Hat details")}>
              View Hat Details
            </Button>
            <Link href="/recover-role" passHref>
              <Button variant="secondary">Recover Role</Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
