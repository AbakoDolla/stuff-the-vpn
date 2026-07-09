
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
    try {
        const admin = await prisma.admin.findUnique({
            where: { email: 'admin@sxbvpn.com' }
        });
        console.log('Admin found:', admin ? 'Yes' : 'No');
        console.log('Admin email:', admin?.email);
        console.log('Admin role:', admin?.role);
        
        // Test bcrypt
        const bcrypt = require('bcryptjs');
        const match = await bcrypt.compare('stuffVpn2025!', admin?.password || '');
        console.log('Password match:', match);
    } catch (e) {
        console.log('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
