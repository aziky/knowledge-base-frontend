import { useState, useEffect } from 'react';
import { ArrowUpIcon } from 'lucide-react';
import './App.css';
import { Button } from '@/components/ui/button';
import LoginPage from '@/pages/login/LoginPage';
import { authApi } from '@/services/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      setIsLoading(false);

      // If no token exists, stop loading and show login page
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (token: string, userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('authToken', token);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('authToken');
    authApi.logout().catch(console.error);
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Show main application if authenticated
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header with user info and logout */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
              <div className="flex items-center space-x-4">
                {user && (
                  <span className="text-gray-700">Welcome, {user.email}</span>
                )}
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Knowledge Base Frontend
              </h2>
              <p className="text-gray-600 mb-6">
                You are now logged in and can access the application features.
              </p>

              <div className="flex flex-wrap items-center gap-2 md:flex-row">
                <Button variant="outline">Sample Button</Button>
                <Button variant="outline" size="icon" aria-label="Submit">
                  <ArrowUpIcon />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default App
