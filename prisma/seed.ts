import 'dotenv/config';
import type { IssuePriority, IssueStatus } from '@prisma/client';
import { createPrismaClient } from '../src/db/prisma';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script');
}

const prisma = createPrismaClient(databaseUrl);

interface SeedProject {
  name: string;
  description: string;
  issues: Array<{
    title: string;
    priority: IssuePriority;
    status: IssueStatus;
  }>;
}

const seedProjects: SeedProject[] = [
  {
    name: 'Marketing Website Refresh',
    description: 'Update the landing page layout and improve call-to-action sections.',
    issues: [
      { title: 'Rewrite hero copy for the spring campaign', priority: 'high', status: 'todo' },
      { title: 'Ship responsive navigation polish', priority: 'medium', status: 'in_progress' },
      { title: 'Audit homepage image compression', priority: 'low', status: 'done' },
    ],
  },
  {
    name: 'Inventory Dashboard',
    description: 'Build the first internal dashboard for tracking stock changes.',
    issues: [
      { title: 'Add low-stock summary widgets', priority: 'high', status: 'todo' },
      { title: 'Connect warehouse activity feed', priority: 'medium', status: 'in_progress' },
      { title: 'Create initial table filters', priority: 'low', status: 'done' },
    ],
  },
  {
    name: 'Customer Support Portal',
    description: 'Prepare the basic portal where support staff can view incoming requests.',
    issues: [
      { title: 'Create shared inbox detail view', priority: 'high', status: 'todo' },
      { title: 'Add ticket status badges', priority: 'medium', status: 'in_progress' },
      { title: 'Seed starter support categories', priority: 'low', status: 'done' },
    ],
  },
];

async function main(): Promise<void> {
  await prisma.project.deleteMany();

  for (const project of seedProjects) {
    const { issues, ...projectData } = project;

    await prisma.project.create({
      data: {
        ...projectData,
        issues: {
          create: issues,
        },
      },
    });
  }

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
