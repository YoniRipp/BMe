import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: hashedPassword,
      name: 'Test User',
      emailVerified: true,
      settings: {
        create: {
          theme: 'system',
          currency: 'USD',
          language: 'en',
          timezone: 'UTC',
        },
      },
    },
  });

  console.log('Created user:', user.email);

  // Create sample transactions
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        userId: user.id,
        date: new Date(2025, 0, 15),
        type: 'income',
        amount: 5000,
        category: 'Salary',
        description: 'Monthly salary',
        isRecurring: true,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        date: new Date(2025, 0, 14),
        type: 'expense',
        amount: 50,
        category: 'Food',
        description: 'Groceries',
        isRecurring: false,
      },
    }),
  ]);

  console.log('Created transactions:', transactions.length);

  // Create sample workout
  const workout = await prisma.workout.create({
    data: {
      userId: user.id,
      date: new Date(2025, 0, 15),
      title: 'Morning Run',
      type: 'cardio',
      durationMinutes: 30,
      exercises: [
        { name: 'Running', sets: 1, reps: 1 },
      ],
    },
  });

  console.log('Created workout:', workout.id);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });