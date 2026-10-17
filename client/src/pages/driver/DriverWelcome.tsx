import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { checklistsApi, journeysApi } from '../../lib/fleetApi';
import { useAuthStore } from '../../store/authStore';
import type { Checklist, Journey } from '../../types/fleet';

export default function DriverWelcome() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [recentChecklist, setRecentChecklist] = useState<Checklist | null>(null);
  const [flaggedChecklist, setFlaggedChecklist] = useState<Checklist | null>(null);

  const firstName = user?.name?.split(' ')[0] || 'Driver';

  const refresh = async () => {
    try {
      const [journeys, checklists] = await Promise.all([
        journeysApi.mine().catch(() => []),
        checklistsApi.mine().catch(() => []),
      ]);

      const active = journeys.find((j) => j.status === 'IN_TRANSIT');
      setActiveJourney(active || null);

      const flagged = checklists.find(
        (c) => c.status === 'FLAGGED' || c.status === 'UNDER_REPAIR'
      );
      setFlaggedChecklist(flagged || null);

      const cutoff = Date.now() - 12 * 60 * 60 * 1000;
      const valid = checklists
        .filter(
          (c) =>
            (c.status === 'APPROVED' || c.status === 'CLEARED') &&
            new Date(c.createdAt).getTime() > cutoff
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
      setRecentChecklist(valid || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!flaggedChecklist) return;
    const id = setInterval(async () => {
      try {
        const checklists = await checklistsApi.mine();
        const still = checklists.find(
          (c) => c.status === 'FLAGGED' || c.status === 'UNDER_REPAIR'
        );
        setFlaggedChecklist(still || null);
        const valid = checklists.find(
          (c) => c.status === 'APPROVED' || c.status === 'CLEARED'
        );
        if (valid) setRecentChecklist(valid);
      } catch {
        // ignore
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [flaggedChecklist]);

  useEffect(() => {
    if (activeJourney) {
      navigate(`/driver/journey/${activeJourney.id}`, { replace: true });
    }
  }, [activeJourney, navigate]);

  if (loading || activeJourney) {
    return (
      <div className="min-h-screen bg-brand-black">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center text-gray-500">
          {activeJourney ? 'Resuming your journey…' : 'Loading…'}
        </div>
      </div>
    );
  }

  const hasValidChecklist = !!recentChecklist;
  const isFlagged = !!flaggedChecklist;

  return (
    <div className="min-h-screen bg-brand-black">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="card text-center py-14 px-8 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 20%, #E85D04 0%, transparent 55%), radial-gradient(circle at 75% 80%, #E85D04 0%, transparent 55%)',
            }}
          />

          <div className="relative">
            <div
              className={`w-20 h-20 rounded-full mx-auto mb-6 border-2 flex items-center justify-center text-4xl ${
                isFlagged
                  ? 'bg-red-500/10 border-red-500/40'
                  : 'bg-brand-orange/10 border-brand-orange/40'
              }`}
            >
              {isFlagged ? '🔧' : '🚚'}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
              Welcome, <span className="text-brand-orange">{firstName}</span>
            </h1>

            {isFlagged && (
              <>
                <p className="text-gray-300 text-lg max-w-xl mx-auto mb-6 leading-relaxed">
                  Your vehicle has a{' '}
                  <span className="text-red-400 font-semibold">
                    pending maintenance issue
                  </span>
                  . The operations team is working on it. You'll be able to start
                  your journey once it's resolved.
                </p>

                <div className="max-w-md mx-auto p-4 rounded-lg bg-red-500/10 border border-red-500/40 text-left mb-6">
                  <p className="text-xs font-semibold text-red-400 uppercase mb-2">
                    Issue Reported
                  </p>
                  <p className="text-sm text-gray-200">
                    {flaggedChecklist!.issuesNotes || 'See checklist for details.'}
                  </p>
                  <p className="text-xs text-gray-500 mt-3">
                    Status:{' '}
                    <strong className="text-yellow-400">
                      {flaggedChecklist!.status.replace('_', ' ')}
                    </strong>
                  </p>
                </div>

                <button onClick={() => refresh()} className="btn-outline">
                  ↻ Check Status Again
                </button>

                <p className="text-xs text-gray-500 mt-4">
                  Auto-refreshing every 30 seconds. You'll be notified when the
                  repair is complete.
                </p>
              </>
            )}

            {!isFlagged && hasValidChecklist && (
              <>
                <p className="text-gray-300 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                  Your checklist from{' '}
                  <span className="text-brand-orange font-semibold">
                    {new Date(recentChecklist!.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>{' '}
                  is still valid. You can proceed to your shipments.
                </p>

                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => navigate('/driver/shipments')}
                    className="btn-primary text-base px-8 py-4"
                  >
                    Continue to My Shipments →
                  </button>
                  <button
                    onClick={() => navigate('/driver/checklist')}
                    className="btn-outline text-base px-6 py-4"
                  >
                    New Checklist
                  </button>
                </div>
              </>
            )}

            {!isFlagged && !hasValidChecklist && (
              <>
                <p className="text-gray-300 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                  You are expected to complete your{' '}
                  <span className="text-brand-orange font-semibold">
                    journey checklist form
                  </span>{' '}
                  before you start your journey.
                </p>

                <button
                  onClick={() => navigate('/driver/checklist')}
                  className="btn-primary text-base px-8 py-4"
                >
                  Start Now →
                </button>

                <p className="text-xs text-gray-500 mt-6">
                  This ensures your vehicle is in safe condition and the customer
                  timeline is updated correctly.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <Link
            to="/driver/shipments"
            className="card hover:border-brand-orange transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center text-lg">
                📦
              </div>
              <div>
                <p className="font-semibold">My Assignments</p>
                <p className="text-xs text-gray-500">
                  Shipments assigned to you
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/driver/checklist"
            className="card hover:border-brand-orange transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center text-lg">
                ✅
              </div>
              <div>
                <p className="font-semibold">Vehicle Checklist</p>
                <p className="text-xs text-gray-500">
                  Complete a new inspection
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}