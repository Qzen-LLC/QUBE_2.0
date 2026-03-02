import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  // Handle connection errors
  allowExitOnIdle: true,
});

const adapter = new PrismaPg(pool);

export const prismaClient = 
  global.prisma ||
  new PrismaClient({
    adapter,
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prismaClient;

// Add proper cleanup for development
if (process.env.NODE_ENV === 'development') {
  process.on('beforeExit', async () => {
    await prismaClient.$disconnect();
    await pool.end();
  });
  
  process.on('SIGINT', async () => {
    await prismaClient.$disconnect();
    await pool.end();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await prismaClient.$disconnect();
    await pool.end();
    process.exit(0);
  });
}

// Default export for backwards compatibility
export default prismaClient;

// Utility function to retry database operations for connection and prepared statement errors
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>, 
  maxRetries = 3
): Promise<T> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      retries++;
      const errorMessage = error.message || String(error);
      console.error(`Database operation attempt ${retries}/${maxRetries} failed:`, errorMessage);
      
      // Check if this is a retryable error
      const isRetryable = 
        errorMessage.includes('prepared statement') ||
        errorMessage.includes('Connection terminated') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('Connection closed') ||
        errorMessage.includes('Connection ended');
      
      if (isRetryable && retries < maxRetries) {
        // Wait before retrying with exponential backoff
        const delay = 200 * Math.pow(2, retries - 1);
        console.log(`Retrying database operation after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's not a retryable error or we've exhausted retries, throw
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded for database operation');
}