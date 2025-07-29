import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from '@/components/UserProfile';
import { loginUser } from '@/lib/auth/login';
import { registerUser } from '@/lib/auth/register';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messagesUsed: number;
  messageLimit: number;
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user from localStorage
    const savedUser = localStorage.getItem('lovable_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Redirect to home if no user found
      navigate('/');
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, [navigate]);

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleClose = () => {
    navigate('/');
  };

  // פונקציה לדוגמה להתחברות
  const handleLogin = async (email: string, password: string) => {
    try {
      const userData = await loginUser(email, password);
      if (userData && (userData.success || userData === true)) {
        setUser(userData);
        localStorage.setItem('lovable_user', JSON.stringify(userData));
      } else {
        throw new Error('שגיאה בהתחברות');
      }
    } catch (error: any) {
      alert(error.message || 'שגיאה בהתחברות');
    }
  };

  // פונקציה לדוגמה לרישום
  const handleRegister = async (email: string, name: string, category: string, password: string) => {
    try {
      const userData = await registerUser(email, name, category, password);
      if (userData && (userData.success || userData === true)) {
        setUser(userData);
        localStorage.setItem('lovable_user', JSON.stringify(userData));
      } else {
        throw new Error('שגיאה ברישום');
      }
    } catch (error: any) {
      alert(error.message || 'שגיאה ברישום');
    }
  };

  if (!user) {
    return null; // or loading spinner
  }

  return (
    <UserProfile
      user={user}
      onClose={handleClose}
      onUpdateUser={handleUpdateUser}
      isDarkMode={isDarkMode}
      onThemeToggle={handleThemeToggle}
    />
  );
};

export default Profile;
