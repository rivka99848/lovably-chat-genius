
import React from 'react';
import { User, Settings, Crown, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messagesUsed: number;
  messageLimit: number;
}

interface Props {
  user: User;
  onUpgrade: () => void;
}

const ProfileDropdown: React.FC<Props> = ({ user, onUpgrade }) => {
  const navigate = useNavigate();

  const handleSettings = () => {
    navigate('/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('lovable_user');
    localStorage.removeItem('lovable_chat_history');
    toast({
      title: "התנתקת בהצלחה",
      description: "נתראה בקרוב!",
    });
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-right hidden sm:block">
            <div className="font-medium text-sm">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border shadow-lg">
        <div className="px-3 py-2 border-b">
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
        
        <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
          <Settings className="w-4 h-4 ml-2" />
          הגדרות
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onUpgrade} className="cursor-pointer">
          <Crown className="w-4 h-4 ml-2" />
          שדרוג חבילה
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="w-4 h-4 ml-2" />
          התנתקות
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
