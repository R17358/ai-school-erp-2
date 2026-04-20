// frontend/src/pages/StudentsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Search, Plus, Download, Filter, ChevronLeft, ChevronRight,
  Eye, Edit, Trash2, Phone, Mail, User, GraduationCap, Upload
} from 'lucide-react';
import api from '../services/api';
import { selectUserRole } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Modal from '../components/ui/Modal';
import StudentForm from '../components/students/StudentForm';

const GENDERS = ['Male', 'Female', 'Other'];
const STATUSES = ['Active', 'Inactive', 'Transferred'];

export default function StudentsPage() {
  const role = useSelector(selectUserRole);
  const canCreate = ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','STAFF'].includes(role);
  const canDelete = ['SUPER_ADMIN','PRINCIPAL'].includes(role);

  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const limit = 15;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/students', {
        params: { search, classId: classFilter, gender: genderFilter, page, limit }
      });
      setStudents(res.data.data.students || []);
      setTotal(res.data.data.total || 0);
    } catch {
      // Demo data
      setStudents(generateDemoStudents());
      setTotal(48);
    } finally {
      setLoading(false);
    }
  }, [search, classFilter, genderFilter, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.data || [])).catch(() => {
      setClasses([
        { id: '1', name: '10', section: 'A' },
        { id: '2', name: '10', section: 'B' },
        { id: '3', name: '11', section: 'Science' },
        { id: '4', name: '12', section: 'Commerce' },
      ]);
    });
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this student? This cannot be undone.')) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted');
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSave = async (data) => {
    try {
      if (editStudent) {
        await api.put(`/students/${editStudent.id}`, data);
        toast.success('Student updated');
      } else {
        await api.post('/students', data);
        toast.success('Student added successfully');
      }
      setShowModal(false);
      setEditStudent(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Students</h1>
          <p className="text-sm text-slate-400 mt-0.5">{total} students enrolled</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          {canCreate && (
            <button className="btn-primary" onClick={() => { setEditStudent(null); setShowModal(true); }}>
              <Plus className="w-4 h-4" /> Add Student
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" className="input pl-9" placeholder="Search by name, roll no, admission no..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input sm:w-44" value={classFilter}
            onChange={e => { setClassFilter(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
            ))}
          </select>
          <select className="input sm:w-36" value={genderFilter}
            onChange={e => { setGenderFilter(e.target.value); setPage(1); }}>
            <option value="">All Genders</option>
            {GENDERS.map(g => <option key={g}>{g}</option>)}
          </select>
          {(search || classFilter || genderFilter) && (
            <button className="btn-ghost text-slate-400" onClick={() => { setSearch(''); setClassFilter(''); setGenderFilter(''); setPage(1); }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No</th>
                <th>Class</th>
                <th>Roll No</th>
                <th>Contact</th>
                <th>Gender</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}><div className="shimmer h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400">No students found</p>
                    {canCreate && (
                      <button className="btn-primary mt-4" onClick={() => setShowModal(true)}>
                        <Plus className="w-4 h-4" /> Add First Student
                      </button>
                    )}
                  </td>
                </tr>
              ) : students.map(student => (
                <tr key={student.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {student.firstName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-slate-400">{student.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{student.admissionNo || '—'}</td>
                  <td>
                    {student.class ? (
                      <span className="badge-primary">{student.class.name}-{student.class.section}</span>
                    ) : '—'}
                  </td>
                  <td>{student.rollNo || '—'}</td>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      {student.user?.phone && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" /> {student.user.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={clsx('badge', student.gender === 'Male' ? 'badge-primary' : student.gender === 'Female' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 badge' : 'badge-gray')}>
                      {student.gender || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={clsx('badge', student.user?.isActive !== false ? 'badge-success' : 'badge-danger')}>
                      {student.user?.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/students/${student.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-base">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {canCreate && (
                        <button onClick={() => { setEditStudent(student); setShowModal(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-base">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(student.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-base">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700/50">
            <p className="text-xs text-slate-400">
              Showing {(page-1)*limit + 1}–{Math.min(page*limit, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-base">
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const p = i + Math.max(1, page - 2);
                if (p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={clsx('w-8 h-8 rounded-lg text-xs font-semibold transition-base',
                      p === page ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700')}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-base">
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditStudent(null); }}
        title={editStudent ? 'Edit Student' : 'Add New Student'} size="xl">
        <StudentForm
          initial={editStudent}
          classes={classes}
          onSave={handleSave}
          onCancel={() => { setShowModal(false); setEditStudent(null); }}
        />
      </Modal>
    </div>
  );
}

// Demo data generator
function generateDemoStudents() {
  const names = [
    ['Aarav', 'Sharma'], ['Priya', 'Patel'], ['Rohan', 'Verma'], ['Sneha', 'Gupta'],
    ['Arjun', 'Singh'], ['Kavya', 'Mehta'], ['Dev', 'Joshi'], ['Ananya', 'Rao'],
    ['Varun', 'Nair'], ['Ishaan', 'Reddy'], ['Diya', 'Mishra'], ['Karan', 'Kapoor'],
    ['Riya', 'Agarwal'], ['Aditya', 'Bhatt'], ['Pooja', 'Iyer'],
  ];
  const classes = [
    { id: '1', name: '10', section: 'A' },
    { id: '2', name: '11', section: 'Science' },
    { id: '3', name: '12', section: 'Commerce' },
  ];
  const genders = ['Male', 'Female'];

  return names.map(([first, last], i) => ({
    id: String(i + 1),
    firstName: first,
    lastName: last,
    admissionNo: `ADM${String(2024000 + i).padStart(7, '0')}`,
    rollNo: String(i + 1).padStart(2, '0'),
    gender: genders[i % 2],
    class: classes[i % 3],
    user: {
      email: `${first.toLowerCase()}.${last.toLowerCase()}@student.school`,
      phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      isActive: true,
    },
  }));
}
