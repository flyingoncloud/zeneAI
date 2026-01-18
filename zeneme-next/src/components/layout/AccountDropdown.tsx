import React from 'react';
import * as Icons from '../ui/icons';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useZenemeStore } from '../../hooks/useZenemeStore';

interface AccountDropdownProps {
  isCollapsed?: boolean;
}

const SafeIcon = ({ icon: Icon, ...props }: any) => {
  if (!Icon) return <span style={{ width: props.size || 24, height: props.size || 24, display: 'inline-block', background: '#ccc', borderRadius: 4 }} />;
  return <Icon {...props} />;
};

export const AccountDropdown: React.FC<AccountDropdownProps> = ({ isCollapsed = false }) => {
  const { t } = useZenemeStore();

  const user = {
    name: 'Demo User',
    email: 'user@example.com',
    avatar: 'https://github.com/shadcn.png'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div 
          className={`
            flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 outline-none
            hover:bg-white/5 
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <Avatar className="h-9 w-9 border border-white/10 shrink-0">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-slate-800 text-slate-200">U</AvatarFallback>
          </Avatar>
          
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-sm font-semibold text-slate-200 leading-tight truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate leading-tight mt-0.5">{user.email}</p>
            </div>
          )}
          
          {!isCollapsed && (
            <SafeIcon icon={Icons.MoreHorizontal} size={16} className="text-slate-500 shrink-0" />
          )}
        </div>
      </DropdownMenuTrigger>


    </DropdownMenu>
  );
};
