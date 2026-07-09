
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePassword() {
  const hash = await bcrypt.hash('SxBvpn2026!', 12);
  console.log('Hash:', hash);
  const result = await prisma.user.update({
    where: { email: 'admin@sxbvpn.com' },
    data: { password: hash }
  });
  console.log('Updated:', result.email);
  await prisma.$disconnect();
}
updatePassword().catch(console.error);
