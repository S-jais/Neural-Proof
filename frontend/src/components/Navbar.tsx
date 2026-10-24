import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, History, FileText, Sparkles } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-navy-700 bg-navy-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-teal flex items-center justify-center shadow-lg shadow-accent-cyan/10 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-5 w-5 text-navy-950 font-bold" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-accent-cyan transition-colors">
                  Neural Proof
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase -mt-1">
                  Evidence-Checking Assistant
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/verify"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive('/verify')
                    ? 'bg-navy-750 text-accent-cyan border border-navy-600'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800'
                }`}
              >
                Workspace
              </Link>
              <Link
                to="/history"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive('/history')
                    ? 'bg-navy-750 text-accent-cyan border border-navy-600'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800'
                }`}
              >
                <History className="h-4 w-4" />
                History
              </Link>
              <Link
                to="/sample"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive('/sample')
                    ? 'bg-navy-750 text-accent-cyan border border-navy-600'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800'
                }`}
              >
                <FileText className="h-4 w-4" />
                Sample Report
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StatusBadge />
            <Link
              to="/verify"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-gradient-to-r from-accent-cyan to-accent-teal text-navy-950 hover:brightness-110 transition-all shadow-md shadow-accent-cyan/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Verify Answer
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
