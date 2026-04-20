// frontend/src/pages/SeatingPage.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MapPin, Wand2, Printer, Download, Users, BookOpen } from 'lucide-react';
import api from '../services/api';
import { selectUserRole } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const MOCK_EXAMS = [
  { id:'1', name:'Unit Test 3', startDate:'2024-11-10' },
  { id:'2', name:'Half Yearly Exam', startDate:'2024-12-01' },
];
const MOCK_CLASSES = [
  { id:'1', name:'10', section:'A' }, { id:'2', name:'10', section:'B' },
  { id:'3', name:'11', section:'Science' }, { id:'4', name:'12', section:'Commerce' },
];
// Mock seating grid
const generateMockGrid = (rows, cols) => {
  const names = ['Aarav S','Priya P','Rohan V','Sneha G','Arjun S','Kavya M','Dev J','Ananya R','Varun N','Ishaan R','Diya M','Karan K','Riya A','Aditya B','Pooja I','Rahul T','Anjali K','Vikram S','Neha R','Amit D'];
  let idx = 0;
  return Array.from({length:rows}, (_, r) =>
    Array.from({length:cols}, (_, c) => {
      if (idx >= names.length) return null;
      return { name:names[idx], roll_no:String(++idx).padStart(2,'0'), seat:`${String.fromCharCode(65+r)}${c+1}`, class_name:'10-A' };
    })
  );
};

export default function SeatingPage() {
  const role = useSelector(selectUserRole);
  const canGenerate = ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER'].includes(role);

  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [strategy, setStrategy] = useState('roll_number');
  const [rooms, setRooms] = useState([{ room_no:'101', rows:5, cols:6, capacity:30 }]);
  const [arrangement, setArrangement] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(0);

  useEffect(() => {
    api.get('/exams').then(r=>setExams(r.data.data||[])).catch(()=>setExams(MOCK_EXAMS));
    api.get('/classes').then(r=>setClasses(r.data.data||[])).catch(()=>setClasses(MOCK_CLASSES));
  }, []);

  const toggleClass = (id) => setSelectedClasses(prev => prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const updateRoom = (i, field, val) => setRooms(prev=>prev.map((r,ri)=>ri===i?{...r,[field]:val}:r));
  const addRoom = () => setRooms(prev=>[...prev,{room_no:`10${prev.length+1}`,rows:5,cols:6,capacity:30}]);
  const removeRoom = (i) => setRooms(prev=>prev.filter((_,ri)=>ri!==i));

  const generate = async () => {
    if (!selectedExam) return toast.error('Select an exam');
    if (selectedClasses.length===0) return toast.error('Select at least one class');
    setGenerating(true);
    try {
      const res = await api.post(`/exams/${selectedExam}/seating`, { rooms, classIds:selectedClasses, strategy });
      setArrangement(res.data.data);
      toast.success('Seating arrangement generated!');
    } catch {
      // Demo fallback
      setArrangement({ arrangements:[{ room_no:rooms[0].room_no, rows:rooms[0].rows, cols:rooms[0].cols, students_seated:20, arrangement:generateMockGrid(rooms[0].rows,rooms[0].cols) }], total_students:20, seated:20 });
      toast.success('Seating generated (demo mode)');
    } finally { setGenerating(false); }
  };

  const currentArrangement = arrangement?.arrangements?.[selectedRoom];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header">
        <div><h1 className="section-title">Seating Arrangement</h1><p className="text-sm text-slate-400">AI-powered exam seating</p></div>
        {arrangement && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={()=>window.print()}><Printer className="w-4 h-4"/>Print</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Config panel */}
        <div className="space-y-4">
          <div className="card p-5">
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Configuration</p>
            <div className="space-y-4">
              <div>
                <label className="label">Exam *</label>
                <select className="input" value={selectedExam} onChange={e=>setSelectedExam(e.target.value)}>
                  <option value="">Select exam</option>
                  {exams.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Classes *</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {classes.map(c=>(
                    <button key={c.id} onClick={()=>toggleClass(c.id)}
                      className={clsx('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-base',
                        selectedClasses.includes(c.id)?'bg-primary-600 text-white border-primary-600':'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300')}>
                      {c.name}-{c.section}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Seating Strategy</label>
                <select className="input" value={strategy} onChange={e=>setStrategy(e.target.value)}>
                  <option value="roll_number">Roll Number Order</option>
                  <option value="random">Random</option>
                  <option value="interleaved_class">Interleaved (mixed classes)</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">Interleaved mixes students from different classes to prevent copying.</p>
              </div>
            </div>
          </div>

          {/* Room config */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-slate-700 dark:text-slate-200">Rooms</p>
              <button onClick={addRoom} className="btn-ghost text-xs">+ Add Room</button>
            </div>
            <div className="space-y-4">
              {rooms.map((room,i)=>(
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Room {i+1}</p>
                    {rooms.length>1&&<button onClick={()=>removeRoom(i)} className="text-xs text-red-500 hover:underline">Remove</button>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="label text-[10px]">Room No</label><input className="input text-xs py-1.5" value={room.room_no} onChange={e=>updateRoom(i,'room_no',e.target.value)}/></div>
                    <div><label className="label text-[10px]">Capacity</label><input type="number" className="input text-xs py-1.5" value={room.capacity} onChange={e=>updateRoom(i,'capacity',Number(e.target.value))}/></div>
                    <div><label className="label text-[10px]">Rows</label><input type="number" className="input text-xs py-1.5" min={1} max={15} value={room.rows} onChange={e=>updateRoom(i,'rows',Number(e.target.value))}/></div>
                    <div><label className="label text-[10px]">Columns</label><input type="number" className="input text-xs py-1.5" min={1} max={15} value={room.cols} onChange={e=>updateRoom(i,'cols',Number(e.target.value))}/></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={generating} className="btn-primary w-full justify-center py-3">
            {generating?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Generating...</>
              :<><Wand2 className="w-4 h-4"/>Generate Seating</>}
          </button>
        </div>

        {/* Seating grid */}
        <div className="lg:col-span-2">
          {!arrangement ? (
            <div className="card p-16 flex flex-col items-center justify-center gap-4 h-full">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-slate-300"/>
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-slate-600 dark:text-slate-300">No arrangement yet</p>
                <p className="text-sm text-slate-400 mt-1">Configure and generate seating on the left</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Room tabs */}
              {arrangement.arrangements?.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {arrangement.arrangements.map((a,i)=>(
                    <button key={i} onClick={()=>setSelectedRoom(i)}
                      className={clsx('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-base',
                        selectedRoom===i?'bg-primary-600 text-white border-primary-600':'border-slate-200 dark:border-slate-700 text-slate-500')}>
                      Room {a.room_no} ({a.students_seated} students)
                    </button>
                  ))}
                </div>
              )}

              {/* Stats */}
              {currentArrangement && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="card p-3 text-center"><p className="text-xl font-bold text-primary-600">{currentArrangement.students_seated}</p><p className="text-xs text-slate-400">Seated</p></div>
                  <div className="card p-3 text-center"><p className="text-xl font-bold text-slate-800 dark:text-white">{currentArrangement.rows}×{currentArrangement.cols}</p><p className="text-xs text-slate-400">Grid</p></div>
                  <div className="card p-3 text-center"><p className="text-xl font-bold text-green-600">Room {currentArrangement.room_no}</p><p className="text-xs text-slate-400">Location</p></div>
                </div>
              )}

              {/* Grid visual */}
              {currentArrangement?.arrangement && (
                <div className="card p-5 overflow-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-primary-500"/>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Room {currentArrangement.room_no} — Seating Map</p>
                  </div>

                  {/* Column headers */}
                  <div className="inline-block min-w-full">
                    <div className="flex gap-1 mb-1 ml-8">
                      {Array.from({length:currentArrangement.cols},(_,i)=>(
                        <div key={i} className="w-20 text-center text-xs font-bold text-slate-400">Col {i+1}</div>
                      ))}
                    </div>
                    {currentArrangement.arrangement.map((row,ri)=>(
                      <div key={ri} className="flex gap-1 mb-1 items-center">
                        <div className="w-8 text-center text-xs font-bold text-slate-400">{String.fromCharCode(65+ri)}</div>
                        {row.map((seat,ci)=>(
                          <div key={ci} className={clsx('w-20 h-14 rounded-xl flex flex-col items-center justify-center p-1 border text-center transition-base',
                            seat ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700/50 hover:bg-primary-100 dark:hover:bg-primary-900/50' : 'bg-slate-50 dark:bg-slate-700/20 border-slate-100 dark:border-slate-700/30')}>
                            {seat ? (
                              <>
                                <p className="text-[9px] font-bold text-primary-700 dark:text-primary-400 truncate w-full text-center">{seat.name}</p>
                                <p className="text-[9px] text-slate-500 font-mono">{seat.roll_no}</p>
                                <p className="text-[8px] text-slate-400">{seat.seat}</p>
                              </>
                            ) : (
                              <p className="text-[10px] text-slate-300 dark:text-slate-600">Empty</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Board indicator */}
                  <div className="mt-4 w-full h-3 bg-slate-800 dark:bg-slate-600 rounded-full flex items-center justify-center">
                    <p className="text-white text-[8px] font-semibold tracking-widest">BOARD</p>
                  </div>
                </div>
              )}

              {/* Print list */}
              {currentArrangement?.arrangement && (
                <div className="card overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/50">
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">Alphabetical Seat List</p>
                  </div>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead><tr><th>Seat</th><th>Roll No</th><th>Student Name</th><th>Class</th></tr></thead>
                      <tbody>
                        {currentArrangement.arrangement.flat().filter(Boolean).sort((a,b)=>a.roll_no.localeCompare(b.roll_no)).map((seat,i)=>(
                          <tr key={i}>
                            <td className="font-mono font-bold text-primary-600">{seat.seat}</td>
                            <td className="font-mono text-sm">{seat.roll_no}</td>
                            <td className="font-medium text-slate-800 dark:text-slate-200">{seat.name}</td>
                            <td className="text-slate-500 text-sm">{seat.class_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
