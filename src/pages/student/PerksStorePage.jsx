import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import perksData from '../../data/perks.json';
import { Gift, Award, CheckCircle2, Utensils, BookOpen, Car, Coffee, Lock } from 'lucide-react';

export function PerksStorePage() {
  const { user, updateStudentPoints } = useAuth();
  const { addToast } = useToast();
  const [points, setPoints] = useState(user?.monthlyRewardPoints || 42);

  const getPerkIcon = (iconName) => {
    switch (iconName) {
      case 'Utensils': return Utensils;
      case 'BookOpen': return BookOpen;
      case 'Car': return Car;
      case 'Coffee': return Coffee;
      default: return Gift;
    }
  };

  const handleRedeem = (perk) => {
    if (points < perk.pointsCost) {
      addToast(`Insufficient points! You need ${perk.pointsCost - points} more points.`, 'danger', 'Redemption Failed');
      return;
    }
    const newBal = points - perk.pointsCost;
    setPoints(newBal);
    updateStudentPoints(user?.id, newBal);
    addToast(`Successfully redeemed "${perk.title}"! Voucher code sent to ${user?.email}.`, 'success', 'Perk Claimed 🎉');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Campus Perks & Rewards Store</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Exchange your queue discipline points for exclusive college privileges</p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
          <Award className="w-5 h-5 text-white" />
          <div>
            <div className="text-[10px] text-emerald-100 font-semibold uppercase">Available Balance</div>
            <div className="text-lg font-black">{points} Points</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {perksData.map((perk) => {
          const IconComp = getPerkIcon(perk.icon);
          const canAfford = points >= perk.pointsCost;

          return (
            <Card key={perk.id} className="flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {perk.pointsCost} Points
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">{perk.title}</h3>
                <span className="text-[11px] font-semibold text-slate-400 block mb-3">{perk.category}</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {perk.description}
                </p>
              </div>

              <Button
                variant={canAfford ? 'primary' : 'outline'}
                disabled={!canAfford}
                onClick={() => handleRedeem(perk)}
                className="w-full"
              >
                {canAfford ? (
                  <>
                    <Gift className="w-4 h-4" /> Redeem Perk
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Need {perk.pointsCost - points} More Pts
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
