/* Секция констант и предварительной подготовки */
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

sectionFloors.querySelector('.section-header').addEventListener('click', () => toggleSection(sectionFloors));
sectionDate.querySelector('.section-header').addEventListener('click', () => toggleSection(sectionDate));
sectionRooms.querySelector('.section-header').addEventListener('click', () => toggleSection(sectionRooms));


/* Секция функций */
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

// Подстановка чисел месяца в году (учитывая високосный)
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

// Заполнение времени
function fillTimeOptions() {
  timeSelect.innerHTML = '';
  for(let h=9; h<=23; h++) {
    const option = document.createElement('option');
    option.value = `${h}:00-${h+1}:00`;
    option.textContent = `${h}:00 - ${h+1}:00`;
    timeSelect.appendChild(option);
  }
  timeSelect.disabled = false;
  timeSelect.value = ''; // сброс
}

function toggleSection(section) {
  if (section.classList.contains('disabled')) return;
  section.classList.toggle('open');
}

// Перевод дат в минуты
function timeToMinutes(t) {
  // "HH:MM" → количество минут от 00:00
  const [h, m] = t.split(':').map(Number);
  return h*60 + m;
}

// Отображение данных по комнате
function updateRoomOccupancyPanel(roomId, year, month, day) {

  if (!roomId || !year || !month || !day) {
    infoPanel.style.display = 'none';
    return;
  }

  const dateObj = new Date(year, month - 1, day);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('ru-RU', options);

  const dateParam = `${year}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;

  infoPanel.innerHTML = `
    <h3>${roomId}</h3>
    <div class="subtitle">${formattedDate}</div>
    <div class="calendar-container">
        <div class="calendar-time-gutter"></div>
        <div class="calendar-events"></div>
    </div>
  `;
  infoPanel.style.display = 'block';

  const timeGutter = infoPanel.querySelector('.calendar-time-gutter');
  const calendarEventsContainer = infoPanel.querySelector('.calendar-events');

  // Заполняем временную шкалу с 0:00 до 23:00
  timeGutter.innerHTML = '';
  for (let h = 0; h < 24; h++) {
    timeGutter.innerHTML += `<div>${h.toString().padStart(2, '0')}:00</div>`;
  }

  const pixelsPerHour = 60;
  const startHour = 0;

  fetch(`/api/all-reservations?auditorie=${encodeURIComponent(roomId)}&date=${dateParam}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        calendarEventsContainer.innerHTML = `<p style="color:red; text-align:center; margin-top:20px;">Ошибка: ${data.error}</p>`;
        return;
      }

      const reservations = data.reservations;
      calendarEventsContainer.innerHTML = '';

      if (reservations.length === 0) {
        calendarEventsContainer.innerHTML = `<p style="color:#bbb; text-align:center; margin-top:20px;">На эту дату бронирований нет.</p>`;
        return;
      }

      reservations.forEach(r => {
        const startTimeMinutes = timeToMinutes(r.start);
        const endTimeMinutes = timeToMinutes(r.end);

        // Ограничим отображение в пределах 0:00 - 24:00
        const topPositionMinutes = Math.max(0, startTimeMinutes - (startHour * 60));
        const durationMinutes = Math.min(24 * 60, endTimeMinutes) - startTimeMinutes;

        const topPx = (topPositionMinutes / 60) * pixelsPerHour;
        const heightPx = (durationMinutes / 60) * pixelsPerHour;

        if (heightPx <= 0) return; // Если событие вне диапазона, пропускаем

        const eventDiv = document.createElement('div');
        eventDiv.className = 'calendar-event';
        eventDiv.style.top = `${topPx}px`;
        eventDiv.style.height = `${heightPx}px`;
        eventDiv.title = `Забронировано: ${r.start} - ${r.end}\nКто: ${r.who}\n${r.description ? 'Описание: ' + r.description : ''}`;
        eventDiv.innerHTML = `
          <strong>${r.start} – ${r.end}</strong><br>
          ${r.who}
        `;
        calendarEventsContainer.appendChild(eventDiv);
      });

    })
    .catch(err => {
      calendarEventsContainer.innerHTML = `<p style="color:red; text-align:center; margin-top:20px;">Ошибка при загрузке данных</p>`;
      console.error(err);
    });
}

// Проверка, все ли данные введены для бронирования
function checkReserveBtnState() {
  const floorSelected = floorList.querySelector('li.selected') !== null;
  const yearSelected = yearSelect.value !== '';
  const monthSelected = monthSelect.value !== '';
  const daySelected = daySelect.value !== '';
  const timeSelected = timeSelect.value !== '';
  const roomSelected = roomList.querySelector('li.selected') !== null;

  reserveBtn.disabled = !(floorSelected && yearSelected && monthSelected && daySelected && timeSelected && roomSelected);
}


/* Секция обработок Ивентов */
// Ивенты блоков
floorList.addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li || li.classList.contains('disabled')) return;

  floorList.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
  li.classList.add('selected');

  floorNum = li.dataset.floor;

  fillRooms(floorNum);

  sectionDate.classList.remove('disabled');
  sectionRooms.classList.remove('disabled');

  yearSelect.disabled = false;
  monthSelect.disabled = false;
  daySelect.disabled = false;  // Заблокируем дни до выбора месяца и года
  timeSelect.disabled = false;

  modelContainer.textContent = `Планировка этажа ${floorNum}`;

  infoPanel.style.display = 'none';

  roomList.querySelectorAll('li').forEach(item => item.classList.remove('selected'));

  checkReserveBtnState();
});
yearSelect.addEventListener('change', () => {
  updateDays();
  monthSelect.disabled = false;
  checkReserveBtnState();

  const li = roomList.querySelector('li.selected');
  if (li) {
    const roomId = li.dataset.room;
    const year = yearSelect.value;
    const month = monthSelect.value;
    const day = daySelect.value;
    if(year && month && day) {
      updateRoomOccupancyPanel(roomId, year, month, day);
    } else {
      infoPanel.style.display = 'none';
    }
  }
});
monthSelect.addEventListener('change', () => {
  updateDays();
  daySelect.disabled = false;
  checkReserveBtnState();

  const li = roomList.querySelector('li.selected');
  if (li) {
    const roomId = li.dataset.room;
    const year = yearSelect.value;
    const month = monthSelect.value;
    const day = daySelect.value;
    if(year && month && day) {
      updateRoomOccupancyPanel(roomId, year, month, day);
    } else {
      infoPanel.style.display = 'none';
    }
  }
});
daySelect.addEventListener('change', () => {
  timeSelect.disabled = false;
  checkReserveBtnState();

  const li = roomList.querySelector('li.selected');
  if (li) {
    const roomId = li.dataset.room;
    const year = yearSelect.value;
    const month = monthSelect.value;
    const day = daySelect.value;
    if(year && month && day) {
      updateRoomOccupancyPanel(roomId, year, month, day);
    } else {
      infoPanel.style.display = 'none';
    }
  }
});
timeSelect.addEventListener('change', () => {
  checkReserveBtnState()

  const li = roomList.querySelector('li.selected');
  if (li) {
    const roomId = li.dataset.room;
    const year = yearSelect.value;
    const month = monthSelect.value;
    const day = daySelect.value;
    if(year && month && day) {
      updateRoomOccupancyPanel(roomId, year, month, day);
    } else {
      infoPanel.style.display = 'none';
    }
  }
  });
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

// Ивенты кнопок
reserveBtn.addEventListener('click', () => {
  const floor = floorList.querySelector('li.selected').dataset.floor;
  const roomId = roomList.querySelector('li.selected').dataset.room;
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
      room_id: roomId,
      start_time: startTime,
      end_time: endTime
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Бронирование успешно создано');
      updateRoomOccupancyPanel(roomId, year, month, day);
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

/* Инициализация */
function initApp() {
    yearSelect.value = '';
    monthSelect.value = '';
    daySelect.innerHTML = '';
    timeSelect.innerHTML = '';
    fillTimeOptions();
    fillFloors();
    checkReserveBtnState();
};
loadInitialData();
