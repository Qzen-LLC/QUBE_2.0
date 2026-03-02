import { prismaClient } from "../src/utils/db";

async function createMockTestUser() {
  console.log("🔧 Creating mock test user for auth bypass...\n");
  
  try {
    // The mock user ID used by the auth bypass
    const mockClerkId = "mock-test-user-123";
    const mockEmail = "test@example.com";
    
    // Check if user already exists
    const existingUser = await prismaClient.user.findUnique({
      where: { clerkId: mockClerkId },
    });

    if (existingUser) {
      console.log("✅ Mock test user already exists:");
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Clerk ID: ${existingUser.clerkId}`);
    } else {
      // Create the mock user with USER role (regular user)
      const newUser = await prismaClient.user.create({
        data: {
          clerkId: mockClerkId,
          email: mockEmail,
          firstName: "Test",
          lastName: "User",
          role: "USER", // Regular USER role
          isActive: true,
        },
      });

      console.log("✅ Created mock test user:");
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   Clerk ID: ${newUser.clerkId}`);
    }

    console.log("\n✨ Mock user is ready!");
    console.log("   The auth bypass will now work with this user");
    console.log("   You can access all features at http://localhost:3001");
    
  } catch (error) {
    console.error("❌ Error creating mock user:", error);
  } finally {
    await prismaClient.$disconnect();
  }
}

createMockTestUser().catch(console.error);