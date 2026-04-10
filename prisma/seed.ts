import 'dotenv/config';
import { createPrismaClient } from '../src/db/prisma';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script');
}

const prisma = createPrismaClient(databaseUrl);

async function main(): Promise<void> {
  await prisma.project.deleteMany();

  await prisma.project.createMany({
    data: [
      {
        name: 'Marketing Website Refresh',
        description: 'Update the landing page layout and improve call-to-action sections.',
      },
      {
        name: 'Inventory Dashboard',
        description: 'Build the first internal dashboard for tracking stock changes.',
      },
      {
        name: 'Customer Support Portal',
        description: 'Prepare the basic portal where support staff can view incoming requests.',
      },
    ],
  });

  console.info('Seed completed successfully');
}

void main()
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
