'use client';

import { useApp } from '@/context/AppContext';

export const BestClassDashboard: React.FC = () => {
  const { activeAcademicYear } = useApp();
  const leaderboardData = [
    { rank: 1, className: 'BSc CS A', department: 'Computer Science', totalScore: 345, badge: '🥇 Top Class' },
    { rank: 2, className: 'BCom B', department: 'Commerce', totalScore: 310, badge: '🥈 2nd Place' },
    { rank: 3, className: 'BA English C', department: 'English', totalScore: 285, badge: '🥉 3rd Place' },
    { rank: 4, className: 'I BCA A', department: 'UG Department of Computer Applications', totalScore: 260, badge: '' },
    { rank: 5, className: 'I BBA A', department: 'UG Department of Business Administration', totalScore: 240, badge: '' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(219,39,119,0.06))', border: '1px solid rgba(79,70,229,0.2)' }}>
        <div className="eyebrow" style={{ marginBottom: '8px' }}>Leaderboard {activeAcademicYear || '2025-2026'}</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Best Class Standings</h2>
        <p className="muted" style={{ marginTop: '4px' }}>
          Rankings calculated dynamically based on Academic Performance, Activities, Certifications, and Verification Scores.
        </p>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Class</th>
                <th>Department</th>
                <th>Total Score</th>
                <th>Award</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((item) => (
                <tr key={item.rank} style={item.rank === 1 ? { background: 'rgba(254, 243, 199, 0.4)' } : undefined}>
                  <td style={{ fontWeight: 800, fontSize: '1.1rem' }}>#{item.rank}</td>
                  <td style={{ fontWeight: 700 }}>{item.className}</td>
                  <td>{item.department}</td>
                  <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{item.totalScore} pts</td>
                  <td>
                    {item.badge ? (
                      <span className="badge badge-verified" style={{ fontSize: '0.85rem' }}>
                        {item.badge}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
