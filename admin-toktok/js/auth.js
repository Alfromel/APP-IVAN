document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verificar sesión existente
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
            window.location.href = 'dashboard.html';
            return;
        }

        // Configurar eventos de formularios
        setupAuthForms();
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        showMessage('Error al conectar con el servidor', 'error');
    }
});

function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAuthAction('login');
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAuthAction('signup');
        });
    }
}

async function handleAuthAction(action) {
    const emailField = action === 'login' ? 'login-email' : 'signup-email';
    const passwordField = action === 'login' ? 'login-password' : 'signup-password';
    
    const email = document.getElementById(emailField).value;
    const password = document.getElementById(passwordField).value;

    try {
        let result;
        
        if (action === 'login') {
            result = await supabase.auth.signInWithPassword({ email, password });
        } else {
            const phone = document.getElementById('signup-phone').value;
            
            // Verificar si el número ya existe
            const { data: existingUser, error: phoneError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('phone', phone)
                .single();

            if (existingUser) {
                showMessage('Este número de teléfono ya está registrado', 'error');
                return;
            }

            result = await supabase.auth.signUp({ 
                email, 
                password,
                options: {
                    data: {
                        phone: phone
                    }
                }
            });

            // Crear perfil de usuario con el número
            if (result.data && result.data.user) {
                await supabase
                    .from('user_profiles')
                    .insert([
                        { 
                            id: result.data.user.id,
                            phone: phone,
                            full_name: email.split('@')[0],
                            created_at: new Date().toISOString()
                        }
                    ]);
            }
        }

        const { error } = result;

        if (error) {
            showMessage(error.message, 'error');
            return;
        }

        if (action === 'login') {
            window.location.href = 'dashboard.html';
        } else {
            showMessage('¡Registro exitoso! Por favor verifica tu correo electrónico.', 'success');
            document.getElementById('signup-form').reset();
        }
    } catch (error) {
        showMessage('Error inesperado: ' + error.message, 'error');
    }
}

function showMessage(message, type) {
    const messageEl = document.getElementById('auth-message');
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = `mt-4 text-center text-sm ${
        type === 'error' ? 'text-red-400' : 'text-green-400'
    }`;
    messageEl.classList.remove('hidden');

    setTimeout(() => {
        messageEl.classList.add('hidden');
    }, 5000);
}