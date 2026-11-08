import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import ChallengeResolutionPage from './pages/ChallengeResolutionPage';
import AdminUsersPage from './pages/AdminUsersPage';
import SettingsPage from './pages/SettingsPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import { setAuthToken, authService } from './services/api';
import { Loader2 } from 'lucide-react';

function AppRoutes() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginSuccessNotice, setLoginSuccessNotice] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Verifica se já existe um token de autenticação salvo
  useEffect(() => {
    const token = localStorage.getItem('dictadle_token');
    if (token) {
      setAuthToken(token);
      authService.getProfile()
        .then((res) => {
          if (res.data?.user) {
            setCurrentUser(res.data.user);
          }
        })
        .catch(() => {
          setAuthToken(null);
          setCurrentUser(null);
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }
  }, []);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/challenge');
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setLoginSuccessNotice(null);
    navigate('/login');
  };

  const handleAccountDeleted = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setLoginSuccessNotice('Sua conta foi excluída com sucesso.');
    navigate('/login');
  };

  const handleUserUpdated = (updatedUser) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...updatedUser,
    }));
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs text-slate-500 font-medium">Carregando Dictadle...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate to={currentUser.role === 'admin' ? '/admin' : '/challenge'} replace />
          ) : (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={() => {
                setLoginSuccessNotice(null);
                navigate('/register');
              }}
              initialSuccessMessage={loginSuccessNotice}
            />
          )
        }
      />

      <Route
        path="/register"
        element={
          currentUser ? (
            <Navigate to={currentUser.role === 'admin' ? '/admin' : '/challenge'} replace />
          ) : (
            <RegisterPage
              onNavigateToLogin={(fromSuccess = false, msg = null) => {
                if (fromSuccess && msg) {
                  setLoginSuccessNotice(msg);
                }
                navigate('/login');
              }}
            />
          )
        }
      />

      {/* Rota do Desafio (Principal para Alunos - US-92) */}
      <Route
        path="/challenge"
        element={
          !currentUser ? (
            <Navigate to="/login" replace state={{ from: location }} />
          ) : (
            <ChallengeResolutionPage
              currentUser={currentUser}
              onNavigateToSettings={() => navigate('/settings')}
              onLogout={handleLogout}
            />
          )
        }
      />

      {/* Dashboard Secundário do Estudante */}
      <Route
        path="/dashboard"
        element={
          !currentUser ? (
            <Navigate to="/login" replace state={{ from: location }} />
          ) : (
            <StudentDashboard
              currentUser={currentUser}
              onNavigateToSettings={() => navigate('/settings')}
              onLogout={handleLogout}
            />
          )
        }
      />

      {/* Painel Administrativo */}
      <Route
        path="/admin"
        element={
          !currentUser ? (
            <Navigate to="/login" replace state={{ from: location }} />
          ) : currentUser.role !== 'admin' ? (
            <Navigate to="/challenge" replace />
          ) : (
            <AdminUsersPage
              currentUser={currentUser}
              onNavigateToSettings={() => navigate('/settings')}
              onLogout={handleLogout}
            />
          )
        }
      />

      {/* Configurações da Conta */}
      <Route
        path="/settings"
        element={
          !currentUser ? (
            <Navigate to="/login" replace state={{ from: location }} />
          ) : (
            <SettingsPage
              currentUser={currentUser}
              onBack={() => navigate(-1)}
              onUserUpdated={handleUserUpdated}
              onNavigateToDeleteAccount={() => navigate('/delete-account')}
            />
          )
        }
      />

      {/* Exclusão de Conta */}
      <Route
        path="/delete-account"
        element={
          !currentUser ? (
            <Navigate to="/login" replace state={{ from: location }} />
          ) : (
            <DeleteAccountPage
              currentUser={currentUser}
              onBack={() => navigate('/settings')}
              onAccountDeleted={handleAccountDeleted}
            />
          )
        }
      />

      {/* Redirecionamento Padrão */}
      <Route
        path="*"
        element={
          currentUser ? (
            <Navigate to={currentUser.role === 'admin' ? '/admin' : '/challenge'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
