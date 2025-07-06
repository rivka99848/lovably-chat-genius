
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Settings, CreditCard, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProfileDropdownProps {
  user: {
    name: string;
    email: string;
  };
}

const ProfileDropdown = ({ user }: ProfileDropdownProps) => {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/profile');
  };

  const handleUpgradeClick = () => {
    toast({
      title: "שדרוג התוכנית",
      description: "עמוד השדרוג יהיה זמין בקרוב"
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 space-x-reverse">
          <User className="w-5 h-5" />
          <span className="hidden md:inline">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold">{user.name}</div>
        <div className="px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSettingsClick} dir="rtl">
          <Settings className="ml-2 h-4 w-4" />
          הגדרות
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleUpgradeClick} dir="rtl">
          <CreditCard className="ml-2 h-4 w-4" />
          שדרוג
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
