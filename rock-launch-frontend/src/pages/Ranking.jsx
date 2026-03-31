import React, { useState, useEffect } from 'react';
import axios, { BASE_API_URL } from '../api';

const CountUp = ({ value, suffix = '', decimals = 2 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const targetValue = parseFloat(value) || 0;

  useEffect(() => {
    let startTimestamp = null;
    const startValue = displayValue;
    const duration = 2000; // 2 seconds to count

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (targetValue - startValue) * easedProgress;
      setDisplayValue(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [targetValue]);

  return <span>{displayValue.toFixed(decimals)}{suffix}</span>;
};

const Ranking = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [simStep, setSimStep] = useState(0);
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  const fetchStats = async () => {
    if (isSimulating) return;
    try {
      const res = await axios.get('admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const startSimulation = async () => {
    try {
      setLoading(true);
      const res = await axios.get('admin/stats-history');
      setSimulationData(res.data);
      setIsSimulating(true);
      setSimStep(0);
      setLoading(false);
    } catch (err) {
      alert("Error cargando historial");
      setLoading(false);
    }
  };

  const calculateSimulatedStats = (votes, depts, presenters) => {
    const weightJ = 0.7;
    const weightP = 0.3;
    const deptStats = {};
    const presenterStats = {};

    votes.forEach((row) => {
      const deptId = Number(row.department_id);
      const type = row.user_type;
      const scores = typeof row.criteria_scores === 'string' ? JSON.parse(row.criteria_scores) : row.criteria_scores;
      const pScores = typeof row.presenter_scores === 'string' ? JSON.parse(row.presenter_scores) : row.presenter_scores;

      if (!deptStats[deptId]) {
        deptStats[deptId] = {
          jury: { criteriaSum: { attitude: 0, creativity: 0, clarity: 0, impact: 0 }, count: 0 },
          public: { criteriaSum: { attitude: 0, creativity: 0, clarity: 0, impact: 0 }, count: 0 }
        };
      }

      const dTarg = type === 'JURY' ? deptStats[deptId].jury : deptStats[deptId].public;
      dTarg.count++;
      for (const key in scores || {}) {
        dTarg.criteriaSum[key] = (dTarg.criteriaSum[key] || 0) + Number(scores[key] || 0);
      }

      for (const [pId, score] of Object.entries(pScores || {})) {
        const pIdNum = Number(pId);
        if (!presenterStats[pIdNum]) {
          presenterStats[pIdNum] = { jury: { sum: 0, count: 0 }, public: { sum: 0, count: 0 } };
        }
        const pTarg = type === 'JURY' ? presenterStats[pIdNum].jury : presenterStats[pIdNum].public;
        pTarg.sum += Number(score || 0);
        pTarg.count++;
      }
    });

    return depts.map(dept => {
      const dId = Number(dept.id);
      const dData = deptStats[dId] || {
        jury: { criteriaSum: { attitude: 0, creativity: 0, clarity: 0, impact: 0 }, count: 0 },
        public: { criteriaSum: { attitude: 0, creativity: 0, clarity: 0, impact: 0 }, count: 0 }
      };

      const processGroup = (group) => {
        if (group.count === 0) return { score: 0, count: 0 };
        let totalC = 0, cCount = 0;
        for (const k in group.criteriaSum) { totalC += group.criteriaSum[k]; cCount++; }
        const avg = totalC / (group.count * (cCount || 4));
        return { score: (avg / 5) * 100, count: group.count };
      };

      const juryDept = processGroup(dData.jury);
      const pubDept = processGroup(dData.public);
      const deptPres = presenters.filter(p => Number(p.department_id) === dId);

      let tAvgJ = 0, tAvgP = 0;
      let pRes = [];

      deptPres.forEach(p => {
        const pData = presenterStats[p.id] || { jury: { sum: 0, count: 0 }, public: { sum: 0, count: 0 } };
        const avgJ = pData.jury.count > 0 ? pData.jury.sum / pData.jury.count : 0;
        const avgP = pData.public.count > 0 ? pData.public.sum / pData.public.count : 0;
        tAvgJ += avgJ; tAvgP += avgP;

        let combined = 0;
        if (pData.jury.count > 0 && pData.public.count > 0) combined = (avgJ * weightJ) + (avgP * weightP);
        else if (pData.jury.count > 0) combined = avgJ;
        else if (pData.public.count > 0) combined = avgP;

        pRes.push({ ...p, combinedScore: combined.toFixed(2), juryCount: pData.jury.count, publicCount: pData.public.count });
      });

      const avgPresJ = deptPres.length > 0 ? tAvgJ / deptPres.length : 0;
      const avgPresP = deptPres.length > 0 ? tAvgP / deptPres.length : 0;
      const juryFinal = (juryDept.score + (avgPresJ / 10 * 100)) / 2;
      const pubFinal = (pubDept.score + (avgPresP / 10 * 100)) / 2;

      let final = 0;
      if (juryDept.count > 0 && pubDept.count > 0) final = (juryFinal * weightJ) + (pubFinal * weightP);
      else if (juryDept.count > 0) final = juryFinal;
      else if (pubDept.count > 0) final = pubFinal;

      return {
        department_id: dId, name: dept.name, presenters: pRes, final_score: final.toFixed(2),
        meta: { votesJury: juryDept.count, votesPublic: pubDept.count }
      };
    }).sort((a, b) => Number(b.final_score) - Number(a.final_score));
  };

  useEffect(() => {
    if (isSimulating && simulationData && simStep < simulationData.votes.length) {
      const timer = setTimeout(() => {
        setSimStep(prev => prev + 1);
      }, 1500); // 1.5 seconds per vote batch
      return () => clearTimeout(timer);
    }
  }, [isSimulating, simStep, simulationData]);

  const isStarted = isSimulating || simStep > 0;

  const displayStats = isStarted && simulationData
    ? calculateSimulatedStats(simulationData.votes.slice(0, simStep), simulationData.depts, simulationData.presenters)
    : (isSimulating ? stats : [...stats].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(dept => ({
      ...dept,
      final_score: 0,
      presenters: (dept.presenters || []).map(p => ({ ...p, combinedScore: 0 }))
    })));

  if (loading) return <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <div style={{ color: '#ffd700', fontSize: '1.5rem', fontWeight: '800', letterSpacing: '2px' }}>PREPARANDO RANKING...</div>
  </div>;

  const presenterRanking = displayStats
    .flatMap(dept => (dept.presenters || []).map(p => ({ ...p, deptName: dept.name })))
    .sort((a, b) => {
      if (!isStarted) return (a.name || '').localeCompare(b.name || '');
      return parseFloat(b.combinedScore) - parseFloat(a.combinedScore);
    });

  return (
    <div className="container" style={{ paddingBottom: '4rem', maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '5rem', alignItems: 'center' }}>
        <h1 className="ultra-ranking-title">ROCK LAUNCH 2025</h1>
        {!isSimulating ? (
          <button className="btn-racing-ultra" onClick={startSimulation}>Empezar Resultados 🚀</button>
        ) : (
          <button className="btn-racing-stop-ultra" onClick={() => setIsSimulating(false)}>Pausar</button>
        )}
      </div>

      <div className="racing-layout-ultra">
        {/* DEPARTMENTS RACING CHART */}
        <div className="racing-side">
          <h2 className="side-title" style={{ color: '#ffd700', textShadow: '0 0 20px rgba(255, 215, 0, 0.4)' }}>Ranking Departamentos</h2>
          <div className="side-canvas" style={{ height: `${displayStats.length * 64}px` }}>
            {displayStats.map((dept, index) => (
              <div key={dept.department_id} className="item-row" style={{ transform: `translateY(${index * 64}px)` }}>
                <div className="item-num">{index + 1}</div>
                <div className="item-label">{dept.name}</div>
                <div className="item-bar-track">
                  <div className="item-bar-fill gold-glow" style={{ width: `${dept.final_score}%` }}></div>
                  <div className="item-score-text">
                    <CountUp value={dept.final_score} suffix="%" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRESENTERS RACING CHART */}
        <div className="racing-side">
          <h2 className="side-title" style={{ color: '#0ea5e9', textShadow: '0 0 20px rgba(14, 165, 233, 0.4)' }}>Ranking Representantes</h2>
          <div className="side-canvas" style={{ height: `${Math.min(presenterRanking.length, 10) * 64}px` }}>
            {presenterRanking.slice(0, 10).map((pres, index) => (
              <div key={pres.id} className="item-row" style={{ transform: `translateY(${index * 64}px)` }}>
                <div className="item-num" style={{ color: '#0ea5e9' }}>{index + 1}</div>
                <div className="item-label">
                  <div style={{ fontWeight: '900' }}>{pres.name}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>{pres.deptName}</div>
                </div>
                <div className="item-bar-track">
                    <div className="item-bar-fill blue-glow" style={{ width: `${parseFloat(pres.combinedScore) * 10}%` }}>
                    {pres.photo_url && (
                      <div className="item-avatar-ring presenter-photo-container" onClick={() => setZoomedPhoto({ ...pres, photo: pres.photo_url })}>
                        <img src={pres.photo_url.startsWith('data:') ? pres.photo_url : `${BASE_API_URL}${pres.photo_url}`} alt="" />
                      </div>
                    )}
                  </div>
                  <div className="item-score-text">
                    <CountUp value={pres.combinedScore} decimals={1} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .ultra-ranking-title {
          margin: 0;
          font-size: 4.5rem;
          font-weight: 900;
          color: #fff;
          letter-spacing: -4px;
          text-shadow: 0 10px 40px rgba(0,0,0,0.8);
          background: linear-gradient(180deg, #fff 30%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .racing-layout-ultra {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
        }

        .racing-side {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(40px);
          border-radius: 30px;
          padding: 3.5rem 2.5rem;
          box-shadow: 0 30px 100px -20px rgba(0, 0, 0, 0.8);
        }

        .side-title {
          font-size: 1.8rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 6px;
          margin-bottom: 4rem;
          text-align: center;
        }

        .side-canvas {
          position: relative;
          width: 100%;
        }

        .item-row {
          position: absolute;
          left: 0;
          right: 0;
          height: 52px;
          display: flex;
          align-items: center;
          gap: 1.2rem;
          transition: transform 1.8s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .item-num {
          width: 30px;
          font-size: 1.2rem;
          font-weight: 900;
          color: #ffd700;
          opacity: 0.6;
          text-align: center;
        }

        .item-label {
          width: 180px;
          text-align: right;
          font-weight: 800;
          color: #f8fafc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: flex;
          flex-direction: column;
          line-height: 1.1;
          font-size: 1.05rem;
        }

        .item-bar-track {
          flex: 1;
          display: flex;
          align-items: center;
          padding-right: 90px;
          height: 42px;
          position: relative;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }

        .item-bar-fill {
          height: 34px;
          border-radius: 6px;
          transition: width 2s cubic-bezier(0.23, 1, 0.32, 1);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-width: 8px;
          position: relative;
        }

        .gold-glow {
          background: linear-gradient(90deg, #b8860b, #ffd700);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }

        .blue-glow {
          background: linear-gradient(90deg, #075985, #0ea5e9);
          box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
        }

        .item-score-text {
          position: absolute;
          left: calc(100% - 80px);
          width: 80px;
          font-size: 1.4rem;
          font-weight: 900;
          color: #fff;
          text-align: left;
          font-variant-numeric: tabular-nums;
          margin-left: 2rem;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }

        .item-avatar-ring {
          position: absolute;
          right: -24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 3px solid #fff;
          box-shadow: 0 10px 20px rgba(0,0,0,0.6);
          background: #0f172a;
          overflow: hidden;
          z-index: 10;
        }

        .item-avatar-ring img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .btn-racing-ultra {
          background: linear-gradient(135deg, #ffd700 0%, #daa520 100%);
          color: #000;
          border: none;
          padding: 1.2rem 3.5rem;
          border-radius: 100px;
          font-weight: 950;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 20px 40px rgba(212, 175, 55, 0.4);
          text-transform: uppercase;
          letter-spacing: 3px;
        }

        .btn-racing-ultra:hover {
          transform: translateY(-8px) scale(1.05);
          box-shadow: 0 30px 60px rgba(212, 175, 55, 0.6);
        }

        .btn-racing-stop-ultra {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 1.2rem 3.5rem;
          border-radius: 100px;
          font-weight: 950;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 3px;
        }

        .btn-racing-stop-ultra:hover {
          background: #f43f5e;
          border-color: #f43f5e;
          box-shadow: 0 0 30px rgba(244, 63, 94, 0.5);
        }
      `}</style>

      {/* Photo Zoom Modal */}
      {zoomedPhoto && (
        <div className="image-zoom-overlay" onClick={() => setZoomedPhoto(null)}>
          <div className="image-zoom-content">
            <img src={`${BASE_API_URL}${zoomedPhoto.photo}`} alt={zoomedPhoto.name} />
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <h2 style={{ margin: 0 }}>{zoomedPhoto.name}</h2>
              <p style={{ color: '#0ea5e9', margin: '5px 0 0' }}>Representante</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ranking;
