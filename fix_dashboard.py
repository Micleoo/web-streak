import re

with open("src/pages/Dashboard.tsx", "r") as f:
    content = f.read()

# 1. Update states
state_old = """  const [newQuestCategory, setNewQuestCategory] = useState('coding');
  const [newQuestMinutes, setNewQuestMinutes] = useState('');
  
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [editQuestName, setEditQuestName] = useState('');
  const [editQuestCategory, setEditQuestCategory] = useState('coding');
  const [editQuestMinutes, setEditQuestMinutes] = useState('');"""
state_new = """  const [newQuestCategory, setNewQuestCategory] = useState('coding');
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [newQuestMinutes, setNewQuestMinutes] = useState('');
  const [newQuestTimeUnit, setNewQuestTimeUnit] = useState('m');
  
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [editQuestName, setEditQuestName] = useState('');
  const [editQuestCategory, setEditQuestCategory] = useState('coding');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editQuestMinutes, setEditQuestMinutes] = useState('');
  const [editQuestTimeUnit, setEditQuestTimeUnit] = useState('m');
  
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

  const showToast = (text: string, type: 'error' | 'success') => {
    setToastMessage({text, type});
    setTimeout(() => setToastMessage(null), 3000);
  };"""
content = content.replace(state_old, state_new)

# 2. Update handleAddQuest
add_old = """  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuest.trim() || !user) return;
    
    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newQuest, 
          category: newQuestCategory,
          estimatedMinutes: newQuestMinutes 
        })
      });
      const data = await res.json();
      if (data && !data.error) {
        setQuests([...quests, data]);
        setNewQuest('');
        setNewQuestMinutes('');
      }
    } catch(e) { console.error(e) }
  };"""
add_new = """  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuest.trim() || !user) return;
    
    let totalMinutes = newQuestMinutes ? parseInt(newQuestMinutes, 10) : undefined;
    if (totalMinutes && newQuestTimeUnit === 'h') totalMinutes *= 60;
    
    const categoryToSave = newQuestCategory === 'custom' && newCustomCategory.trim() ? newCustomCategory.trim() : newQuestCategory;

    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newQuest, 
          category: categoryToSave,
          estimatedMinutes: totalMinutes 
        })
      });
      const data = await res.json();
      if (data && !data.error) {
        setQuests([...quests, data]);
        setNewQuest('');
        setNewQuestMinutes('');
        setNewCustomCategory('');
      }
    } catch(e) { console.error(e) }
  };"""
content = content.replace(add_old, add_new)


# 3. handleEditClick
edit_old = """  const handleEditClick = (quest: Quest) => {
    setEditingQuestId(quest.id);
    setEditQuestName(quest.name);
    setEditQuestCategory(quest.category || 'coding');
    setEditQuestMinutes(quest.estimatedMinutes ? String(quest.estimatedMinutes) : '');
  };"""
edit_new = """  const handleEditClick = (quest: Quest) => {
    setEditingQuestId(quest.id);
    setEditQuestName(quest.name);
    
    const isCustom = quest.category && !CATEGORIES.some(c => c.id === quest.category);
    if (isCustom) {
      setEditQuestCategory('custom');
      setEditCustomCategory(quest.category!);
    } else {
      setEditQuestCategory(quest.category || 'coding');
      setEditCustomCategory('');
    }
    
    if (quest.estimatedMinutes) {
      if (quest.estimatedMinutes % 60 === 0 && quest.estimatedMinutes > 0) {
        setEditQuestMinutes(String(quest.estimatedMinutes / 60));
        setEditQuestTimeUnit('h');
      } else {
        setEditQuestMinutes(String(quest.estimatedMinutes));
        setEditQuestTimeUnit('m');
      }
    } else {
      setEditQuestMinutes('');
      setEditQuestTimeUnit('m');
    }
  };"""
content = content.replace(edit_old, edit_new)

# 4. handleSaveEdit
save_edit_old = """  const handleSaveEdit = async (questId: string) => {
    if (!editQuestName.trim()) return;
    
    // Optimistic UI update
    const originalQuests = [...quests];
    setQuests(quests.map(q => q.id === questId ? {
      ...q,
      name: editQuestName,
      category: editQuestCategory,
      estimatedMinutes: editQuestMinutes ? parseInt(editQuestMinutes, 10) : undefined
    } : q));
    setEditingQuestId(null);
    
    try {
      const res = await fetch(`/api/quests/${questId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editQuestName,
          category: editQuestCategory,
          estimatedMinutes: editQuestMinutes
        })
      });"""
save_edit_new = """  const handleSaveEdit = async (questId: string) => {
    if (!editQuestName.trim()) return;
    
    let totalMinutes = editQuestMinutes ? parseInt(editQuestMinutes, 10) : undefined;
    if (totalMinutes && editQuestTimeUnit === 'h') totalMinutes *= 60;

    const categoryToSave = editQuestCategory === 'custom' && editCustomCategory.trim() ? editCustomCategory.trim() : editQuestCategory;
    
    // Optimistic UI update
    const originalQuests = [...quests];
    setQuests(quests.map(q => q.id === questId ? {
      ...q,
      name: editQuestName,
      category: categoryToSave,
      estimatedMinutes: totalMinutes
    } : q));
    setEditingQuestId(null);
    
    try {
      const res = await fetch(`/api/quests/${questId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editQuestName,
          category: categoryToSave,
          estimatedMinutes: totalMinutes
        })
      });"""
content = content.replace(save_edit_old, save_edit_new)


# 5. Form Add Quest
form_old = """            <form onSubmit={handleAddQuest} className="add-quest-form">
              <input
                type="text"
                placeholder="Apa targetmu hari ini?"
                value={newQuest}
                onChange={(e) => setNewQuest(e.target.value)}
                className="quest-input main-input"
              />
              <input
                type="number"
                placeholder="Menit"
                value={newQuestMinutes}
                onChange={(e) => setNewQuestMinutes(e.target.value)}
                className="quest-input minutes-input"
                min="1"
                style={{width: '120px'}}
              />
              <select 
                value={newQuestCategory}
                onChange={(e) => setNewQuestCategory(e.target.value)}
                className="quest-category-select"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary add-quest-btn">
                <Plus size={18} /> Tambah
              </button>
            </form>"""
form_new = """            <form onSubmit={handleAddQuest} className="add-quest-form" style={{flexWrap: 'wrap'}}>
              <input
                type="text"
                placeholder="Apa targetmu hari ini?"
                value={newQuest}
                onChange={(e) => setNewQuest(e.target.value)}
                className="quest-input main-input"
                style={{flex: '1', minWidth: '200px'}}
              />
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <input
                  type="number"
                  placeholder="Waktu"
                  value={newQuestMinutes}
                  onChange={(e) => setNewQuestMinutes(e.target.value)}
                  className="quest-input minutes-input"
                  min="1"
                  style={{width: '80px'}}
                />
                <select 
                  value={newQuestTimeUnit} 
                  onChange={(e) => setNewQuestTimeUnit(e.target.value)}
                  className="quest-category-select"
                  style={{width: 'auto'}}
                >
                  <option value="m">Menit</option>
                  <option value="h">Jam</option>
                </select>
              </div>
              
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <select 
                  value={newQuestCategory}
                  onChange={(e) => setNewQuestCategory(e.target.value)}
                  className="quest-category-select"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                  <option value="custom">Lainnya...</option>
                </select>
                {newQuestCategory === 'custom' && (
                  <input
                    type="text"
                    placeholder="Kategori"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    className="quest-input"
                    style={{width: '100px'}}
                  />
                )}
              </div>
              <button type="submit" className="btn btn-primary add-quest-btn">
                <Plus size={18} /> Tambah
              </button>
            </form>"""
content = content.replace(form_old, form_new)

# 6. Form Edit Quest
edit_form_old = """                        <input
                          type="number"
                          placeholder="Menit"
                          value={editQuestMinutes}
                          onChange={(e) => setEditQuestMinutes(e.target.value)}
                          className="quest-input minutes-input"
                          min="1"
                          style={{width: '80px'}}
                        />
                        <select 
                          value={editQuestCategory}
                          onChange={(e) => setEditQuestCategory(e.target.value)}
                          className="quest-category-select"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>"""
edit_form_new = """                        <div style={{display: 'flex', gap: '4px'}}>
                          <input
                            type="number"
                            placeholder="Waktu"
                            value={editQuestMinutes}
                            onChange={(e) => setEditQuestMinutes(e.target.value)}
                            className="quest-input minutes-input"
                            min="1"
                            style={{width: '60px'}}
                          />
                          <select 
                            value={editQuestTimeUnit}
                            onChange={(e) => setEditQuestTimeUnit(e.target.value)}
                            className="quest-category-select"
                          >
                            <option value="m">m</option>
                            <option value="h">j</option>
                          </select>
                        </div>
                        <div style={{display: 'flex', gap: '4px'}}>
                          <select 
                            value={editQuestCategory}
                            onChange={(e) => setEditQuestCategory(e.target.value)}
                            className="quest-category-select"
                          >
                            {CATEGORIES.map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                            <option value="custom">Lainnya...</option>
                          </select>
                          {editQuestCategory === 'custom' && (
                            <input
                              type="text"
                              placeholder="Kategori"
                              value={editCustomCategory}
                              onChange={(e) => setEditCustomCategory(e.target.value)}
                              className="quest-input"
                              style={{width: '80px'}}
                            />
                          )}
                        </div>"""
content = content.replace(edit_form_old, edit_form_new)

# 7. Render minutes nicely
# {quest.estimatedMinutes}m -> {quest.estimatedMinutes >= 60 && quest.estimatedMinutes % 60 === 0 ? `${quest.estimatedMinutes / 60}j` : `${quest.estimatedMinutes}m`}
badge_old = "⏳ {quest.estimatedMinutes}m"
badge_new = "⏳ {quest.estimatedMinutes >= 60 && quest.estimatedMinutes % 60 === 0 ? `${quest.estimatedMinutes / 60}j` : `${quest.estimatedMinutes}m`}"
content = content.replace(badge_old, badge_new)

# 8. Friend request toast
req_old = """      await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId })
      });
      alert('Permintaan pertemanan terkirim!');"""
req_new = """      await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId })
      });
      showToast('Permintaan pertemanan terkirim!', 'success');"""
content = content.replace(req_old, req_new)


# 9. Render the Toast
toast_ui = """      {/* Modal Profile / Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: toastMessage.type === 'error' ? 'var(--danger-color)' : 'var(--success-color)',
          color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', animation: 'pop 0.3s ease-out'
        }}>
          {toastMessage.text}
        </div>
      )}
      <main className="dashboard-main">"""
content = content.replace('      <main className="dashboard-main">', toast_ui)


with open("src/pages/Dashboard.tsx", "w") as f:
    f.write(content)

print("Updated Dashboard.tsx")
