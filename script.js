document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const notesGrid = document.getElementById('notesGrid');
    const newNoteBtn = document.getElementById('newNoteBtn');
    const noteModal = document.getElementById('noteModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const noteTitleInput = document.getElementById('noteTitle');
    const noteContentInput = document.getElementById('noteContent');
    const searchInput = document.getElementById('searchInput');
    const colorOptions = document.querySelectorAll('.color-option');

    // State
    let notes = JSON.parse(localStorage.getItem('smartNotes')) || getDefaultNotes();
    let currentEditId = null;
    let selectedColor = 'default';

    // Initialize
    renderNotes();

    // Event Listeners
    newNoteBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    saveNoteBtn.addEventListener('click', saveNote);
    searchInput.addEventListener('input', handleSearch);

    // Close modal on outside click
    noteModal.addEventListener('click', (e) => {
        if (e.target === noteModal) closeModal();
    });

    // Color picker
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            selectedColor = option.dataset.color;
        });
    });

    // Functions
    function getDefaultNotes() {
        return [
            {
                id: Date.now().toString(),
                title: 'Welcome to Smart Note! ✨',
                content: 'This is a premium, glassmorphism-based notebook.\n\nTry creating a new note or modifying this one. You can categorize your thoughts efficiently.',
                color: 'purple',
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            },
            {
                id: (Date.now() + 1).toString(),
                title: 'Design Ideas 🎨',
                content: '- Implement dark mode\n- Add smooth transitions\n- Use Inter font for better readability\n- Add glassmorphism effects',
                color: 'blue',
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            }
        ];
    }

    function renderNotes(notesToRender = notes) {
        notesGrid.innerHTML = '';
        
        if (notesToRender.length === 0) {
            notesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 40px;">
                    <i class="ri-draft-line" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    <p>No notes found. Create your first note!</p>
                </div>
            `;
            return;
        }

        notesToRender.forEach((note, index) => {
            const delay = index * 0.1;
            const noteEl = document.createElement('div');
            noteEl.className = 'note-card';
            noteEl.style.animationDelay = `${delay}s`;
            
            // Map color string to CSS variable
            const bgColorVar = `--color-${note.color}`;
            noteEl.style.background = `var(${bgColorVar})`;

            noteEl.innerHTML = `
                <div class="note-header">
                    <h3 class="note-title">${escapeHTML(note.title)}</h3>
                    <div class="note-actions" onclick="event.stopPropagation()">
                        <button class="action-btn btn-edit" title="Edit Note" data-id="${note.id}">
                            <i class="ri-pencil-line"></i>
                        </button>
                        <button class="action-btn btn-delete" title="Delete Note" data-id="${note.id}">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>
                <div class="note-content">${escapeHTML(note.content)}</div>
                <div class="note-footer">
                    <div class="note-date">
                        <i class="ri-calendar-line"></i>
                        <span>${note.date}</span>
                    </div>
                </div>
            `;

            // Click to edit
            noteEl.addEventListener('click', () => editNote(note.id));

            notesGrid.appendChild(noteEl);
        });

        // Add event listeners to dynamically created buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteNote(btn.dataset.id);
            });
        });
        
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editNote(btn.dataset.id);
            });
        });

        saveToLocalStorage();
        updateStorageMeter();
    }

    function openModal() {
        noteModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        noteTitleInput.focus();
    }

    function closeModal() {
        noteModal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            noteTitleInput.value = '';
            noteContentInput.value = '';
            currentEditId = null;
            resetColorPicker();
        }, 300); // Wait for transition
    }

    function saveNote() {
        const title = noteTitleInput.value.trim() || 'Untitled Note';
        const content = noteContentInput.value.trim();

        if (!content && title === 'Untitled Note') {
            closeModal();
            return; // Don't save empty notes
        }

        const date = new Date().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });

        if (currentEditId) {
            // Update existing note
            const index = notes.findIndex(n => n.id === currentEditId);
            if (index !== -1) {
                notes[index] = { ...notes[index], title, content, color: selectedColor, date };
            }
        } else {
            // Create new note
            const newNote = {
                id: Date.now().toString(),
                title,
                content,
                color: selectedColor,
                date
            };
            notes.unshift(newNote); // Add to beginning
        }

        renderNotes();
        closeModal();
    }

    function deleteNote(id) {
        if(confirm('Are you sure you want to delete this note?')) {
            notes = notes.filter(n => n.id !== id);
            renderNotes();
        }
    }

    function editNote(id) {
        const note = notes.find(n => n.id === id);
        if (!note) return;

        currentEditId = id;
        noteTitleInput.value = note.title;
        noteContentInput.value = note.content;
        
        // Set color
        selectedColor = note.color || 'default';
        colorOptions.forEach(opt => {
            if(opt.dataset.color === selectedColor) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });

        openModal();
    }

    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        if(!searchTerm) {
            renderNotes();
            return;
        }

        const filteredNotes = notes.filter(note => {
            return note.title.toLowerCase().includes(searchTerm) || 
                   note.content.toLowerCase().includes(searchTerm);
        });

        renderNotes(filteredNotes);
    }

    function saveToLocalStorage() {
        localStorage.setItem('smartNotes', JSON.stringify(notes));
    }

    function resetColorPicker() {
        selectedColor = 'default';
        colorOptions.forEach(opt => {
            if(opt.dataset.color === 'default') {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    }

    function updateStorageMeter() {
        // Just a visual representation for the demo
        const maxNotes = 100;
        const currentCount = notes.length;
        const percentage = (currentCount / maxNotes) * 100;
        
        const storageTextElement = document.querySelector('.storage-text span:last-child');
        const progressFillElement = document.querySelector('.progress-fill');
        
        if (storageTextElement && progressFillElement) {
            storageTextElement.textContent = `${currentCount} / ${maxNotes} Notes`;
            progressFillElement.style.width = `${percentage}%`;
        }
    }

    // Utility function to prevent XSS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
