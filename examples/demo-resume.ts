
import { Transaction } from '../engine/Transaction';
import { FileStorage } from '../engine/FileStorage';
import { RedisStorage } from '../engine/RedisStorage';


const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


async function main() {
  // 1. Choose Storage Backend
  const redisUrl = process.env.REDIS_URL;
  const storage = redisUrl 
    ? new RedisStorage(redisUrl) 
    : new FileStorage();

  console.log(`\n🔌 Using Storage Engine: ${storage.constructor.name}`);
  if (redisUrl) console.log(`   URL: ${redisUrl}`);

  // 2. Start Transaction
  const tx = new Transaction("tx-resume-demo", storage, { cleanupOnSuccess: false });

  await tx.run(async (t) => {
    // Step 1: Heavy Computation
    await t.step('step-1-heavy-job', {
      do: async () => {
        console.log("   [Work] Processing heavy data...");
        await delay(500);
        return "DATA_PROCESSED";
      },
      undo: () => console.log("   [Undo] Cleaning up step 1")
    });

    // Step 2: The Crash Point
    await t.step('step-2-risky', {
      do: async () => {
        // SIMULATE CRASH on first run only
        if (process.argv.includes('--crash')) {
            console.log("   💀 SIMULATING PROCESS CRASH...");
            process.exit(1); 
        }
        console.log("   [Work] Finalizing step 2...");
        return "STEP_2_DONE";
      },
      undo: () => console.log("   [Undo] Cleaning up step 2")
    });

    console.log("🎉 WORKFLOW COMPLETED SUCCESSFULLY!");
  });

  // Clean up Redis connection if needed
  if (storage instanceof RedisStorage) {
    await storage.disconnect();
  }
}

main().catch(console.error);
