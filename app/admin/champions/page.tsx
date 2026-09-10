'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useApp } from '@/context/AppContext';
import { Champion } from '@/data/initialData';
import { CustomModal } from '@/components/CustomModal';

export default function ChampionsManagementPage() {
  const { championsData, fetchChampions, academicYears, classes } = useApp();
  const [deleteChampIdModal, setDeleteChampIdModal] = useState<number | null>(null);
  const [year, setYear] = useState(academicYears?.[0] || '');
  const [category, setCategory] = useState<'UG' | 'PG'>('UG');
  const [rank, setRank] = useState(1);
  const [rankLabel, setRankLabel] = useState('👑 CHAMPION');
  const [teamName, setTeamName] = useState('');
  const [eventName, setEventName] = useState('');
  const [score, setScore] = useState('');
  const [institution, setInstitution] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'All' | 'UG' | 'PG'>('All');

  useEffect(() => {
    fetchChampions();
  }, []);

  // Set default year if not set and academicYears is loaded
  useEffect(() => {
    if (!year && academicYears && academicYears.length > 0) {
      setYear(academicYears[0]);
    }
  }, [academicYears, year]);

  // Update rankLabel automatically when rank changes
  useEffect(() => {
    if (rank === 1) setRankLabel('👑 CHAMPION');
    else if (rank === 2) setRankLabel('🥈 RUNNER UP');
    else if (rank === 3) setRankLabel('🥉 2ND RUNNER UP');
    else setRankLabel(`POSITION ${rank}`);
  }, [rank]);

  // Handle team name change and auto-fill department + UG/PG category
  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTeamName(val);

    const upperVal = val.toUpperCase();
    if (upperVal.includes('MCA') || upperVal.includes('MBA') || upperVal.includes('MSW') || upperVal.includes('MCOM') || upperVal.includes('MSC') || upperVal.includes('PG')) {
      setCategory('PG');
    } else if (upperVal.includes('BCA') || upperVal.includes('BBA') || upperVal.includes('BSW') || upperVal.includes('BCOM') || upperVal.includes('BSC') || upperVal.includes('BA') || upperVal.includes('UG')) {
      setCategory('UG');
    }

    const foundClass = classes.find(c => c.name === val);
    if (foundClass && foundClass.department) {
      setInstitution(foundClass.department);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!year || !teamName || !score) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('year', year);
    formData.append('category', category);
    formData.append('rank', rank.toString());
    formData.append('rankLabel', rankLabel);
    formData.append('teamName', teamName);
    formData.append('eventName', eventName);
    formData.append('score', score);
    formData.append('institution', institution);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('bc_access_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('http://localhost:8000/api/champions/', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (res.ok) {
        toast.success(`Champion (${category}) inserted successfully!`);
        setTeamName('');
        setScore('');
        setImageFile(null);
        await fetchChampions();
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = typeof errData === 'object' ? JSON.stringify(errData) : 'Failed to add champion.';
        toast.error(`Failed to add champion: ${errMsg}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding champion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteChamp = async (id: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bc_access_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`http://localhost:8000/api/champions/${id}/`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        await fetchChampions();
        toast.info('Champion deleted.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteChampIdModal(null);
    }
  };

  // Helper function to order top 3 champions into standard podium order: [Rank 2 (Left), Rank 1 (Center), Rank 3 (Right)]
  const getPodiumOrderedChamps = (champs: Champion[]) => {
    const filtered = filterCategory === 'All'
      ? champs
      : champs.filter(c => (c.category || 'UG').toUpperCase() === filterCategory.toUpperCase());

    const top3Only = filtered.filter(c => c.rank <= 3);
    const sorted = [...top3Only].sort((a, b) => a.rank - b.rank);
    if (sorted.length < 2) return sorted;

    const rank1 = sorted.find(c => c.rank === 1);
    const rank2 = sorted.find(c => c.rank === 2);
    const rank3 = sorted.find(c => c.rank === 3);

    const podium = [];
    if (rank2) podium.push(rank2);
    if (rank1) podium.push(rank1);
    if (rank3) podium.push(rank3);

    return podium;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>Previous Champions Management</h1>
        <p className="muted" style={{ fontSize: '0.88rem' }}>Add and manage previous year champions with PG / UG category filtering.</p>
      </div>

      {/* Insert Champion Form Card */}
      <div className="card" style={{ padding: '28px', borderRadius: '20px', border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Add New Champion</h2>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: '9999px', letterSpacing: '0.04em' }}>ADMIN INSERT FORM</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>ACADEMIC YEAR</label>
              <input
                type="text"
                list="year-list"
                placeholder="e.g., 2024-2025"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.9rem' }}
              />
              <datalist id="year-list">
                {academicYears.map(ay => (
                  <option key={ay} value={ay} />
                ))}
              </datalist>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>PROGRAM LEVEL (PG / UG)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'UG' | 'PG')}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '2px solid #3b82f6', fontWeight: 800, fontSize: '0.9rem', background: '#eff6ff', color: '#1e40af', cursor: 'pointer' }}
              >
                <option value="UG">UG (Undergraduate)</option>
                <option value="PG">PG (Postgraduate)</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>RANK POSITION</label>
              <select
                value={rank}
                onChange={(e) => setRank(parseInt(e.target.value, 10))}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.9rem', background: '#ffffff' }}
              >
                <option value={1}>1st Place</option>
                <option value={2}>2nd Place</option>
                <option value={3}>3rd Place</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>RANK TITLE LABEL</label>
              <input
                type="text"
                placeholder="e.g., 👑 CHAMPION"
                value={rankLabel}
                onChange={(e) => setRankLabel(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.9rem' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>TEAM / CLASS NAME</label>
              <input
                type="text"
                list="class-list"
                placeholder="Search or type class (e.g., II MCA or II BCA A)"
                value={teamName}
                onChange={handleTeamNameChange}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.9rem' }}
              />
              <datalist id="class-list">
                {classes.map(c => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>EVENT NAME (OPTIONAL)</label>
              <input
                type="text"
                placeholder="e.g., Marian Excellence Grid Annual Cup"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.9rem' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>DEPARTMENT / INSTITUTION</label>
              <input
                type="text"
                placeholder="e.g., Dept. of Computer Applications"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>FINAL SCORE (PTS)</label>
              <input
                type="text"
                placeholder="e.g., 98.5"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.9rem' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>TEAM PHOTO (JPG/PNG)</label>
              <input
                type="file"
                accept="image/jpeg, image/png"
                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '14px',
              background: 'linear-gradient(135deg, #FF6B2C 0%, #ea580c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            {isSubmitting ? 'Inserting Champion Record...' : '🏆 Insert Champion Record'}
          </button>
        </form>
      </div>

      {/* Saved Champions Display Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Saved Champions Records</h2>
          </div>

          {/* PG / UG Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filter Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as 'All' | 'UG' | 'PG')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                color: '#0f172a',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <option value="All">All Categories (UG & PG)</option>
              <option value="UG">UG (Undergraduate)</option>
              <option value="PG">PG (Postgraduate)</option>
            </select>
          </div>
        </div>

        {Object.keys(championsData).length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>No champions found in the database.</p>
          </div>
        ) : (
          Object.entries(championsData)
            .sort(([yearA], [yearB]) => parseInt(yearB, 10) - parseInt(yearA, 10))
            .map(([yr, champs]) => {
              const podiumOrdered = getPodiumOrderedChamps(champs);
              if (podiumOrdered.length === 0) return null;

              return (
                <div key={yr} style={{ marginBottom: '32px', background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                      Academic Year: {yr}
                    </h3>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', background: '#f8fafc', padding: '4px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {filterCategory === 'All' ? 'Showing All Records' : `${filterCategory} Champions Only`}
                    </span>
                  </div>

                  {/* Podium Grid Layout */}
                  <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'flex-end', flexWrap: 'wrap', padding: '16px 0' }}>
                    {podiumOrdered.map((champ) => {
                      const themeClass = champ.rank === 1 ? 'theme-gold' : champ.rank === 2 ? 'theme-platinum' : champ.rank === 3 ? 'theme-silver' : 'theme-default';
                      const isCenter = champ.rank === 1;

                      return (
                        <div
                          key={champ.id}
                          className={`champion-card ${themeClass}`}
                          style={{
                            flex: '1 1 260px',
                            maxWidth: '310px',
                            padding: '24px 20px',
                            position: 'relative'
                          }}
                        >
                          <div className="card-top-row">
                            <div className="medal-badge">
                              <div className="medal-circle">{champ.rank === 1 ? '👑' : champ.rank === 2 ? '🥈' : champ.rank === 3 ? '🥉' : champ.rank}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                background: (champ.category || 'UG').toUpperCase() === 'PG' ? '#f3e8ff' : '#e0f2fe',
                                color: (champ.category || 'UG').toUpperCase() === 'PG' ? '#7e22ce' : '#0369a1',
                                border: `1px solid ${(champ.category || 'UG').toUpperCase() === 'PG' ? '#d8b4fe' : '#bae6fd'}`
                              }}>
                                {(champ.category || 'UG').toUpperCase()}
                              </span>
                              <div className="rank-pill">
                                {champ.rankLabel}
                              </div>
                            </div>
                          </div>

                          <div className="champion-avatar-frame">
                            <img
                              src={champ.image?.startsWith('http') ? champ.image : (champ.image?.startsWith('/') ? `http://localhost:8000${champ.image}` : `http://localhost:8000${champ.image}`)}
                              alt={champ.teamName}
                              className="champion-avatar-img"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/130?text=Champion'; }}
                            />
                          </div>

                          <h3 className="champion-team-name">{champ.teamName}</h3>
                          <div className="champion-event-name">{champ.eventName || champ.institution || 'Marian Excellence Competition'}</div>

                          <div className="champion-score-row">
                            <span className="star-icon">★</span>
                            <span>{champ.score}</span>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>pts</span>
                          </div>

                          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                              🏫 {champ.institution || 'Marian College'}
                            </span>

                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 700 }}
                              onClick={() => champ.id && setDeleteChampIdModal(champ.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Delete Champion Custom Modal */}
      <CustomModal
        isOpen={deleteChampIdModal !== null}
        onClose={() => setDeleteChampIdModal(null)}
        title="Delete Champion"
        icon="🏆"
        description="Are you sure you want to delete this champion record? This action cannot be undone."
        confirmText="Delete Champion"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteChampIdModal !== null) {
            confirmDeleteChamp(deleteChampIdModal);
          }
        }}
      />
    </div>
  );
}
