import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import SettingsPage from './pages/SettingsPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import { setAuthToken } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'settings' | 'delete_account'
  const [authScreen, setAuthScreen] = useState('login'); // 'login' | 'register'
  const [loginSuccessNotice, setLoginSuccessNotice] = useState(null);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setCurrentPage('home');
    setAuthScreen('login');
    setLoginSuccessNotice(null);
  };

  const handleAccountDeleted = () => {
    setCurrentUser(null);
    setCurrentPage('home');
    setAuthScreen('login');
  };

  const handleUserUpdated = (updatedUser) => {
    setCurrentUser(prev => ({
      ...prev,
      ...updatedUser,
    }));
  };

  // Se o usuário não está autenticado, exibe tela de login ou cadastro
  if (!currentUser) {
    if (authScreen === 'register') {
      return (
        <RegisterPage
          onNavigateToLogin={(fromSuccess = false, msg = null) => {
            if (fromSuccess && msg) {
              setLoginSuccessNotice(msg);
            }
            setAuthScreen('login');
          }}
        />
      );
    }

    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => {
          setLoginSuccessNotice(null);
          setAuthScreen('register');
        }}
        initialSuccessMessage={loginSuccessNotice}
      />
    );
  }

  // Página de Configurações da Conta (US-04)
  if (currentPage === 'settings') {
    return (
      <SettingsPage
        currentUser={currentUser}
        onBack={() => setCurrentPage('home')}
        onUserUpdated={handleUserUpdated}
        onNavigateToDeleteAccount={() => setCurrentPage('delete_account')}
      />
    );
  }

  // Página de Exclusão de Conta (Acessível via Configurações)
  if (currentPage === 'delete_account') {
    return (
      <DeleteAccountPage
        currentUser={currentUser}
        onBack={() => setCurrentPage('settings')}
        onAccountDeleted={handleAccountDeleted}
      />
    );
  }

  // Redirecionamento por Papel pós-login (Aluno vs Administrador)
  if (currentUser.role === 'admin') {
    return (
      <AdminUsersPage
        currentUser={currentUser}
        onNavigateToSettings={() => setCurrentPage('settings')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <StudentDashboard
      currentUser={currentUser}
      onNavigateToSettings={() => setCurrentPage('settings')}
      onLogout={handleLogout}
    />
  );
}
