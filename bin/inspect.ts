#!/usr/bin/env node
import { RedisStorage } from '../engine/RedisStorage';
import { FileStorage } from '../engine/FileStorage';

async function main() {
  const [,, txId] = process.argv;

  if (!txId) {
    console.error("Usage: npx ts-node bin/inspect.ts <transaction-id>");
    process.exit(1);
  }

  // Auto-detect storage based on Env Var
  const storage = process.env.REDIS_URL 
    ? new RedisStorage(process.env.REDIS_URL) 
    : new FileStorage();

  console.log(`\n🔍 Inspecting Transaction: ${txId}`);
  console.log(`   Source: ${storage.constructor.name}\n`);

  const history = await storage.load(txId);

  if (!history) {
    console.error("❌ Transaction not found.");
    process.exit(1);
  }

  console.log("   STEP NAME            | STATUS ");
  console.log("   ------------------------------------");

  history.forEach((step, index) => {
    const isLast = index === history.length - 1;
    // Simple ASCII Tree
    const prefix = isLast ? "└──" : "├──";
    
    // Status Icon
    const icon = step.status === 'completed' ? '✅' : '⏳';
    
    console.log(`   ${prefix} ${step.name.padEnd(20)} | ${icon} ${step.status}`);
    
    // If there is a result and it's small, show it
    if (step.result && typeof step.result === 'string' && step.result.length < 50) {
       console.log(`       └-> Result: ${step.result}`);
    }
  });

  console.log("\n");

  if (storage instanceof RedisStorage) {
    await storage.disconnect();
  }
}

main().catch(console.error);
