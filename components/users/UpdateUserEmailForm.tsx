import React, { useState } from 'react';
import { updateUserEmail } from '../../services/api';

interface Props {
  userId: string;
  currentEmail: string;
  onSuccess?: (newEmail: string) => void;
  onClose?: () => void;
}

const UpdateUserEmailForm: React.FC<Props> = ({ userId, currentEmail, onSuccess, onClose }) => {
  const [email, setEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await updateUserEmail(userId, email);
      onSuccess?.(email);
      onClose?.();
    } catch (err: any) {
      setError(err.message || 'שגיאה בעדכון האימייל');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="mb-2 font-bold text-gray-700">עדכון אימייל משתמש</h3>
      <label className="block mb-2 text-sm text-gray-600">
        אימייל חדש:
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
          className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
          style={{ direction: 'ltr' }}
        />
      </label>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      <div className="flex justify-end space-x-2 space-x-reverse mt-4">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md disabled:opacity-50">עדכן אימייל</button>
        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 rounded-md">ביטול</button>
      </div>
    </form>
  );
};

export default UpdateUserEmailForm;