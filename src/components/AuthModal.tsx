
import React, { useState } from 'react';
import { Mail, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface Props {
  onAuth: (email: string, name: string, isSignUp: boolean) => void;
  onClose: () => void;
}

const AuthModal: React.FC<Props> = ({ onAuth, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (isSignUp && !name)) return;

    setIsLoading(true);
    await onAuth(email, name, isSignUp);
    setIsLoading(false);
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
            {isSignUp ? 'צרו את החשבון שלכם כדי להתחיל' : 'התחברו כדי להמשיך'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
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
                  required={isSignUp}
                />
              </div>
            </div>
          )}

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

          <Button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium"
            disabled={isLoading || !email || (isSignUp && !name)}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                {isSignUp ? 'יוצר חשבון...' : 'מתחבר...'}
              </div>
            ) : (
              isSignUp ? 'צור חשבון' : 'התחבר'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
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
