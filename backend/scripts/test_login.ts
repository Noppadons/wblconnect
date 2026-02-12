
async function testLogin() {
    const email = 'admin@school.com';
    const password = '123456';

    console.log(`[Test] Attempting login for ${email}...`);

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        console.log(`[Test] Response Status: ${response.status}`);

        if (response.ok) {
            const data = await response.json();
            console.log('[Test] Login Successful!');
            console.log('[Test] User Role:', data.user.role);
            console.log('[Test] Token:', data.access_token.substring(0, 20) + '...');
        } else {
            const errorText = await response.text();
            console.log('[Test] Login Failed:', errorText);
        }
    } catch (err) {
        console.error('[Test] Fetch Error:', err.message);
    }
}

testLogin();
