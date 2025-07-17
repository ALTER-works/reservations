// Секции этажей, даты и аудиторий
const sectionFloors = document.getElementById('section-floors');
const sectionDate = document.getElementById('section-date');
const sectionRooms = document.getElementById('section-rooms');

// Будущие списки этажей и комнат
const floorList = document.getElementById('floor-list');
const roomList = document.getElementById('room-list');
let floorNum; // Для формирования этажа + отрисовки комнат

// Переменные даты и времени
const yearSelect = document.getElementById('year-select');
const monthSelect = document.getElementById('month-select');
const daySelect = document.getElementById('day-select');
const timeSelect = document.getElementById('time-select');

// Макет этажа + информация по комнате
const modelContainer = document.getElementById('model-container');
const infoPanel = document.getElementById('info-panel');

// Кнопки
const reserveBtn = document.getElementById('reserve-btn');
const logoutBtn = document.getElementById('logoutBtn');

// Асинхронная подгрузка данных (из app.py через API fetch)
async function loadInitialData() {
  try {
    const [usersRes, floorsRes, reservationsRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/floors'),
      fetch('/api/reservations'),
    ]);

    if (!usersRes.ok || !floorsRes.ok || !reservationsRes.ok) {
      throw new Error('Ошибка загрузки данных с сервера');
    }

    const usersData = await usersRes.json();
    const floorsData = await floorsRes.json();
    const reservationsData = await reservationsRes.json();

    users = usersData.users;
    floors = floorsData.floors;
    reservations = reservationsData.reservations;

    // Инициализация интерфейса
    initApp();

  } catch (error) {
    console.error('Ошибка при загрузке начальных данных:', error);
  }
}

// Расписание на текущий год + 3 следующих
const currentYear = new Date().getFullYear();
for(let y = currentYear; y <= currentYear + 3; y++) {
  const option = document.createElement('option');
  option.value = y;
  option.textContent = y;
  yearSelect.appendChild(option);
}

const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
monthNames.forEach((m,i) => {
  const option = document.createElement('option');
  option.value = i+1;
  option.textContent = m;
  monthSelect.appendChild(option);
});

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// Заполнение этажей
function fillFloors() {
  floorList.innerHTML = '';
  Object.keys(floors).forEach(floorKey => {
    const floorNumber = floorKey.replace('floor_', '');
    const li = document.createElement('li');
    li.dataset.floor = floorKey; // хранить "floor_1", "floor_2"
    li.textContent = `Этаж ${floorNumber}`;
    floorList.appendChild(li);
  });
}

// Заполнение комнат на этаже
function fillRooms(floorKey) {
  roomList.innerHTML = '';
  if (!floors[floorKey]) return;
  const auditories = floors[floorKey].auditories || [];
  if (auditories.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Аудиторий нет';
    li.classList.add('disabled');
    roomList.appendChild(li);
    return;
  }
  auditories.forEach(roomId => {
    const li = document.createElement('li');
    li.dataset.room = roomId; // Например, 's101'
    li.textContent = `Аудитория ${roomId.replace(/^s/, '')}`;
    roomList.appendChild(li);
  });
}

function updateDays() {
  const year = parseInt(yearSelect.value);
  const month = parseInt(monthSelect.value);
  if (!year || !month) {
    daySelect.innerHTML = '';
    daySelect.disabled = true;
    return;
  }
  const daysCount = daysInMonth(year, month);
  daySelect.innerHTML = '';
  for(let d=1; d<=daysCount; d++) {
    const option = document.createElement('option');
    option.value = d;
    option.textContent = d;
    daySelect.appendChild(option);
  }
  daySelect.disabled = false;
  daySelect.value = ''; // сброс
}

function fillTimeOptions() {
  timeSelect.innerHTML = '';
  for(let h=9; h<=20; h++) {
    const option = document.createElement('option');
    option.value = `${h}:00-${h+2}:00`;
    option.textContent = `${h}:00 - ${h+2}:00`;
    timeSelect.appendChild(option);
  }
  timeSelect.disabled = false;
  timeSelect.value = ''; // сброс
}

function toggleSection(section) {
  if (section.classList.contains('disabled')) return;
  section.classList.toggle('open');
}

sectionFloors.querySelector('.section-header').addEventListener('click', () => toggleSection(sectionFloors));
sectionDate.querySelector('.section-header').addEventListener('click', () => toggleSection(sectionDate));
sectionRooms.querySelector('.section-header').addEventListener('click', () => toggleSection(sectionRooms));

floorList.addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li || li.classList.contains('disabled')) return;

  floorList.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
  li.classList.add('selected');

  floorNum = li.dataset.floor;

  fillRooms(floorNum);

  sectionDate.classList.remove('disabled');
  sectionRooms.classList.remove('disabled');

  // sectionDate.classList.remove('open');
  // sectionRooms.classList.remove('open');

  yearSelect.disabled = false;
  monthSelect.disabled = false;
  daySelect.disabled = true;  // Заблокируем дни до выбора месяца и года
  timeSelect.disabled = true;

  yearSelect.value = '';
  monthSelect.value = '';
  daySelect.innerHTML = '';
  timeSelect.innerHTML = '';

  modelContainer.textContent = `Планировка этажа ${floorNum}`;

  infoPanel.style.display = 'none';

  roomList.querySelectorAll('li').forEach(item => item.classList.remove('selected'));

  checkReserveBtnState();
});

yearSelect.addEventListener('change', () => {
  updateDays();
  daySelect.disabled = false;
  checkReserveBtnState();
});
monthSelect.addEventListener('change', () => {
  updateDays();
  daySelect.disabled = false;
  checkReserveBtnState();
});
daySelect.addEventListener('change', () => {
  fillTimeOptions();
  timeSelect.disabled = false;
  checkReserveBtnState();
});
timeSelect.addEventListener('change', () => {
  checkReserveBtnState();
});

function timeToMinutes(t) {
  // "HH:MM" → количество минут от 00:00
  const [h, m] = t.split(':').map(Number);
  return h*60 + m;
}

function updateRoomOccupancyPanel(roomId, year, month, day) {
  if (!roomId || !year || !month || !day) {
    infoPanel.style.display = 'none';
    return;
  }
  const date = `${year}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
  fetch(`/api/all-reservations?auditorie=${encodeURIComponent(roomId)}&date=${date}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        infoPanel.innerHTML = `<p style="color:red;">Ошибка: ${data.error}</p>`;
        infoPanel.style.display = 'block';
        return;
      }
      const reservations = data.reservations;
      const intervals = [];
      // Интервалы с шагом 1 час от 9:00 до 22:00
      for(let h=9; h<=22; h++) {
        intervals.push({
          start: `${h.toString().padStart(2,'0')}:00`,
          end: (h===22 ? '22:00' : `${(h+1).toString().padStart(2,'0')}:00`),
          busy: false
        });
      }

      // Функция проверки пересечения между интервалами [start, end]
      function intervalsOverlap(start1, end1, start2, end2) {
        return start1 < end2 && start2 < end1;
      }

      reservations.forEach(r => {
        const resStart = timeToMinutes(r.start);
        const resEnd = timeToMinutes(r.end);
        intervals.forEach(i => {
          const intStart = timeToMinutes(i.start);
          const intEnd = (i.end === '22:00') ? 24*60 : timeToMinutes(i.end);
          if (intervalsOverlap(resStart, resEnd, intStart, intEnd)) {
            i.busy = true;
          }
        });
      });

      let html = `<h3>Информация по аудитории ${roomId} на ${date}</h3>`;
      html += `<p>Занятость с 9:00 до 22:00:</p><div style="max-height: 300px; overflow-y: auto; border: 1px solid #444; padding: 10px; background: #2c2c2c;">`;
      intervals.forEach(i => {
        html += `<p>${i.start} - ${i.end}: ${i.busy ? '<b style="color:#e55353;">Занято</b>' : '<b style="color:#53e58f;">Свободно</b>'}</p>`;
      });
      html += `</div>`;
      infoPanel.innerHTML = html;
      infoPanel.style.display = 'block';
    })
    .catch(err => {
      infoPanel.innerHTML = `<p style="color:red;">Ошибка при загрузке данных</p>`;
      infoPanel.style.display = 'block';
      console.error(err);
    });
}

roomList.addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li) return;

  roomList.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
  li.classList.add('selected');

  const roomId = li.dataset.room;
  const year = yearSelect.value;
  const month = monthSelect.value;
  const day = daySelect.value;

  if(year && month && day) {
    updateRoomOccupancyPanel(roomId, year, month, day);
  } else {
    infoPanel.style.display = 'none';
  }

  checkReserveBtnState();
});

function checkReserveBtnState() {
  const floorSelected = floorList.querySelector('li.selected') !== null;
  const yearSelected = yearSelect.value !== '';
  const monthSelected = monthSelect.value !== '';
  const daySelected = daySelect.value !== '';
  const timeSelected = timeSelect.value !== '';
  const roomSelected = roomList.querySelector('li.selected') !== null;

  reserveBtn.disabled = !(floorSelected && yearSelected && monthSelected && daySelected && timeSelected && roomSelected);
}

reserveBtn.addEventListener('click', () => {
  const floor = floorList.querySelector('li.selected').dataset.floor;
  const room = roomList.querySelector('li.selected').dataset.room;
  const year = yearSelect.value;
  const month = monthSelect.value.padStart(2, '0');
  const day = daySelect.value.padStart(2, '0');
  const timeRange = timeSelect.value;
  const [startH, endH] = timeRange.split('-');
  const startTime = `${year}-${month}-${day}T${startH}:00`;
  const endTime = `${year}-${month}-${day}T${endH}:00`;
  console.log(startTime, endTime)
  fetch(window.appConfig.mainUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': window.appConfig.csrfToken
    },
    body: JSON.stringify({
      action: 'book',
      floor: floor,
      room_id: room,
      start_time: startTime,
      end_time: endTime
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Бронирование успешно создано');
      location.reload();
    } else {
      alert('Ошибка: ' + data.error);
    }
  })
  .catch(err => {
    alert('Ошибка при бронировании');
    console.error(err);
  });
});


logoutBtn.addEventListener('click', () => {
  fetch(window.appConfig.mainUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': window.appConfig.csrfToken
    },
    body: JSON.stringify({action: 'logout'})
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Ошибка при логауте');
    }
    return response.json();
  })
  .then(data => {
    if (data.success && data.redirect) {
      window.location.href = data.redirect;
    } else {
      alert('Не удалось выйти из аккаунта.');
    }
  })
  .catch(err => {
    console.error('Ошибка при logout:', err);
    alert('Произошла ошибка при выходе.');
  });
});


// Инициализация
function initApp() {
    fillFloors();
    checkReserveBtnState();
};
loadInitialData();
