<script lang="ts">
    import {
        connectAztecWallet,
        disconnectAztecWallet,
        isWalletConnected,
        aztecWalletStore,
        truncateAddress,
        createRandomAztecPrivateKey,
        deploySchnorrAccount,
        connectAztecWalletWithPersistence,
    } from "../../stores/walletStore";

    import { showUSDCBalance } from "../../stores/depositStore";

    import { type Wallet } from "@aztec/aztec.js";
    import { ethers } from "ethers";

    let aztecWallet: Wallet | undefined;
    $: $aztecWalletStore, (aztecWallet = $aztecWalletStore);

    let currentBalance = 0n;

    let tempPrivateKey = "";

    async function handleBalanceDisplay() {
        currentBalance = await showUSDCBalance();
    }

    async function handleDeployWallet() {
        if(!tempPrivateKey){
            return
        }
        await connectAztecWalletWithPersistence(tempPrivateKey as `0x${string}`);
        tempPrivateKey = "";
    }
</script>

<div class="h-full flex flex-col gap-2">
    <div
        class="flex gap-2"
        class:text-success={isWalletConnected($aztecWalletStore)}
        class:text-error={!isWalletConnected($aztecWalletStore)}
    >
        <p>Aztec Wallets</p>
        {#if isWalletConnected(aztecWallet)}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-circle-check-icon lucide-circle-check"
                ><circle cx="12" cy="12" r="10" /><path
                    d="m9 12 2 2 4-4"
                /></svg
            >
        {:else}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-circle-x-icon lucide-circle-x"
                ><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path
                    d="m9 9 6 6"
                /></svg
            >
        {/if}
    </div>
    <div class="divider m-0"></div>
    <div class="h-full flex flex-col justify-between">
        {#if isWalletConnected(aztecWallet)}
            <div class="text-center">
                <p>Aztec Address</p>
                <p>{truncateAddress(aztecWallet?.getAddress().toString()!)}</p>
            </div>
            <div>
                <button
                    class="btn btn-ghost btn-outline border-[rgba(255,255,255,.25)] w-full flex items-center gap-2 px-2 py-6"
                    on:click={handleBalanceDisplay}
                >
                    USDC balance: {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(Number(ethers.formatUnits(currentBalance, 6)))}
                </button>
            </div>
            <button
                class="btn btn-error w-full flex items-center gap-2 justify-start px-2 py-6"
                on:click={disconnectAztecWallet}
            >
                <div class="bg-white p-1 rounded-md">
                    <img
                        src="./logos/wallets/aztec.svg"
                        alt="aztec wallet logo"
                        class="size-[28px]"
                    />
                </div>
                Disconnect Wallet
            </button>
        {:else}
            <button
                class="btn btn-ghost btn-outline border-[rgba(255,255,255,.25)] w-full flex items-center gap-2 justify-start px-2 py-6"
                on:click={connectAztecWallet}
            >
                <div class="bg-white p-1 rounded-md">
                    <img
                        src="./logos/wallets/aztec.svg"
                        alt="aztec wallet logo"
                        class="size-[28px]"
                    />
                </div>
                Aztec Test Wallet
            </button>

            <div class="w-full flex items-center gap-2 justify-start px-2 py-6">
                <input class="input" type="text" bind:value={tempPrivateKey} />
                <button class="btn btn-primary" on:click={handleDeployWallet}>createWallet</button>
            </div>
            <button
                class="btn btn-primary"
                on:click={() => {
                    tempPrivateKey = createRandomAztecPrivateKey();
                }}
            >
                Random Key Gen
            </button>
        {/if}
    </div>
</div>
