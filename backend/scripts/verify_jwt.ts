
import { JwtService } from '@nestjs/jwt';

async function verifyJwt() {
    const jwtService = new JwtService({ secret: 'secretKey' }); // Use the same secret as in AuthModule
    const payload = { sub: 'test-user-id', email: 'test@school.com', role: 'TEACHER' };
    const token = jwtService.sign(payload);

    console.log(`Generated Token: ${token}`);

    const decoded = jwtService.verify(token);
    console.log('Decoded Payload:', decoded);

    // Simulate Strategy Validation return
    const validatedUser = { id: decoded.sub, email: decoded.email, role: decoded.role };
    console.log('Validated User Object:', validatedUser);

    if (validatedUser.id === 'test-user-id') {
        console.log('SUCCESS: User ID is correctly mapped.');
    } else {
        console.log('FAILURE: User ID mismatch.');
    }
}

verifyJwt();
