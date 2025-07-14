import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    // בדיקה אם יש טוקן ומייל
    if (token && email) {
      setIsValidToken(true);
    } else {
      setMessage('קישור לא תקין. אנא בקשו קישור חדש לאיפוס סיסמה.');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setMessage('אנא מלאו את כל השדות');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('הסיסמאות לא תואמות');
      return;
    }

    if (password.length < 6) {
      setMessage('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // שליחת נתונים לוובהוק
      const requestData = {
        "event": "password_reset_completed",
        "user": {
          "email": email,
          "token": token,
          "new_password": password
        },
        "request_info": {
          "timestamp": new Date().toISOString(),
          "action": "password_update",
          "source": "reset_password_page",
          "user_agent": navigator.userAgent,
          "origin": window.location.origin
        },
        "webhook_version": "1.0"
      };

      console.log('JSON Data to send:', JSON.stringify(requestData, null, 2));
      
      const response = await fetch('https://n8n.smartbiz.org.il/webhook/c23a573f-06bf-4393-af56-e5388709a5ca', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData, null, 2),
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // קצת זמן לעיבוד
      
      setIsSuccess(true);
      setMessage('הסיסמה עודכנה בהצלחה!');
      
      // הפניה חזרה לדף הבית אחרי 3 שניות
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage('אירעה שגיאה בעדכון הסיסמה. אנא נסו שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-6" dir="rtl">
        <Card className="p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">קישור לא תקין</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <Button 
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            חזרה לדף הבית
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-6" dir="rtl">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">איפוס סיסמה</h1>
          <p className="text-gray-600">הזינו סיסמה חדשה עבור: {email}</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            isSuccess 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {isSuccess ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm">{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">סיסמה חדשה</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="הכניסו סיסמה חדשה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 pl-10 py-3 text-right"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-700">אישור סיסמה</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="הכניסו שוב את הסיסמה החדשה"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10 pl-10 py-3 text-right"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium"
            disabled={isLoading || !password || !confirmPassword}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                מעדכן סיסמה...
              </div>
            ) : (
              'עדכן סיסמה'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            חזרה לדף הבית
          </button>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;