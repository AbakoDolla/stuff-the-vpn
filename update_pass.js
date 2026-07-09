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
  const email = process.argv[2] || 'admin@sxbvpn.com';
  const password = process.argv[3] || 'admin123';
  
  const hash = await bcrypt.hash(password, 12);
  console.log('Setting password for:', email);
  
  try {
    const result = await prisma.user.update({
      where: { email },
      data: { password: hash, status: 'ACTIVE' }
    });
    console.log('Updated!', result.email);
  } catch (e) {
    console.log('User not found, trying Admin...');
    try {
      await prisma.admin.update({
        where: { email },
        data: { password: hash, isActive: true }
      });
      console.log('Admin updated!');
    } catch (e2) {
      console.log('User not found!');
    }
  }
  
  prisma.$disconnect();
}

main().catch(console.error);
