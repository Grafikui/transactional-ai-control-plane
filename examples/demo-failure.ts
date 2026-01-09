import { Transaction } from '../engine/Transaction';

// Mock Services
const MockFileSystem = {
  create: async (filename: string) => {
    console.log(`   [FS] Creating file: ${filename}`);
    return "file_id_123";
  },
  delete: async (id: string) => {
    console.log(`   [FS] 🗑️ Deleting file ID: ${id}`);
  }
};

const MockEmailService = {
  send: async (fileId: string) => {
    console.log(`   [Email] Sending file ${fileId}...`);
    throw new Error("SMTP Server Timeout! (Simulated Failure)");
  }
};

async function main() {
  const agent = new Transaction();

  console.log("--- STARTING TRANSACTION ---");

  try {
    await agent.run(async (tx) => {
      // Step 1: Create File (This succeeds)
      const fileId = await tx.step('create-report', {
        do: () => MockFileSystem.create('report.pdf'),
        undo: (id) => MockFileSystem.delete(id)
      });

      // Step 2: Send Email (This FAILS)
      await tx.step('send-email', {
        do: () => MockEmailService.send(fileId),
        undo: () => console.log("   [Email] Recalling email...")
      });
    });
    
    console.log("--- TRANSACTION SUCCESS ---");
  
  } catch (e) {
    console.log("\n--- TRANSACTION FAILED (As Expected) ---");
    console.log("System state should be clean (File deleted).");
  }
}

main();
