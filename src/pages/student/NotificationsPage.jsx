import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import notificationsData from '../../data/notifications.json';
import { Bell, Award, AlertTriangle, Info, CheckCheck } from 'lucide-react';

export function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const [notifs, setNotifs] = useState(notificationsData);

  const markAllRead = () => {
    setNotifs(notifs.map(n => ({ ...n, isRead: true })));
  };

  const filtered = notifs.filter(n => filter === 'all' || n.type === filter);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Queue alerts, monthly reward updates & penalties</p>
        </div>
        <Button variant="outline" size="sm" icon={CheckCheck} onClick={markAllRead}>
          Mark All as Read
        </Button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'reward', 'alert', 'penalty', 'info'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
              filter === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-100 dark:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((item) => (
          <Card
            key={item.id}
            className={`relative transition ${!item.isRead ? 'border-l-4 border-l-blue-600 dark:border-l-blue-500' : ''}`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  item.type === 'reward'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                    : item.type === 'penalty'
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-600'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                }`}
              >
                {item.type === 'reward' && <Award className="w-5 h-5" />}
                {item.type === 'penalty' && <AlertTriangle className="w-5 h-5" />}
                {(item.type === 'alert' || item.type === 'info') && <Bell className="w-5 h-5" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h3>
                  <span className="text-xs text-slate-400">{item.time}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{item.message}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
