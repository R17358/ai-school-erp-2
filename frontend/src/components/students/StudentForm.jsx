// frontend/src/components/students/StudentForm.jsx
import { useState } from 'react';

export default function StudentForm({ initial, classes, onSave, onCancel }) {
  const [form, setForm] = useState({
    firstName: initial?.firstName || '',
    lastName: initial?.lastName || '',
    email: initial?.user?.email || '',
    phone: initial?.user?.phone || '',
    password: '',
    gender: initial?.gender || '',
    dob: initial?.dob ? new Date(initial.dob).toISOString().split('T')[0] : '',
    rollNo: initial?.rollNo || '',
    admissionNo: initial?.admissionNo || '',
    classId: initial?.classId || '',
    bloodGroup: initial?.bloodGroup || '',
    address: initial?.address || '',
    category: initial?.category || '',
    aadharNo: initial?.aadharNo || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        profileData: {
          firstName: form.firstName,
          lastName: form.lastName,
          gender: form.gender,
          dob: form.dob || undefined,
          rollNo: form.rollNo,
          admissionNo: form.admissionNo,
          classId: form.classId || undefined,
          bloodGroup: form.bloodGroup,
          address: form.address,
          category: form.category,
          aadharNo: form.aadharNo,
        },
        email: form.email,
        phone: form.phone,
        password: form.password || undefined,
        role: 'STUDENT',
      });
    } finally { setSaving(false); }
  };

  const F = ({ label, id, type = 'text', children, required, placeholder, col }) => (
    <div className={col === 2 ? 'col-span-2' : ''}>
      <label className="label">{label}{required && ' *'}</label>
      {children || (
        <input id={id} type={type} required={required} placeholder={placeholder} className="input"
          value={form[id]} onChange={e => setForm({...form, [id]: e.target.value})} />
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
        <F label="First Name" id="firstName" required />
        <F label="Last Name" id="lastName" required />
        <F label="Email" id="email" type="email" required />
        <F label="Phone" id="phone" type="tel" />
        {!initial && <F label="Password" id="password" type="password" placeholder="Leave blank for Welcome@123" />}
        <F label="Gender" id="gender">
          <select className="input" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
            <option value="">Select</option>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </F>
        <F label="Date of Birth" id="dob" type="date" />
        <F label="Class" id="classId">
          <select className="input" value={form.classId} onChange={e => setForm({...form, classId: e.target.value})}>
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
          </select>
        </F>
        <F label="Roll No" id="rollNo" />
        <F label="Admission No" id="admissionNo" />
        <F label="Blood Group" id="bloodGroup">
          <select className="input" value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})}>
            <option value="">Select</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
          </select>
        </F>
        <F label="Category" id="category">
          <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            <option value="">Select</option>
            {['General','OBC','SC','ST','EWS'].map(c => <option key={c}>{c}</option>)}
          </select>
        </F>
        <F label="Aadhaar No" id="aadharNo" />
        <div className="col-span-2">
          <label className="label">Address</label>
          <textarea className="input" rows={2} value={form.address}
            onChange={e => setForm({...form, address: e.target.value})} placeholder="Full address" />
        </div>
      </div>

      <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : (initial ? 'Update Student' : 'Add Student')}
        </button>
      </div>
    </form>
  );
}
