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

const seedLabels = [
  { name: 'Bug' },
  { name: 'Content' },
  { name: 'Dashboard' },
  { name: 'Frontend' },
  { name: 'Research' },
  { name: 'UX' },
] as const;

interface SeedProject {
  name: string;
  description: string;
  issues: Array<{
    title: string;
    description: string;
    priority: IssuePriority;
    status: IssueStatus;
    assigneeEmail?: (typeof seedUsers)[number]['email'];
    labelNames?: Array<(typeof seedLabels)[number]['name']>;
  }>;
}

const seedProjects: SeedProject[] = [
  {
    name: 'Marketing Website Refresh',
    description: 'Update the landing page layout and improve call-to-action sections.',
    issues: [
      {
        title: 'Rewrite hero copy for the spring campaign',
        description: 'Refresh the hero headline, subcopy, and call-to-action so the spring messaging feels sharper and consistent with the campaign brief.',
        priority: 'high',
        status: 'todo',
        assigneeEmail: 'mia.chen@example.com',
        labelNames: ['Content', 'Research'],
      },
      {
        title: 'Ship responsive navigation polish',
        description: 'Tighten tablet and small-desktop spacing, verify focus states, and make sure the mobile drawer animation still feels smooth after the refresh.',
        priority: 'medium',
        status: 'in_progress',
        assigneeEmail: 'noah.patel@example.com',
        labelNames: ['Frontend', 'UX'],
      },
      {
        title: 'Audit homepage image compression',
        description: 'Review the current homepage assets, replace the largest offenders, and document which images should be re-exported for launch.',
        priority: 'low',
        status: 'done',
        labelNames: ['Frontend'],
      },
    ],
  },
  {
    name: 'Inventory Dashboard',
    description: 'Build the first internal dashboard for tracking stock changes.',
    issues: [
      {
        title: 'Add low-stock summary widgets',
        description: 'Design and ship the first overview cards so warehouse leads can immediately spot risky inventory levels when they open the dashboard.',
        priority: 'high',
        status: 'todo',
        assigneeEmail: 'leo.tran@example.com',
        labelNames: ['Dashboard', 'UX'],
      },
      {
        title: 'Connect warehouse activity feed',
        description: 'Wire the latest stock movement events into the dashboard feed and make sure the timestamps and event types render clearly.',
        priority: 'medium',
        status: 'in_progress',
        assigneeEmail: 'sofia.nguyen@example.com',
        labelNames: ['Dashboard', 'Frontend'],
      },
      {
        title: 'Create initial table filters',
        description: 'Add baseline filters for warehouse, item status, and updated date so the operations team can narrow the table without exporting data.',
        priority: 'low',
        status: 'done',
        labelNames: ['Dashboard', 'Research'],
      },
    ],
  },
  {
    name: 'Customer Support Portal',
    description: 'Prepare the basic portal where support staff can view incoming requests.',
    issues: [
      {
        title: 'Create shared inbox detail view',
        description: 'Build the right-hand detail panel that shows the selected request, requester information, and the most recent support activity.',
        priority: 'high',
        status: 'todo',
        assigneeEmail: 'sofia.nguyen@example.com',
        labelNames: ['Bug', 'Frontend'],
      },
      {
        title: 'Add ticket status badges',
        description: 'Introduce clear visual badges for new, pending, and resolved tickets so support staff can scan the list faster during triage.',
        priority: 'medium',
        status: 'in_progress',
        assigneeEmail: 'mia.chen@example.com',
        labelNames: ['Frontend', 'UX'],
      },
      {
        title: 'Seed starter support categories',
        description: 'Add a first pass of support categories and short helper copy so incoming requests can be grouped consistently from day one.',
        priority: 'low',
        status: 'done',
        labelNames: ['Content', 'Research'],
      },
    ],
  },
];

async function main(): Promise<void> {
  await prisma.project.deleteMany();
  await prisma.label.deleteMany();
  await prisma.user.deleteMany();

  const userIdsByEmail = new Map<string, string>();
  const labelIdsByName = new Map<string, string>();

  for (const user of seedUsers) {
    const createdUser = await prisma.user.create({
      data: user,
    });

    userIdsByEmail.set(createdUser.email, createdUser.id);
  }

  for (const label of seedLabels) {
    const createdLabel = await prisma.label.create({
      data: label,
    });

    labelIdsByName.set(createdLabel.name, createdLabel.id);
  }

  for (const project of seedProjects) {
    const { issues, ...projectData } = project;

    await prisma.project.create({
      data: {
        ...projectData,
        issues: {
          create: issues.map((issue) => ({
            title: issue.title,
            description: issue.description,
            priority: issue.priority,
            status: issue.status,
            assigneeId: issue.assigneeEmail ? userIdsByEmail.get(issue.assigneeEmail) ?? null : null,
            labels:
              issue.labelNames && issue.labelNames.length > 0
                ? {
                    connect: issue.labelNames
                      .map((labelName) => labelIdsByName.get(labelName))
                      .filter((labelId): labelId is string => Boolean(labelId))
                      .map((labelId) => ({ id: labelId })),
                  }
                : undefined,
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
