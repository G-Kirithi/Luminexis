import { useState, useEffect } from 'react';
import api from '../../api';

interface Category {
  id: number;
  name: string;
  color: string;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#fca311');

  const fetchCategories = async () => {
    try {
      // NOTE: Unauthenticated endpoint for now during scaffolding
      const response = await api.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Temporarily bypass auth for testing, or we expect the user to be logged in
      await api.post('/api/categories', { name, color });
      setName('');
      fetchCategories();
    } catch (error) {
      console.error("Failed to create category", error);
      alert("Failed to create category. Make sure you are logged in!");
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Category Management</h2>
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="Category Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <input 
          type="color" 
          value={color} 
          onChange={(e) => setColor(e.target.value)} 
          style={{ padding: '0', height: '44px', width: '44px' }}
        />
        <button type="submit">Add</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {categories.map((cat) => (
          <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: cat.color }}></div>
            <strong>{cat.name}</strong>
          </div>
        ))}
        {categories.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No categories found.</p>}
      </div>
    </div>
  );
}
