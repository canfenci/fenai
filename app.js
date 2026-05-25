// Konu yapısı - Ünite ve alt konular
const TOPICS_STRUCTURE = {
  mevsimler_iklim: {
    name: 'Mevsimler ve İklim',
    topics: [
      { value: 'mevsimlerin_olusumu', name: 'Mevsimlerin Oluşumu' },
      { value: 'iklim_hava_hareketleri', name: 'İklim ve Hava Hareketleri' }
    ]
  },
  dna_genetik_kod: {
    name: 'DNA ve Genetik Kod',
    topics: [
      { value: 'dna_eslenmesi', name: 'DNA Eşlenmesi' },
      { value: 'caprazlama', name: 'Çaprazlama' },
      { value: 'mutasyon_modifikasyon', name: 'Mutasyon ve Modifikasyon' },
      { value: 'adaptasyon', name: 'Adaptasyon' },
      { value: 'biyoteknoloji', name: 'Biyoteknoloji' }
    ]
  },
  basinc: {
    name: 'Basınç',
    topics: [
      { value: 'kati_basinci', name: 'Katı Basıncı' },
      { value: 'sivi_gaz_basinci', name: 'Sıvı ve Gaz Basıncı' },
      { value: 'basinc_uygulamalari', name: 'Basınç Uygulamaları' }
    ]
  },
  madde_endustri: {
    name: 'Madde ve Endüstri',
    topics: [
      { value: 'periyodik_cetvel', name: 'Periyodik Cetvel' },
      { value: 'fiziksel_kimyasal_degisimler', name: 'Fiziksel ve Kimyasal Değişimler' },
      { value: 'kimyasal_tepkimeler', name: 'Kimyasal Tepkimeler' },
      { value: 'asitler_bazlar', name: 'Asitler ve Bazlar' },
      { value: 'maddenin_isi_etkilesimi', name: 'Maddenin Isı ile Etkileşimi' },
      { value: 'kimya_endustrisi', name: 'Kimya Endüstrisi' }
    ]
  },
  basit_makineler: {
    name: 'Basit Makineler',
    topics: [
      { value: 'basit_makineler_genel', name: 'Basit Makineler (Genel)' }
    ]
  },
  enerji_donusumleri: {
    name: 'Enerji Dönüşümleri ve Çevre Bilimi',
    topics: [
      { value: 'besin_zinciri', name: 'Besin Zinciri' },
      { value: 'enerji_donusumleri', name: 'Enerji Dönüşümleri' },
      { value: 'madde_donguleri_cevre', name: 'Madde Döngüleri ve Çevre Sorunları' },
      { value: 'surdurulebilir_kalkinma', name: 'Sürdürülebilir Kalkınma ve Geri Dönüşüm' }
    ]
  },
  elektrik_yukleri: {
    name: 'Elektrik Yükleri ve Elektrik Enerjisi',
    topics: [
      { value: 'elektriklenme', name: 'Elektriklenme' },
      { value: 'elektroskop_topraklama', name: 'Elektroskop ve Topraklama' },
      { value: 'elektrik_enerjisi_donusumu', name: 'Elektrik Enerjisinin Dönüşümü ve Güç Santralleri' }
    ]
  }
};

// Hata Kodları
const ERROR_CODES = {
  'D': 'Dikkatsizlik',
  'YO': 'Yanlış Okuma',
  'BE': 'Bilgi Eksikliği',
  'ZY': 'Zaman Yetmedi',
  'İH': 'İşlem Hatası',
  'KY': 'Kavram Yanılgısı'
};

// AI Suggestions for error codes
const AI_SUGGESTIONS = {
  'D': 'Soruları daha dikkatli okuyun. Her seçeneği tek tek değerlendirin. Acele etmeyin, zamanı iyi yönetin. Çözdüğünüz soruları tekrar kontrol edin.',
  'YO': 'Soruyu en az iki kez okuyun. Anahtar kelimelerin altını çizin. "Hangisi değildir?", "Aşağıdakilerden hangisi yanlıştır?" gibi ifadelere özellikle dikkat edin.',
  'BE': 'Bu konuyu tekrar çalışın. Konu anlatım videolarını izleyin. Soru çözümü yaparak pekiştirin. Ders notlarınızı gözden geçirin ve eksik kalan konuları tamamlayın.',
  'ZY': 'Zaman yönetimi çalışın. Kolay sorulardan başlayın. Takıldığınız soruları işaretleyip geçin, sonra geri dönün. Deneme sınavlarında süre tutarak pratik yapın.',
  'İH': 'İşlem adımlarını tek tek yazın. Hesap makinesi kullanımını pratik yapın. Sonuçları kontrol edin. Virgül ve işaret hatalarına dikkat edin.',
  'KY': 'Kavramları doğru anladığınızdan emin olun. Benzer kavramları karşılaştırın. Örneklerle pekiştirin. Kavram haritaları oluşturun.'
};

// DOM Elements
const studentForm = document.getElementById('add-student-form');
const studentList = document.getElementById('student-list');
const studentListContainer = document.getElementById('student-list-container');
const studentCards = document.getElementById('student-cards');
const filterStudentCards = document.getElementById('filter-student-cards');
const reportStudentCards = document.getElementById('report-student-cards');
const addErrorForm = document.getElementById('add-error-form');
const selectedStudentInfo = document.getElementById('selected-student-info');
const selectedReportStudentInfo = document.getElementById('selected-report-student-info');
const errorTableBody = document.getElementById('error-table-body');
const pdfButton = document.getElementById('download-pdf');
const viewStatisticsBtn = document.getElementById('view-statistics');
const statisticsContainer = document.getElementById('statistics-container');
const statisticsContent = document.getElementById('statistics-content');
const themeToggle = document.getElementById('theme-toggle');
const unitSelect = document.getElementById('unit');
const topicSelect = document.getElementById('topic');
const correctAnswers = document.getElementById('correct-answers');
const wrongAnswers = document.getElementById('wrong-answers');
const emptyAnswers = document.getElementById('empty-answers');
const netScoreValue = document.getElementById('net-score-value');
const editStudentId = document.getElementById('edit-student-id');
const saveBtnText = document.getElementById('save-btn-text');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const aiSuggestBtn = document.getElementById('ai-suggest-btn');
const actionTextarea = document.getElementById('action');
const errorCodeSelect = document.getElementById('error-code');

// Storage Keys
const STUDENT_STORAGE_KEY = 'hatasizlasma_students';
const ERROR_STORAGE_KEY = 'hatasizlasma_errors';
const THEME_STORAGE_KEY = 'hatasizlasma_theme';

let selectedStudent = null;
let selectedReportStudent = null;
let selectedFilterStudent = null;

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  document.body.className = `${savedTheme}-mode`;
  updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector('.theme-icon');
  icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

themeToggle.addEventListener('click', () => {
  const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.body.className = `${newTheme}-mode`;
  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  updateThemeIcon(newTheme);
});

// Tab Management
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (button.disabled) return;
    
    const targetTab = button.dataset.tab;
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    button.classList.add('active');
    document.getElementById(`tab-${targetTab}`).classList.add('active');
    
    if (targetTab === 'error-view') {
      loadErrorTable();
    }
  });
});

function enableTab(tabName) {
  const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (tabBtn) {
    tabBtn.disabled = false;
  }
}

// Unit-Topic Management
unitSelect.addEventListener('change', (e) => {
  const selectedUnit = e.target.value;
  topicSelect.innerHTML = '<option value="">Konu Seçin</option>';
  
  if (selectedUnit && TOPICS_STRUCTURE[selectedUnit]) {
    topicSelect.disabled = false;
    const topics = TOPICS_STRUCTURE[selectedUnit].topics;
    
    topics.forEach(topic => {
      const option = document.createElement('option');
      option.value = topic.value;
      option.textContent = topic.name;
      topicSelect.appendChild(option);
    });
  } else {
    topicSelect.disabled = true;
  }
});

// Net Score Calculation
function calculateNet() {
  const correct = parseFloat(correctAnswers.value) || 0;
  const wrong = parseFloat(wrongAnswers.value) || 0;
  const net = correct - (wrong / 3);
  netScoreValue.textContent = net.toFixed(2);
}

correctAnswers.addEventListener('input', calculateNet);
wrongAnswers.addEventListener('input', calculateNet);
emptyAnswers.addEventListener('input', calculateNet);

// AI Suggestion
aiSuggestBtn.addEventListener('click', () => {
  const errorCode = errorCodeSelect.value;
  
  if (!errorCode) {
    showNotification('⚠️ Önce bir hata kodu seçin!', 'warning');
    return;
  }
  
  const suggestion = AI_SUGGESTIONS[errorCode];
  if (suggestion) {
    actionTextarea.value = suggestion;
    showNotification('🤖 AI önerisi eklendi!', 'success');
  }
});

// Load Students
function loadStudents() {
  const students = JSON.parse(localStorage.getItem(STUDENT_STORAGE_KEY)) || [];
  
  if (students.length > 0) {
    studentListContainer.classList.remove('hidden');
    enableTab('error-entry');
    enableTab('error-view');
    enableTab('reports');
  } else {
    studentListContainer.classList.add('hidden');
  }
  
  studentList.innerHTML = '';
  students.forEach(student => {
    const li = document.createElement('li');
    li.classList.add('student-item');
    
    const infoDiv = document.createElement('div');
    infoDiv.classList.add('student-info');
    
    const nameSpan = document.createElement('span');
    nameSpan.classList.add('student-name');
    nameSpan.textContent = student.name;
    
    const classSpan = document.createElement('span');
    classSpan.classList.add('student-class');
    classSpan.textContent = `${student.class}. Sınıf`;
    
    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(classSpan);
    
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('student-actions');
    
    const editBtn = document.createElement('button');
    editBtn.classList.add('btn-edit');
    editBtn.textContent = '✏️ Düzenle';
    editBtn.addEventListener('click', () => editStudent(student));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('btn-delete');
    deleteBtn.textContent = '🗑️ Sil';
    deleteBtn.addEventListener('click', () => deleteStudent(student.id));
    
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    
    li.appendChild(infoDiv);
    li.appendChild(actionsDiv);
    studentList.appendChild(li);
  });
  
  renderStudentCards(students);
  renderFilterStudentCards(students);
  renderReportStudentCards(students);
}

// Render Student Cards (for error entry)
function renderStudentCards(students) {
  studentCards.innerHTML = '';
  
  if (students.length === 0) {
    studentCards.innerHTML = '<p class="info-text">Henüz öğrenci eklenmemiş</p>';
    return;
  }
  
  students.forEach(student => {
    const card = document.createElement('div');
    card.classList.add('student-card');
    card.dataset.id = student.id;
    
    if (selectedStudent && selectedStudent.id === student.id) {
      card.classList.add('selected');
    }
    
    const nameDiv = document.createElement('div');
    nameDiv.classList.add('student-card-name');
    nameDiv.textContent = student.name;
    
    const classDiv = document.createElement('div');
    classDiv.classList.add('student-card-class');
    classDiv.textContent = `${student.class}. Sınıf`;
    
    card.appendChild(nameDiv);
    card.appendChild(classDiv);
    
    card.addEventListener('click', () => selectStudent(student));
    
    studentCards.appendChild(card);
  });
}

// Render Filter Student Cards
function renderFilterStudentCards(students) {
  filterStudentCards.innerHTML = '';
  
  if (students.length === 0) {
    filterStudentCards.innerHTML = '<p class="info-text">Henüz öğrenci eklenmemiş</p>';
    return;
  }
  
  const allCard = document.createElement('div');
  allCard.classList.add('student-card');
  if (!selectedFilterStudent) {
    allCard.classList.add('selected');
  }
  
  const allNameDiv = document.createElement('div');
  allNameDiv.classList.add('student-card-name');
  allNameDiv.textContent = 'Tüm Öğrenciler';
  
  const allClassDiv = document.createElement('div');
  allClassDiv.classList.add('student-card-class');
  allClassDiv.textContent = 'Filtre Yok';
  
  allCard.appendChild(allNameDiv);
  allCard.appendChild(allClassDiv);
  
  allCard.addEventListener('click', () => {
    selectedFilterStudent = null;
    renderFilterStudentCards(students);
    loadErrorTable();
  });
  
  filterStudentCards.appendChild(allCard);
  
  students.forEach(student => {
    const card = document.createElement('div');
    card.classList.add('student-card');
    card.dataset.id = student.id;
    
    if (selectedFilterStudent && selectedFilterStudent.id === student.id) {
      card.classList.add('selected');
    }
    
    const nameDiv = document.createElement('div');
    nameDiv.classList.add('student-card-name');
    nameDiv.textContent = student.name;
    
    const classDiv = document.createElement('div');
    classDiv.classList.add('student-card-class');
    classDiv.textContent = `${student.class}. Sınıf`;
    
    card.appendChild(nameDiv);
    card.appendChild(classDiv);
    
    card.addEventListener('click', () => {
      selectedFilterStudent = student;
      renderFilterStudentCards(students);
      loadErrorTable();
    });
    
    filterStudentCards.appendChild(card);
  });
}

// Render Report Student Cards
function renderReportStudentCards(students) {
  reportStudentCards.innerHTML = '';
  
  if (students.length === 0) {
    reportStudentCards.innerHTML = '<p class="info-text">Henüz öğrenci eklenmemiş</p>';
    return;
  }
  
  students.forEach(student => {
    const card = document.createElement('div');
    card.classList.add('student-card');
    card.dataset.id = student.id;
    
    if (selectedReportStudent && selectedReportStudent.id === student.id) {
      card.classList.add('selected');
    }
    
    const nameDiv = document.createElement('div');
    nameDiv.classList.add('student-card-name');
    nameDiv.textContent = student.name;
    
    const classDiv = document.createElement('div');
    classDiv.classList.add('student-card-class');
    classDiv.textContent = `${student.class}. Sınıf`;
    
    card.appendChild(nameDiv);
    card.appendChild(classDiv);
    
    card.addEventListener('click', () => selectReportStudent(student));
    
    reportStudentCards.appendChild(card);
  });
}

// Select Student (for error entry)
function selectStudent(student) {
  selectedStudent = student;
  
  document.querySelectorAll('#student-cards .student-card').forEach(card => {
    card.classList.remove('selected');
    if (parseInt(card.dataset.id) === student.id) {
      card.classList.add('selected');
    }
  });
  
  selectedStudentInfo.innerHTML = `
    <span style="font-size: 1.5rem;">👨‍🎓</span>
    <span>Seçili Öğrenci: <strong>${student.name}</strong> - ${student.class}. Sınıf</span>
  `;
  selectedStudentInfo.classList.remove('hidden');
  
  addErrorForm.classList.remove('hidden');
}

// Select Report Student
function selectReportStudent(student) {
  selectedReportStudent = student;
  
  document.querySelectorAll('#report-student-cards .student-card').forEach(card => {
    card.classList.remove('selected');
    if (parseInt(card.dataset.id) === student.id) {
      card.classList.add('selected');
    }
  });
  
  selectedReportStudentInfo.innerHTML = `
    <span style="font-size: 1.5rem;">👨‍🎓</span>
    <span>Rapor Alınacak: <strong>${student.name}</strong> - ${student.class}. Sınıf</span>
  `;
  selectedReportStudentInfo.classList.remove('hidden');
  
  pdfButton.disabled = false;
}

// Load Error Table
function loadErrorTable() {
  const errors = JSON.parse(localStorage.getItem(ERROR_STORAGE_KEY)) || [];
  
  let filteredErrors = errors;
  if (selectedFilterStudent) {
    filteredErrors = errors.filter(e => e.studentId === selectedFilterStudent.id);
  }
  
  errorTableBody.innerHTML = '';
  
  if (filteredErrors.length === 0) {
    errorTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">Henüz hata kaydı bulunmuyor</div>
        </td>
      </tr>
    `;
    return;
  }
  
  filteredErrors.reverse().forEach((error, index) => {
    const tr = document.createElement('tr');
    
    const date = new Date(error.date);
    const formattedDate = date.toLocaleDateString('tr-TR');
    
    tr.innerHTML = `
      <td>${filteredErrors.length - index}</td>
      <td><strong>${error.studentName}</strong></td>
      <td>${error.examName}</td>
      <td>${error.unitName}</td>
      <td>${error.topicName}</td>
      <td><strong>#${error.questionNo}</strong></td>
      <td><span class="error-badge ${error.errorCode}">${error.errorCode}</span></td>
      <td><span class="net-badge">${error.netScore}</span></td>
      <td>${formattedDate}</td>
      <td>
        <button class="btn-delete-error" onclick="deleteError(${error.id})">🗑️</button>
      </td>
    `;
    
    errorTableBody.appendChild(tr);
  });
}

// Delete Error
function deleteError(errorId) {
  if (!confirm('Bu hata kaydını silmek istediğinizden emin misiniz?')) {
    return;
  }
  
  let errors = JSON.parse(localStorage.getItem(ERROR_STORAGE_KEY)) || [];
  errors = errors.filter(e => e.id !== errorId);
  localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));
  
  loadErrorTable();
  showNotification('🗑️ Hata kaydı silindi', 'info');
}

window.deleteError = deleteError;

// Edit Student
function editStudent(student) {
  document.getElementById('student-name').value = student.name;
  document.getElementById('student-class').value = student.class;
  editStudentId.value = student.id;
  
  saveBtnText.textContent = 'Güncelle';
  cancelEditBtn.classList.remove('hidden');
  
  studentForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Cancel Edit
cancelEditBtn.addEventListener('click', () => {
  studentForm.reset();
  editStudentId.value = '';
  saveBtnText.textContent = 'Öğrenci Ekle';
  cancelEditBtn.classList.add('hidden');
});

// Add/Update Student
studentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('student-name').value.trim();
  const studentClass = document.getElementById('student-class').value;
  const editId = editStudentId.value;
  
  if (!name || !studentClass) {
    showNotification('⚠️ Lütfen tüm alanları doldurun!', 'warning');
    return;
  }
  
  let students = JSON.parse(localStorage.getItem(STUDENT_STORAGE_KEY)) || [];
  
  if (editId) {
    students = students.map(s => 
      s.id === parseInt(editId) 
        ? { ...s, name, class: studentClass } 
        : s
    );
    showNotification('✅ Öğrenci başarıyla güncellendi!', 'success');
    
    let errors = JSON.parse(localStorage.getItem(ERROR_STORAGE_KEY)) || [];
    errors = errors.map(e => 
      e.studentId === parseInt(editId)
        ? { ...e, studentName: name, studentClass: studentClass }
        : e
    );
    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));
  } else {
    const newStudent = { 
      id: Date.now(), 
      name, 
      class: studentClass 
    };
    students.push(newStudent);
    showNotification('✅ Öğrenci başarıyla eklendi!', 'success');
  }
  
  localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(students));
  
  studentForm.reset();
  editStudentId.value = '';
  saveBtnText.textContent = 'Öğrenci Ekle';
  cancelEditBtn.classList.add('hidden');
  
  loadStudents();
});

// Delete Student
function deleteStudent(id) {
  if (!confirm('Bu öğrenciyi silmek istediğinizden emin misiniz? Öğrenciye ait tüm hata kayıtları da silinecektir.')) {
    return;
  }
  
  let students = JSON.parse(localStorage.getItem(STUDENT_STORAGE_KEY)) || [];
  students = students.filter(student => student.id !== id);
  localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(students));
  
  let errors = JSON.parse(localStorage.getItem(ERROR_STORAGE_KEY)) || [];
  errors = errors.filter(error => error.studentId !== id);
  localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));
  
  if (selectedStudent && selectedStudent.id === id) {
    selectedStudent = null;
    addErrorForm.classList.add('hidden');
    selectedStudentInfo.classList.add('hidden');
  }
  
  if (selectedReportStudent && selectedReportStudent.id === id) {
    selectedReportStudent = null;
    selectedReportStudentInfo.classList.add('hidden');
    pdfButton.disabled = true;
  }
  
  if (selectedFilterStudent && selectedFilterStudent.id === id) {
    selectedFilterStudent = null;
  }
  
  loadStudents();
  loadErrorTable();
  showNotification('🗑️ Öğrenci ve ilgili kayıtlar silindi', 'info');
}

// Add Error
addErrorForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  if (!selectedStudent) {
    showNotification('⚠️ Lütfen önce bir öğrenci seçin!', 'warning');
    return;
  }
  
  const unitValue = unitSelect.value;
  const unitName = TOPICS_STRUCTURE[unitValue]?.name || '';
  const topicValue = topicSelect.value;
  const topicName = TOPICS_STRUCTURE[unitValue]?.topics.find(t => t.value === topicValue)?.name || '';
  const errorCodeValue = document.getElementById('error-code').value;
  const errorCodeName = ERROR_CODES[errorCodeValue] || '';
  
  const errorData = {
    id: Date.now(),
    studentId: selectedStudent.id,
    studentName: selectedStudent.name,
    studentClass: selectedStudent.class,
    examName: document.getElementById('exam-name').value,
    lesson: document.getElementById('lesson').value,
    unit: unitValue,
    unitName: unitName,
    topic: topicValue,
    topicName: topicName,
    questionNo: document.getElementById('question-no').value,
    errorCode: errorCodeValue,
    errorCodeName: errorCodeName,
    correctAnswers: correctAnswers.value,
    wrongAnswers: wrongAnswers.value,
    emptyAnswers: emptyAnswers.value,
    netScore: netScoreValue.textContent,
    thought: document.getElementById('thought').value,
    correction: document.getElementById('correction').value,
    action: document.getElementById('action').value,
    date: new Date().toISOString()
  };
  
  const errors = JSON.parse(localStorage.getItem(ERROR_STORAGE_KEY)) || [];
  errors.push(errorData);
  localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));
  
  addErrorForm.reset();
  topicSelect.disabled = true;
  netScoreValue.textContent = '0';
  
  showNotification('💾 Hata kaydı başarıyla eklendi!', 'success');
  loadErrorTable();
});

// View Statistics
viewStatisticsBtn.addEventListener('click', () => {
  const errors = JSON.parse(localStorage.getItem(ERROR_STORAGE_KEY)) || [];
  const students = JSON.parse(localStorage.getItem(STUDENT_STORAGE_KEY)) || [];
  
  if (errors.length === 0) {
    showNotification('⚠️ Henüz hata kaydı bulunmuyor!', 'warning');
    return;
  }
  
  statisticsContainer.classList.toggle('hidden');
  
  if (!statisticsContainer.classList.contains('hidden')) {
    renderStatistics(errors, students);
  }
});

// Render Statistics
function renderStatistics(errors, students) {
  statisticsContent.innerHTML = '';
  
  const totalErrors = errors.length;
  const totalStudents = students.length;
  
  const generalStats = document.createElement('div');
  generalStats.classList.add('stat-card');
  generalStats.innerHTML = `
    <h4>📊 Genel Bilgiler</h4>
    <p>Toplam Öğrenci: <strong>${totalStudents}</strong></p>
    <p>Toplam Hata Kaydı: <strong>${totalErrors}</strong></p>
  `;
  statisticsContent.appendChild(generalStats);
  
  const errorCodeStats = {};
  errors.forEach(error => {
    if (!errorCodeStats[error.errorCode]) {
      errorCodeStats[error.errorCode] = {
        count: 0,
        name: error.errorCodeName
      };
    }
    errorCodeStats[error.errorCode].count++;
  });
  
  const errorCodeCard = document.createElement('div');
  errorCodeCard.classList.add('stat-card');
  let errorCodeHTML = '<h4>⚠️ Hata Kodu Dağılımı</h4>';
  Object.keys(errorCodeStats).forEach(code => {
    errorCodeHTML += `<p><strong>${code}</strong> (${errorCodeStats[code].name}): ${errorCodeStats[code].count} adet</p>`;
  });
  errorCodeCard.innerHTML = errorCodeHTML;
  statisticsContent.appendChild(errorCodeCard);
  
  students.forEach(student => {
    const studentErrors = errors.filter(e => e.studentId === student.id);
    if (studentErrors.length > 0) {
      const avgNet = studentErrors.reduce((sum, e) => sum + parseFloat(e.netScore || 0), 0) / studentErrors.length;
      
      const studentStats = document.createElement('div');
      studentStats.classList.add('stat-card');
      studentStats.innerHTML = `
        <h4>👨‍🎓 ${student.name} (${student.class}. Sınıf)</h4>
        <p>Toplam Hata: <strong>${studentErrors.length}</strong></p>
        <p>Ortalama Net: <strong>${avgNet.toFixed(2)}</strong></p>
      `;
      statisticsContent.appendChild(studentStats);
    }
  });
}

// ======================= PDF RAPORU - html2canvas ile MÜKEMMEL DÜZEN =======================
async function generateProfessionalPDF(student, errors) {
  const { jsPDF } = window.jspdf;
  
  // Geçici bir div oluştur (görünmez)
  const reportDiv = document.createElement('div');
  reportDiv.style.position = 'absolute';
  reportDiv.style.left = '-9999px';
  reportDiv.style.top = '0';
  reportDiv.style.width = '800px';
  reportDiv.style.backgroundColor = '#ffffff';
  reportDiv.style.color = '#000000';
  reportDiv.style.padding = '20px';
  reportDiv.style.fontFamily = 'Arial, sans-serif';
  reportDiv.style.fontSize = '12px';
  
  // Başlık
  reportDiv.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="margin: 0; font-size: 28px;">
        <span style="font-weight: bold;">Can</span><span style="font-weight: normal;">fenci</span>
      </h1>
      <p style="font-size: 14px; color: #555; margin: 5px 0;">Hata Analizi Raporu</p>
      <hr style="margin: 10px 0;">
    </div>
    <div style="margin-bottom: 20px;">
      <p><strong>Öğrenci:</strong> ${student.name} (${student.class}. Sınıf)</p>
      <p><strong>Rapor Tarihi:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">#</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Deneme</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Ünite</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Konu</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Soru No</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Hata Kodu</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Net</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tarih</th>
        </tr>
      </thead>
      <tbody>
        ${errors.map((err, idx) => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 6px;">${idx + 1}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${err.examName}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${err.unitName}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${err.topicName}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">#${err.questionNo}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${err.errorCode}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${err.netScore}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${new Date(err.date).toLocaleDateString('tr-TR')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="margin-top: 20px;">
      <p><strong>Hata Kodu Açıklamaları:</strong></p>
      <div style="display: flex; flex-wrap: wrap; gap: 15px;">
        ${Object.keys(ERROR_CODES).map(code => `
          <span style="font-size: 11px; background: #f5f5f5; padding: 2px 8px; border-radius: 12px;">${code}: ${ERROR_CODES[code]}</span>
        `).join('')}
      </div>
    </div>
  `;
  
  document.body.appendChild(reportDiv);
  
  try {
    // HTML'i resme çevir
    const canvas = await html2canvas(reportDiv, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 genişlik mm
    const pageHeight = 297; // A4 yükseklik mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // İlk sayfa
    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Kalan sayfalar
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Dosya adı
    const safeName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Canfenci_${safeName}_Hata_Analizi.pdf`);
    showNotification('📄 PDF raporu başarıyla oluşturuldu!', 'success');
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    showNotification('❌ PDF oluşturulurken bir hata oluştu!', 'warning');
  } finally {
    document.body.removeChild(reportDiv);
  }
}
// =========================================================================

// Download PDF
pdfButton.addEventListener('click', () => {
  if (!selectedReportStudent) {
    showNotification('⚠️ Lütfen rapor alınacak öğrenciyi seçin!', 'warning');
    return;
  }
  
  const errors = JSON.parse(localStorage.getItem(ERROR_STORAGE_KEY)) || [];
  const studentErrors = errors.filter(e => e.studentId === selectedReportStudent.id);
  
  if (studentErrors.length === 0) {
    showNotification('⚠️ Bu öğrenci için henüz hata kaydı bulunmuyor!', 'warning');
    return;
  }
  
  generateProfessionalPDF(selectedReportStudent, studentErrors);
});

// Show Notification
function showNotification(message, type = 'success') {
  const colors = {
    success: 'linear-gradient(135deg, #28A745 0%, #1e7e34 100%)',
    warning: 'linear-gradient(135deg, #FFC107 0%, #e0a800 100%)',
    info: 'linear-gradient(135deg, #17A2B8 0%, #117a8b 100%)'
  };
  
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease;
    font-weight: 600;
    max-width: 300px;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadStudents();
});