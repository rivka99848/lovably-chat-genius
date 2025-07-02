
import React, { useState } from 'react';
import { Mail, User, Sparkles, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  onAuth: (email: string, name: string, category: string, isSignUp: boolean, password?: string) => void;
  onClose: () => void;
}

const categories = [
  { id: 'programming', name: 'תכנות' },
  { id: 'architecture', name: 'אדריכלות ועיצוב פנים' },
  { id: 'writing', name: 'כתיבה ותמלול' },
  { id: 'design', name: 'גרפיקה ועיצוב' },
  { id: 'copywriting', name: 'ניסוח ושכתוב' }
];

const AuthModal: React.FC<Props> = ({ onAuth, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [currentStep, setCurrentStep] = useState(1); // 1: email+password, 2: name+category (for signup)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && currentStep === 1) {
      // בשלב הראשון של הרשמה - רק בדיקת אימייל וסיסמה
      if (!email || !password) return;
      setCurrentStep(2);
      return;
    }

    if (!email || !password || (isSignUp && (!name || !selectedCategory))) return;

    setIsLoading(true);
    setError('');

    try {
      await onAuth(email, name, selectedCategory, isSignUp, password);
    } catch (err: any) {
      setError(err.message || 'שגיאה בהתחברות');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // כאן נוסיף את הלוגיקה של התחברות עם Google
      // לעת עתה נציג הודעה שהפיצ'ר בפיתוח
      setError('התחברות עם Google תהיה זמינה בקרוב');
    } catch (err: any) {
      setError(err.message || 'שגיאה בהתחברות עם Google');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setEmail('');
    setPassword('');
    setName('');
    setSelectedCategory('');
    setError('');
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  const goBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-blue-900 flex items-center justify-center p-6" dir="rtl">
      <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            ברוכים הבאים לבוט המסונן שלנו
          </h1>
          <p className="text-gray-600">
            {isSignUp 
              ? (currentStep === 1 ? 'הזינו את פרטי ההרשמה שלכם' : 'השלימו את פרטי הפרופיל שלכם')
              : 'התחברו כדי להמשיך'
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* שלב 1: אימייל וסיסמה */}
          {(!isSignUp || currentStep === 1) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">כתובת אימייל</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="הכניסו את האימייל שלכם"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10 py-3 border-gray-300 focus:border-green-500 focus:ring-green-500 text-right"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">סיסמה</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="הכניסו את הסיסמה שלכם"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 pl-10 py-3 border-gray-300 focus:border-green-500 focus:ring-green-500 text-right"
                    required
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
            </>
          )}

          {/* שלב 2: שם וקטגוריה (רק בהרשמה) */}
          {isSignUp && currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">שם מלא</Label>
                <div className="relative">
                  <User className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="הכניסו את השם המלא שלכם"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pr-10 py-3 border-gray-300 focus:border-green-500 focus:ring-green-500 text-right"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-700">קטגוריה מקצועית</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="בחרו את הקטגוריה המקצועית שלכם" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  הקטגוריה הזו תהיה קבועה עבור החשבון שלכם
                </p>
              </div>
            </>
          )}

          <div className="space-y-3">
            {/* כפתור חזרה (רק בשלב 2 של הרשמה) */}
            {isSignUp && currentStep === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                className="w-full py-3"
                disabled={isLoading}
              >
                חזור
              </Button>
            )}

            {/* כפתור עיקרי */}
            <Button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium"
              disabled={isLoading || !email || !password || (isSignUp && currentStep === 2 && (!name || !selectedCategory))}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                  {isSignUp 
                    ? (currentStep === 1 ? 'בודק...' : 'יוצר חשבון...')
                    : 'מתחבר...'
                  }
                </div>
              ) : (
                isSignUp 
                  ? (currentStep === 1 ? 'המשך' : 'צור חשבון')
                  : 'התחבר'
              )}
            </Button>

            {/* התחברות עם Google (רק בהתחברות) */}
            {!isSignUp && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">או</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full py-3 border-2 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  התחבר עם Google
                </Button>
              </>
            )}
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={switchMode}
            className="text-sm text-gray-600 hover:text-green-600 transition-colors"
          >
            {isSignUp ? 'יש לכם כבר חשבון? התחברו' : 'אין לכם חשבון? הירשמו'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">50+</div>
              <div className="text-xs text-gray-500">הודעות חינם</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">4</div>
              <div className="text-xs text-gray-500">מומחי AI</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AuthModal;
