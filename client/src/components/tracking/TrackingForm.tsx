import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TrackingForm() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) navigate(`/track/${code.trim()}`);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className="input-field"
        placeholder="Tracking number"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button type="submit" className="btn-primary w-full">Track</button>
    </form>
  );
}