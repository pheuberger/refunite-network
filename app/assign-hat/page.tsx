"use client";
import { useEffect, useState } from "react";

import { getAddress } from "viem";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import { useHatsClient } from "@/hooks/useHatsClient";

export default function AssignHatPage() {
  const { address: account, isConnected } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { hatsClient, isLoading: isHatsClientLoading, error: hatsClientError } = useHatsClient();
  const { toast } = useToast();
  const [isWearer, setIsWearer] = useState(false);

  useEffect(() => {
    const getWearerStatus = async () => {
      if (isHatsClientLoading || !hatsClient || !account) {
        console.log({ isHatsClientLoading, hatsClient, account });
        return;
      }
      const isWearer = await hatsClient.isWearerOfHat({
        wearer: getAddress(account),
        hatId: BigInt("0x0000027000020001000000000000000000000000000000000000000000000000"),
      });
      console.log(isWearer);
      setIsWearer(isWearer);
    };
    getWearerStatus();
  }, [hatsClient, account, isHatsClientLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!hatsClient || !account) {
        throw new Error("HatsClient not initialized");
      }
      const result = await hatsClient.mintHat({
        account: getAddress(account),
        hatId: BigInt("0x0000027000020001000100000000000000000000000000000000000000000000"),
        wearer: getAddress(recipient),
      });
      toast({
        variant: result.status === "success" ? "default" : "destructive",
        title: result.status ? "Success" : "Error",
        description: result.status
          ? `Successfully assigned a Hat to ${name} (${recipient})`
          : "Failed to assign Hat. Please try again.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while assigning the Hat. Please try again.",
      });
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
              Hat Status
            </h2>
            <p className="text-sm">
              {isHatsClientLoading ? (
                "Checking..."
              ) : isWearer ? (
                <span className="text-green-600 font-medium">User has the required hat</span>
              ) : (
                <span className="text-red-600 font-medium">
                  User does not have the required hat
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
