import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Users, 
  QrCode, 
  Plus, 
  Lock, 
  CheckCircle2, 
  Settings, 
  Copy, 
  Trash2, 
  Shuffle, 
  Globe, 
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Trophy,
  Download,
  Activity,
  Layers,
  Volleyball,
  Dumbbell
} from 'lucide-react';

const DEFAULT_SPORTS = [
  { id: 'volleyball', name: 'Volleyball', limit: 32 },
  { id: 'basketball', name: 'Basketball', limit: 12 },
  { id: 'egggame', name: 'Egg Game', limit: 30 },
  { id: 'savethewater', name: 'Save the Water', limit: 30 },
  { id: 'game3in1', name: '3-1 Game', limit: 32 }
];

export default function App() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('sports_game_sessions');
    return saved ? JSON.parse(saved) : [{
      id: 'sess-1',
      title: 'Campus Games - Session 1',
      isOpen: true,
      students: [],
      teams: [],
      sportsLimits: DEFAULT_SPORTS.map(s => ({ ...s })),
      createdAt: new Date().toISOString()
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    return localStorage.getItem('sports_active_session_id') || 'sess-1';
  });

  const [viewMode, setViewMode] = useState('organizer');
  const [hostDomain, setHostDomain] = useState(() => {
    return window.location.origin + window.location.pathname;
  });

  // Student Form State
  const [studentName, setStudentName] = useState('');
  const [studentMajor, setStudentMajor] = useState('');
  const [selectedSport, setSelectedSport] = useState('volleyball');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Organizer Session Creation State
  const [newTitle, setNewTitle] = useState('');

  // QR Code State
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('sports_game_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('sports_active_session_id', activeSessionId);
  }, [activeSessionId]);

  // Handle URL Parameters for Scanner Navigation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get('session');
    const viewFromUrl = params.get('view') || params.get('portal');

    if (sessionFromUrl) {
      setActiveSessionId(sessionFromUrl);
    }
    if (viewFromUrl === 'student') {
      setViewMode('student');
    }
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // Compute overall registered count & overall limit
  const totalRegistered = activeSession ? activeSession.students.length : 0;
  const overallLimit = activeSession ? activeSession.sportsLimits.reduce((acc, curr) => acc + curr.limit, 0) : 136;

  // Helper to count registrations per sport
  const getSportCount = (sportId) => {
    if (!activeSession) return 0;
    return activeSession.students.filter(st => st.sportId === sportId).length;
  };

  // Generate QR Code
  useEffect(() => {
    if (activeSession) {
      const cleanBase = hostDomain.replace(/\/+$/, '');
      const studentUrl = `${cleanBase}?session=${activeSession.id}&portal=student`;
      
      QRCode.toDataURL(studentUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0A192F',
          light: '#FFFFFF'
        }
      })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error(err));
    }
  }, [activeSession, hostDomain]);

  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newSess = {
      id: 'sess-' + Date.now(),
      title: newTitle.trim(),
      isOpen: true,
      students: [],
      teams: [],
      sportsLimits: DEFAULT_SPORTS.map(s => ({ ...s })),
      createdAt: new Date().toISOString()
    };

    setSessions([newSess, ...sessions]);
    setActiveSessionId(newSess.id);
    setNewTitle('');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setRegisterError('');

    if (!studentName.trim() || !studentMajor.trim()) {
      setRegisterError('Please enter both your full name and major.');
      return;
    }

    if (!activeSession.isOpen) {
      setRegisterError('Registration for this event is currently closed.');
      return;
    }

    const currentSport = activeSession.sportsLimits.find(s => s.id === selectedSport);
    const countInSport = getSportCount(selectedSport);

    if (currentSport && countInSport >= currentSport.limit) {
      setRegisterError(`The ${currentSport.name} category is full (${currentSport.limit}/${currentSport.limit} slots filled). Please select another sport.`);
      return;
    }

    const newStudent = {
      id: 'std-' + Date.now(),
      name: studentName.trim(),
      major: studentMajor.trim(),
      sportId: selectedSport,
      sportName: currentSport ? currentSport.name : selectedSport,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedStudents = [...activeSession.students, newStudent];
    
    // Check if ALL sports are now full
    const isAllFull = activeSession.sportsLimits.every(s => {
      const cnt = updatedStudents.filter(st => st.sportId === s.id).length;
      return cnt >= s.limit;
    });

    setSessions(sessions.map(s => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          students: updatedStudents,
          isOpen: isAllFull ? false : s.isOpen
        };
      }
      return s;
    }));

    setRegisterSuccess(true);
    setStudentName('');
    setStudentMajor('');
  };

  const handleToggleSessionStatus = (id) => {
    setSessions(sessions.map(s => {
      if (s.id === id) {
        return { ...s, isOpen: !s.isOpen };
      }
      return s;
    }));
  };

  const handleDeleteSession = (id) => {
    if (sessions.length === 1) {
      alert("You must keep at least one event session.");
      return;
    }
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleSplitTeams = (numTeams) => {
    if (activeSession.students.length === 0) return;

    const shuffled = [...activeSession.students].sort(() => 0.5 - Math.random());
    const newTeams = Array.from({ length: numTeams }, (_, i) => ({
      name: `Team ${i + 1}`,
      members: []
    }));

    shuffled.forEach((student, index) => {
      newTeams[index % numTeams].members.push(student);
    });

    setSessions(sessions.map(s => {
      if (s.id === activeSession.id) {
        return { ...s, teams: newTeams };
      }
      return s;
    }));
  };

  const exportCSV = () => {
    if (activeSession.students.length === 0) return;
    let csv = 'ID,Name,Major,Sport,Registered Time\n';
    activeSession.students.forEach((st, idx) => {
      csv += `"${idx + 1}","${st.name}","${st.major}","${st.sportName}","${st.time}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSession.title.replace(/\s+/g, '_')}_students.csv`;
    a.click();
  };

  const currentStudentDirectUrl = `${hostDomain.replace(/\/+$/, '')}?session=${activeSession?.id}&portal=student`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-[#0A192F] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/20">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Campus Games Portal</h1>
              <p className="text-xs text-blue-200">Sports Check-In & Team Management</p>
            </div>
          </div>

          <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-xs font-medium">
            <button
              onClick={() => setViewMode('organizer')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'organizer' 
                  ? 'bg-white text-[#0A192F] font-semibold shadow-sm' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Organizer Dashboard
            </button>
            <button
              onClick={() => setViewMode('student')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'student' 
                  ? 'bg-white text-[#0A192F] font-semibold shadow-sm' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Student Portal
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">

        {/* ORGANIZER VIEW */}
        {viewMode === 'organizer' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Session Manager & Team Splitter */}
            <div className="space-y-6">

              {/* Sessions List */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-[#0A192F] flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-500" /> Event Sessions
                  </h2>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                    {sessions.length} Session(s)
                  </span>
                </div>

                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-1">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setActiveSessionId(s.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                        activeSessionId === s.id
                          ? 'border-[#0A192F] bg-blue-50/50 ring-1 ring-[#0A192F]'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#0A192F]">{s.title}</p>
                        <p className="text-xs text-slate-500">
                          {s.students.length} / {overallLimit} Players
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          !s.isOpen || s.students.length >= overallLimit
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {s.students.length >= overallLimit ? 'FULL' : s.isOpen ? 'OPEN' : 'CLOSED'}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(s.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create New Session */}
                <form onSubmit={handleCreateSession} className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Create Next Game Event
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Session Title (e.g. Day 2 Tournament)"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-[#0A192F] hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Create New Registration Session
                    </button>
                  </div>
                </form>
              </div>

              {/* Team Splitter */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-base font-bold text-[#0A192F] flex items-center gap-2 mb-2">
                  <Shuffle className="w-4 h-4 text-slate-500" /> Auto Team Splitter
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Randomly divide all registered students into balanced teams.
                </p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => handleSplitTeams(count)}
                      disabled={activeSession.students.length === 0}
                      className="py-2 px-3 border border-slate-200 hover:border-[#0A192F] hover:bg-slate-50 disabled:opacity-50 text-[#0A192F] font-bold text-xs rounded-lg transition-colors"
                    >
                      {count} Teams
                    </button>
                  ))}
                </div>

                {/* Display Teams */}
                {activeSession.teams && activeSession.teams.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 max-h-60 overflow-y-auto">
                    {activeSession.teams.map((t, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <p className="font-bold text-xs text-[#0A192F] mb-1">
                          {t.name} ({t.members.length} Players)
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {t.members.map((m) => (
                            <span key={m.id} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                              {m.name} ({m.sportName})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Middle & Right Column */}
            <div className="lg:col-span-2 space-y-6">

              {/* QR Code & Direct Scan Section */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="Scan QR Code" className="w-52 h-52 object-contain" />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                      Generating QR Code...
                    </div>
                  )}
                  <p className="text-xs font-semibold text-[#0A192F] mt-2">Scan to Register Directly</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs bg-blue-100 text-[#0A192F] font-bold px-2.5 py-0.5 rounded-full">
                      Active Event
                    </span>
                    <h3 className="text-lg font-bold text-[#0A192F] mt-1">{activeSession.title}</h3>
                    <p className="text-xs text-slate-500">
                      Scanning directs students straight to the check-in form with no third-party app redirects.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      Direct Student Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={currentStudentDirectUrl}
                        className="flex-1 bg-slate-50 text-slate-600 px-3 py-1.5 text-xs rounded-md border border-slate-200 font-mono"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentStudentDirectUrl);
                          alert('Direct Student Link Copied!');
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Vercel / Custom Domain Configurator */}
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-blue-500" /> Vercel Live Domain URL
                    </label>
                    <input
                      type="text"
                      value={hostDomain}
                      onChange={(e) => setHostDomain(e.target.value)}
                      placeholder="e.g. https://your-app.vercel.app"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0A192F]"
                    />
                    <p className="text-[10px] text-slate-400">
                      Set this to your live Vercel URL so the generated QR code works everywhere.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleToggleSessionStatus(activeSession.id)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        activeSession.isOpen
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {activeSession.isOpen ? 'Lock Registration' : 'Re-Open Registration'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sports Capacity Overview */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-[#0A192F] mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" /> Sports & Game Slots Availability
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {activeSession.sportsLimits.map((sp) => {
                    const count = getSportCount(sp.id);
                    const isFull = count >= sp.limit;
                    return (
                      <div key={sp.id} className={`p-3 rounded-lg border text-center ${
                        isFull ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <p className="text-xs font-bold text-[#0A192F] truncate">{sp.name}</p>
                        <p className={`text-sm font-extrabold mt-1 ${isFull ? 'text-rose-600' : 'text-[#0A192F]'}`}>
                          {count} / {sp.limit}
                        </p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          isFull ? 'bg-rose-200 text-rose-800' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isFull ? 'FULL' : 'OPEN'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Registered Student Table */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-[#0A192F] flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-emerald-600" /> Registered Students
                    </h2>
                    <p className="text-xs text-slate-500">
                      Total: {totalRegistered} / {overallLimit} Total Slots
                    </p>
                  </div>

                  <button
                    onClick={exportCSV}
                    disabled={activeSession.students.length === 0}
                    className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>

                {activeSession.students.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">No students registered yet.</p>
                    <p className="text-[11px] text-slate-400">Scan the QR code to begin student check-ins.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider bg-slate-50">
                          <th className="p-3 font-bold">#</th>
                          <th className="p-3 font-bold">Student Name</th>
                          <th className="p-3 font-bold">Major</th>
                          <th className="p-3 font-bold">Selected Sport</th>
                          <th className="p-3 font-bold text-right">Time Registered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeSession.students.map((st, idx) => (
                          <tr key={st.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-[#0A192F]">{st.name}</td>
                            <td className="p-3 text-slate-600">{st.major}</td>
                            <td className="p-3">
                              <span className="bg-blue-50 text-[#0A192F] border border-blue-200 font-bold px-2 py-0.5 rounded text-[10px]">
                                {st.sportName}
                              </span>
                            </td>
                            <td className="p-3 text-right text-slate-400">{st.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* STUDENT VIEW */}
        {viewMode === 'student' && (
          <div className="max-w-md mx-auto w-full py-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              
              {/* Card Banner */}
              <div className="bg-[#0A192F] text-white p-6 text-center">
                <span className="text-[10px] bg-white/20 text-blue-200 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
                  Student Game Registration
                </span>
                <h2 className="text-xl font-bold mt-2">{activeSession.title}</h2>
                <p className="text-xs text-blue-200 mt-1">
                  Total Spots Taken: {totalRegistered} / {overallLimit}
                </p>
              </div>

              <div className="p-6">
                {/* Case 1: Registration Success */}
                {registerSuccess ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0A192F]">You are Registered!</h3>
                    <p className="text-xs text-slate-500">
                      Your sport check-in has been saved. Please await further instructions from your event organizer.
                    </p>
                    <button
                      onClick={() => setRegisterSuccess(false)}
                      className="mt-4 text-xs font-semibold text-[#0A192F] underline hover:text-slate-600"
                    >
                      Register another student
                    </button>
                  </div>
                ) : !activeSession.isOpen ? (
                  /* Case 2: Registration Closed */
                  <div className="text-center py-8 space-y-3">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-rose-900">Registration Closed</h3>
                    <p className="text-xs text-slate-600">
                      Registration for this game event is currently closed by the organizer.
                    </p>

                    <div className="pt-4 border-t border-slate-100 text-left">
                      <h4 className="text-xs font-bold text-[#0A192F] mb-2">Registered Attendees ({activeSession.students.length})</h4>
                      <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {activeSession.students.map((st, i) => (
                          <div key={st.id} className="text-xs flex justify-between text-slate-700 py-1 border-b border-slate-100 last:border-0">
                            <span className="font-medium">{i + 1}. {st.name} ({st.major})</span>
                            <span className="text-[#0A192F] font-bold text-[11px]">{st.sportName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Case 3: Registration Form */
                  <form onSubmit={handleRegister} className="space-y-4">
                    {registerError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{registerError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Johnson"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Major / Field of Study <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={studentMajor}
                        onChange={(e) => setStudentMajor(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Select Sport / Game Category <span className="text-rose-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {activeSession.sportsLimits.map((sp) => {
                          const count = getSportCount(sp.id);
                          const isFull = count >= sp.limit;
                          return (
                            <label
                              key={sp.id}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                isFull 
                                  ? 'opacity-60 bg-slate-100 border-slate-200 cursor-not-allowed'
                                  : selectedSport === sp.id
                                    ? 'border-[#0A192F] bg-blue-50/60 ring-1 ring-[#0A192F]'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="sport"
                                  value={sp.id}
                                  disabled={isFull}
                                  checked={selectedSport === sp.id}
                                  onChange={() => setSelectedSport(sp.id)}
                                  className="accent-[#0A192F]"
                                />
                                <span className="text-xs font-bold text-[#0A192F]">{sp.name}</span>
                              </div>

                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                isFull ? 'bg-rose-200 text-rose-800' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {count} / {sp.limit} {isFull ? 'FULL' : 'Slots'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#0A192F] hover:bg-slate-800 text-white font-bold py-3 rounded-lg text-sm shadow-md transition-colors"
                    >
                      Complete Registration
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
