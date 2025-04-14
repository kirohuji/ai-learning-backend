import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Delete existing permissions first
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});

  // Create permissions
  const permissions = await Promise.all([
    // Admin permissions
    prisma.permission.create({
      data: {
        name: 'admin:full',
        description: 'Full administrative access',
      },
    }),
    // User permissions
    prisma.permission.create({
      data: {
        name: 'user:read',
        description: 'Read user data',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'user:write',
        description: 'Write user data',
      },
    }),
    // Guest permissions
    prisma.permission.create({
      data: {
        name: 'guest:read',
        description: 'Basic read access',
      },
    }),
  ]);

  // Create admin role with all permissions
  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      description: 'Administrator with full access',
      permissions: {
        connect: permissions.map((p) => ({ id: p.id })),
      },
    },
  });

  // Create user role with user permissions
  await prisma.role.create({
    data: {
      name: 'user',
      description: 'Regular user with basic access',
      permissions: {
        connect: permissions
          .filter(
            (p) => p.name.startsWith('user:') || p.name.startsWith('guest:'),
          )
          .map((p) => ({ id: p.id })),
      },
    },
  });

  // Create guest role with minimal permissions
  await prisma.role.create({
    data: {
      name: 'guest',
      description: 'Guest with limited access',
      permissions: {
        connect: permissions
          .filter((p) => p.name.startsWith('guest:'))
          .map((p) => ({ id: p.id })),
      },
    },
  });

  // Create admin user
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedPassword = crypto
    .pbkdf2Sync('admin123', salt, 1000, 64, 'sha512')
    .toString('hex');

  await prisma.user.create({
    data: {
      phone: '13800000000',
      password: `${salt}:${hashedPassword}`,
      name: 'Admin',
      status: 1,
      roles: {
        connect: [{ id: adminRole.id }],
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
