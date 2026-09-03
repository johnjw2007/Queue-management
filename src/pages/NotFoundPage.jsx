import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Home, Sparkles } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-6xl font-black tracking-tight text-blue-500 mb-2">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-slate-400 text-sm max-w-md mb-8">
        The QueueSense AI route you were looking for does not exist or has been moved.
      </p>
      <Link to="/student">
        <Button variant="primary" icon={Home} size="lg">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
