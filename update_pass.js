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
  const hash = await bcrypt.hash('StuffVpn2026!', 12);
  console.log('Hash:', hash);

  await prisma.user.update({
    where: { email: 'admin@sxbvpn.com' },
    data: { password: hash }
  });

  console.log('Password updated!');
  await prisma.$disconnect();
}

main().catch(console.error);
