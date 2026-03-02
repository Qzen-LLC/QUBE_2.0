import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// User data from the SQL file
const userData = [
  { id: '0883083a-3b35-41e9-a5f0-c54dfcce928a', clerkId: 'user_2zlgNoWjXBka9mmz0IaLATzAy0H', email: 'admin@qzen.com', firstName: 'QZen', lastName: 'Admin', role: 'QZEN_ADMIN', organizationId: null, isActive: true },
  { id: '22d420ca-1b07-4966-9c6e-9a7e18616b3b', clerkId: 'user_2zqtMa5L9pof9koc9Xl6lsvKnq7', email: 'chinnadeva46@gmail.com', firstName: 'Arshad', lastName: 'Johan', role: 'USER', organizationId: null, isActive: true },
  { id: '2ec86498-6183-4f34-8490-6426b5ffdf23', clerkId: 'test-user-2', email: 'user2@test.com', firstName: 'User', lastName: 'Two', role: 'ORG_ADMIN', organizationId: 'test-org-2', isActive: true },
  { id: '67fb11fd-67cc-4b49-a2ab-0c3f48f0f53e', clerkId: 'user_2zulksw3dvAyBQifFWL4d3CTKn1', email: 'kramesh06@gmail.com', firstName: 'Ramesh', lastName: 'Kaluri', role: 'QZEN_ADMIN', organizationId: null, isActive: true },
  { id: '6de206b5-906a-4596-9c6a-d8122ead5ae9', clerkId: 'user_2zrnXsuZzzF42EJykC7eehLUHTT', email: '22pt34@psgtech.ac.in', firstName: '22PT34 -', lastName: 'SRISHARAN  V S', role: 'QZEN_ADMIN', organizationId: '22ecfcfe-9f3d-420d-b191-1cdaa7bef68e', isActive: true },
  { id: '7c23d049-0ffe-4fb4-9e9f-644122e64b87', clerkId: 'test-user-3', email: 'user3@test.com', firstName: 'User', lastName: 'Three', role: 'USER', organizationId: null, isActive: true },
  { id: '95bcc487-6822-470d-97ee-ecb1cc2f4cd7', clerkId: 'user_2zutCzX3SIEXnyhstSnUQyNDSzF', email: 'shibu.nair@joice.one', firstName: 'Shibu', lastName: 'Nair', role: 'ORG_ADMIN', organizationId: 'org-1', isActive: true },
  { id: 'a19d122a-aaf7-4bb5-8d18-f7b169c53c5b', clerkId: 'test-user-1', email: 'user1@test.com', firstName: 'User', lastName: 'One', role: 'ORG_ADMIN', organizationId: 'test-org-1', isActive: true },
  { id: 'e278f711-1666-4b54-96ae-6104965ee672', clerkId: 'user_2zuojqXMG0V4ry5clcjewzE4QnC', email: 'shibu.gp@gmail.com', firstName: 'Shibu', lastName: 'N', role: 'QZEN_ADMIN', organizationId: null, isActive: true },
  { id: 'eae1af7e-8af2-436b-8466-606c256a93d7', clerkId: 'user_300rIxwKIOZ4Ub7viJ7t6x3Dxmo', email: 'turftime3@gmail.com', firstName: 'Turf', lastName: 'Time', role: 'USER', organizationId: null, isActive: true },
  { id: 'f651ebcf-1881-4b55-85b8-7898e7dd15d2', clerkId: 'user_2zrkjvTlhwQJ7K1t0GRXQufxxL1', email: '22pt04@psgtech.ac.in', firstName: '22PT04 -', lastName: 'ARSHAD JOHAN  P', role: 'ORG_USER', organizationId: '22ecfcfe-9f3d-420d-b191-1cdaa7bef68e', isActive: true },
  { id: 'user-1', clerkId: 'clerk-1', email: 'qzen-admin@qzen.com', firstName: 'Alice', lastName: 'Admin', role: 'QZEN_ADMIN', organizationId: null, isActive: true },
  { id: 'user-10', clerkId: 'clerk-10', email: 'user@globalind.com', firstName: 'Jack', lastName: 'GlobalUser', role: 'ORG_USER', organizationId: 'org-4', isActive: true },
  { id: 'user-2', clerkId: 'clerk-2', email: 'org-admin@acme.com', firstName: 'Bob', lastName: 'OrgAdmin', role: 'ORG_ADMIN', organizationId: 'org-1', isActive: true },
  { id: 'user-3', clerkId: 'clerk-3', email: 'org-user@acme.com', firstName: 'Carol', lastName: 'OrgUser', role: 'ORG_USER', organizationId: 'org-1', isActive: true },
  { id: 'user-4', clerkId: 'clerk-4', email: 'personal-user@example.com', firstName: 'Dave', lastName: 'User', role: 'USER', organizationId: null, isActive: true },
  { id: 'user-5', clerkId: 'clerk-5', email: 'admin@globex.com', firstName: 'Emma', lastName: 'GlobexAdmin', role: 'ORG_ADMIN', organizationId: 'org-2', isActive: true },
  { id: 'user-6', clerkId: 'clerk-6', email: 'user@globex.com', firstName: 'Frank', lastName: 'GlobexUser', role: 'ORG_USER', organizationId: 'org-2', isActive: true },
  { id: 'user-7', clerkId: 'clerk-7', email: 'admin@techstart.com', firstName: 'Grace', lastName: 'TechAdmin', role: 'ORG_ADMIN', organizationId: 'org-3', isActive: true },
  { id: 'user-8', clerkId: 'clerk-8', email: 'user@techstart.com', firstName: 'Henry', lastName: 'TechUser', role: 'ORG_USER', organizationId: 'org-3', isActive: true },
  { id: 'user-9', clerkId: 'clerk-9', email: 'admin@globalind.com', firstName: 'Ivy', lastName: 'GlobalAdmin', role: 'ORG_ADMIN', organizationId: 'org-4', isActive: true },
];

async function restoreUsers() {
  try {
    console.log('🚀 Starting user data restoration...');
    
    // First, clear existing users (except the one we just created)
    console.log('🧹 Clearing existing users...');
    await prisma.user.deleteMany({});
    
    console.log(`📥 Restoring ${userData.length} users...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of userData) {
      try {
        await prisma.user.create({
          data: {
            id: user.id,
            clerkId: user.clerkId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role as any,
            organizationId: user.organizationId,
            // Note: isActive field doesn't exist in current schema, skipping
          },
        });
        
        console.log(`✅ Restored user: ${user.email} (${user.role})`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to restore user ${user.email}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📊 Restoration Summary:');
    console.log(`✅ Successfully restored: ${successCount} users`);
    console.log(`❌ Failed: ${errorCount} users`);
    
    // Verify your admin account
    const yourAccount = await prisma.user.findUnique({
      where: { email: 'kramesh06@gmail.com' }
    });
    
    if (yourAccount) {
      console.log('\n👤 Your Account Restored:');
      console.log({
        email: yourAccount.email,
        name: `${yourAccount.firstName} ${yourAccount.lastName}`,
        role: yourAccount.role,
        clerkId: yourAccount.clerkId,
      });
    }
    
    console.log('\n🎉 User restoration completed!');
    
  } catch (error) {
    console.error('❌ Restoration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreUsers();