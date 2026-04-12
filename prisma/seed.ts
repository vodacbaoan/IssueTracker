import 'dotenv/config';
import type { IssuePriority, IssueStatus } from '@prisma/client';
import { createPrismaClient } from '../src/db/prisma';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script');
}

const prisma = createPrismaClient(databaseUrl);

const seedUsers = [
  { name: 'Mia Chen', email: 'mia.chen@example.com' },
  { name: 'Noah Patel', email: 'noah.patel@example.com' },
  { name: 'Sofia Nguyen', email: 'sofia.nguyen@example.com' },
  { name: 'Leo Tran', email: 'leo.tran@example.com' },
] as const;

interface SeedProject {
  name: string;
  description: string;
  issues: Array<{
    title: string;
    priority: IssuePriority;
    status: IssueStatus;
    assigneeEmail?: (typeof seedUsers)[number]['email'];
  }>;
}

const seedProjects: SeedProject[] = [
  {
    name: 'Marketing Website Refresh',
    description: 'Update the landing page layout and improve call-to-action sections.',
    issues: [
      {
        title: 'Rewrite hero copy for the spring campaign',
        priority: 'high',
        status: 'todo',
        assigneeEmail: 'mia.chen@example.com',
      },
      {
        title: 'Ship responsive navigation polish',
        priority: 'medium',
        status: 'in_progress',
        assigneeEmail: 'noah.patel@example.com',
      },
      { title: 'Audit homepage image compression', priority: 'low', status: 'done' },
    ],
  },
  {
    name: 'Inventory Dashboard',
    description: 'Build the first internal dashboard for tracking stock changes.',
    issues: [
      {
        title: 'Add low-stock summary widgets',
        priority: 'high',
        status: 'todo',
        assigneeEmail: 'leo.tran@example.com',
      },
      {
        title: 'Connect warehouse activity feed',
        priority: 'medium',
        status: 'in_progress',
        assigneeEmail: 'sofia.nguyen@example.com',
      },
      { title: 'Create initial table filters', priority: 'low', status: 'done' },
    ],
  },
  {
    name: 'Customer Support Portal',
    description: 'Prepare the basic portal where support staff can view incoming requests.',
    issues: [
      {
        title: 'Create shared inbox detail view',
        priority: 'high',
        status: 'todo',
        assigneeEmail: 'sofia.nguyen@example.com',
      },
      {
        title: 'Add ticket status badges',
        priority: 'medium',
        status: 'in_progress',
        assigneeEmail: 'mia.chen@example.com',
      },
      { title: 'Seed starter support categories', priority: 'low', status: 'done' },
    ],
  },
];

async function main(): Promise<void> {
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const userIdsByEmail = new Map<string, string>();

  for (const user of seedUsers) {
    const createdUser = await prisma.user.create({
      data: user,
    });

    userIdsByEmail.set(createdUser.email, createdUser.id);
  }

  for (const project of seedProjects) {
    const { issues, ...projectData } = project;

    await prisma.project.create({
      data: {
        ...projectData,
        issues: {
          create: issues.map((issue) => ({
            title: issue.title,
            priority: issue.priority,
            status: issue.status,
            assigneeId: issue.assigneeEmail ? userIdsByEmail.get(issue.assigneeEmail) ?? null : null,
          })),
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
