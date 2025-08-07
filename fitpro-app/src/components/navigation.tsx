'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MagicCard } from '@/components/magicui/magic-card';
import {
  Home,
  Users,
  UserPlus,
  Settings,
  BarChart3,
  Calendar,
  Target,
  Crown,
  Zap
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <Home className="w-6 h-6" />
  },
  {
    href: '/dashboard/students',
    label: 'Alunos',
    icon: <Users className="w-6 h-6" />
  },
  {
    href: '/dashboard/students/add',
    label: 'Adicionar',
    icon: <UserPlus className="w-6 h-6" />
  },
  {
    href: '/dashboard/settings',
    label: 'Config',
    icon: <Settings className="w-6 h-6" />
  }
];

export function Navigation() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-black/20 backdrop-blur-xl shadow-lg border-b border-white/20 z-50 p-4">
        <div className="flex items-center justify-center">
          <h1 className="text-2xl font-bold text-white">
            FitPro
          </h1>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-xl shadow-lg border-t border-white/20 z-50">
        <div className="flex justify-around items-center py-4 px-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex-1">
              <MagicCard className={`flex flex-col items-center py-3 px-2 rounded-2xl transition-all duration-300 border-0 ${
                isActive(item.href)
                  ? 'bg-white/20 text-white shadow-lg scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white/80 hover:scale-105'
              }`}>
                <div className={`p-3 rounded-full transition-all duration-300 ${
                  isActive(item.href)
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/80'
                }`}>
                  {item.icon}
                </div>
                <span className={`mt-1 text-xs font-medium transition-colors duration-300 ${
                  isActive(item.href)
                    ? 'text-white'
                    : 'text-white/80'
                }`}>
                  {item.label}
                </span>
              </MagicCard>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
} 