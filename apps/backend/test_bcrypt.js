
const bcrypt = require('bcryptjs');
const hash = '$2b$10$8gc66Iu33zEH8NGqEOfjGegLg0Dcxb6EEJgCQuImUP1KgV3B5Myea';
console.log('Testing with hash:', hash);
console.log('Hash length:', hash.length);
bcrypt.compare('stuffVpn2025!', hash).then(r => {
    console.log('Password match:', r);
}).catch(e => {
    console.log('Error:', e.message);
});
