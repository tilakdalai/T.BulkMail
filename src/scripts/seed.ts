import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const existingAdmin = await db.user.findUnique({
    where: { email: 'tilakdalai76@gmail.com' },
  });

  if (!existingAdmin) {
    const hashedPassword = await hashPassword('tilak@1224');
    const admin = await db.user.create({
      data: {
        name: 'Admin',
        email: 'tilakdalai76@gmail.com',
        password: hashedPassword,
        role: 'ADMIN',
        isPremium: true,
        isBlocked: false,
      },
    });
    console.log('Admin user created:', admin.email);
  } else {
    console.log('Admin user already exists');
  }

  // Create demo user
  const existingDemo = await db.user.findUnique({
    where: { email: 'krishnathecoder96@gmail.com' },
  });

  if (!existingDemo) {
    const hashedPassword = await hashPassword('krishna@1218');
    const demo = await db.user.create({
      data: {
        name: 'Demo User',
        email: 'krishnathecoder96@gmail.com',
        password: hashedPassword,
        role: 'USER',
        isPremium: false,
        isBlocked: false,
      },
    });
    console.log('Demo user created:', demo.email);
  } else {
    console.log('Demo user already exists');
  }

  console.log('Seeding complete!');
  console.log('Admin credentials: tilakdalai76@gmail.com / tilak@1224');
  console.log('Demo credentials:  krishnathecoder96@gmail.com / krishna@1218');
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect());
