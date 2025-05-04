function showLoginForm() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

function handleLogin(event) {
    event.preventDefault();
    // For demo purposes, just show dashboard
    showDashboard();
}

function handleRegister(event) {
    event.preventDefault();
    // For demo purposes, show login form after registration
    showLoginForm();
}

function logout() {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
} 
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

function handleLogin(event) {
    event.preventDefault();
    // For demo purposes, just show dashboard
    showDashboard();
}

function handleRegister(event) {
    event.preventDefault();
    // For demo purposes, show login form after registration
    showLoginForm();
}

function logout() {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}