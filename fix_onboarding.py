import re

with open("src/pages/Onboarding.tsx", "r") as f:
    content = f.read()

# 1. Update logo import
import_old = "import { Target } from 'lucide-react';"
import_new = "import { Target, Flame, Plus } from 'lucide-react';"
content = content.replace(import_old, import_new)

# 2. Add custom category state
state_old = "  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);"
state_new = """  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');"""
content = content.replace(state_old, state_new)


# 3. Add custom category logic and UI frame
frame_old = """          <div className="form-group" style={{marginTop: '1rem'}}>
            <label>Pilih Kategori Favoritmu</label>
            <div className="categories-grid" style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px'}}>
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    background: selectedCategories.includes(category.id) ? 'var(--primary-color)' : 'transparent',
                    color: selectedCategories.includes(category.id) ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>"""

frame_new = """          <div className="form-group" style={{marginTop: '1rem'}}>
            <label>Pilih Kategori Favoritmu</label>
            <div className="categories-frame glass-panel" style={{padding: '16px', borderRadius: '12px', marginTop: '8px'}}>
              <div className="categories-grid" style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                {CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid var(--border-color)',
                      background: selectedCategories.includes(category.id) ? 'var(--primary-color)' : 'transparent',
                      color: selectedCategories.includes(category.id) ? 'white' : 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {category.label}
                  </button>
                ))}
                {selectedCategories.filter(id => !CATEGORIES.some(c => c.id === id)).map(customId => (
                  <button
                    key={customId}
                    type="button"
                    onClick={() => toggleCategory(customId)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid var(--primary-color)',
                      background: 'var(--primary-color)',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {customId}
                  </button>
                ))}
              </div>
              
              <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                <input
                  type="text"
                  placeholder="Tambah kategori lainnya..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (customCategory.trim() && !selectedCategories.includes(customCategory.trim())) {
                        setSelectedCategories([...selectedCategories, customCategory.trim()]);
                        setCustomCategory('');
                      }
                    }
                  }}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', outline: 'none'
                  }}
                />
                <button 
                  type="button"
                  onClick={() => {
                    if (customCategory.trim() && !selectedCategories.includes(customCategory.trim())) {
                      setSelectedCategories([...selectedCategories, customCategory.trim()]);
                      setCustomCategory('');
                    }
                  }}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', border: 'none',
                    background: 'var(--primary-color)', color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <Plus size={16} /> Tambah
                </button>
              </div>
            </div>
          </div>"""
content = content.replace(frame_old, frame_new)

with open("src/pages/Onboarding.tsx", "w") as f:
    f.write(content)

print("Updated Onboarding.tsx")
