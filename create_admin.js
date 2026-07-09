const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://sxbvpn_user:ChangeMe123!@localhost:5432/sxbvpn'
    }
  }
});

async function main() {
  const email = 'admin@sxbvpn.com';
  const password = 'admin123';
  const username = 'admin';
  
  const hash = await bcrypt.hash(password, 12);
  console.log('Creating admin user:', email);
  
  try {
    // Try to create in User table first
    const result = await prisma.user.create({
      data: {
        email,
        username,
        password: hash,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });
    console.log('User created!', result.email);
  } catch (e) {
    console.log('Error creating user (might already exist):', e.message);
  }
  
  prisma.\$disconnect();
}

main().catch(console.error);
