
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function test() {
    const email = 'admin@sxbvpn.com';
    const password = 'stuffVpn2025!';
    
    // Check User table
    const user = await prisma.user.findUnique({
        where: { email }
    });
    console.log('User from User table:', user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        hasPassword: !!user.password
    } : 'Not found');
    
    // Check Admin table
    const admin = await prisma.admin.findUnique({
        where: { email }
    });
    console.log('Admin from Admin table:', admin ? {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        hasPassword: !!admin.password
    } : 'Not found');
    
    // Test password comparison for admin
    if (admin && admin.password) {
        const match = await bcrypt.compare(password, admin.password);
        console.log('Admin password match:', match);
    }
    
    // Test password comparison for user
    if (user && user.password) {
        const match = await bcrypt.compare(password, user.password);
        console.log('User password match:', match);
    }
    
    await prisma.$disconnect();
}

test();
