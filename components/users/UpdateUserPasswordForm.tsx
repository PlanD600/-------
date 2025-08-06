import React, { useState } from 'react';
import { updateUserPassword } from '../../services/api';

interface Props {
  userId: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const UpdateUserPasswordForm: React.FC<Props> = ({ userId, onSuccess, onClose }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await updateUserPassword(userId, password);
      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      setError(err.message || 'שגיאה בעדכון הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="mb-2 font-bold text-gray-700">עדכון סיסמת משתמש</h3>
      <label className="block mb-2 text-sm text-gray-600">
        סיסמה חדשה:
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={loading}
          className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
        />
      </label>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      <div className="flex justify-end space-x-2 space-x-reverse mt-4">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md disabled:opacity-50">עדכן סיסמה</button>
        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 rounded-md">ביטול</button>
      </div>
    </form>
  );
};

export default UpdateUserPasswordForm;