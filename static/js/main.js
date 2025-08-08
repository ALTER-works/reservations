/* Секция констант и предварительной подготовки */
// Секции этажей, даты и аудиторий
const sectionFloors = document.getElementById('section-floors');
const sectionDate = document.getElementById('section-date');
const sectionRooms = document.getElementById('section-rooms');

// Будущие списки этажей и комнат
const floorList = document.getElementById('floor-list');
const roomList = document.getElementById('room-list');
let floorNum; // константа для формирования этажа + отрисовки комнат

// Константы даты и времени
const yearSelect = document.getElementById('year-select');
const monthSelect = document.getElementById('month-select');
const daySelect = document.getElementById('day-select');
const timeSelectFrom = document.getElementById('time-from');
const timeSelectTo = document.getElementById('time-to');
let isDateSectionOpened = false; // константа для нормального отображения дней*
const comboOptionsList = document.querySelectorAll('.combo-options');
const sectionLeftAdd = document.getElementById('add-info-panel');

// Константы вводимых значений
const eventName = document.getElementById('event-name');
const eventParticipants = document.getElementById('event-participants');
const eventDescription = document.getElementById('event-description');

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
// Список всех функций для инициализации (вызывается при выполнении loadInitialData())
function initApp() {
    yearSelect.value = '';
    monthSelect.value = '';
    daySelect.innerHTML = '';
    timeSelectFrom.innerHTML = '';
    setupCustomComboBox(timeSelectFrom);
    setupCustomComboBox(timeSelectTo);
    fillFloors();
    checkReserveBtnState();
};

// Заполнение дней в месяце
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

// Заполнение списка времени с фильтром
function fillTimeOptionsList(ulElement, filter = '') {
  ulElement.innerHTML = '';
  const times = [];
  for (let h = 0; h <= 23; h++) {
    const hourStr = h.toString().padStart(2, '0');
    times.push(`${hourStr}:00`);
    times.push(`${hourStr}:30`);
  }

  const filteredTimes = times;

  const inputId = ulElement.getAttribute('data-for');
  const input = document.getElementById(inputId);

  filteredTimes.forEach(time => {
    const li = document.createElement('li');
    li.textContent = time;
    li.tabIndex = 0; // чтобы элемент был фокусируемым

    li.addEventListener('click', () => {
      input.value = time;
      ulElement.classList.add('hidden');
      checkReserveBtnState?.();
      input.focus(); // вернуть фокус на инпут после выбора, если нужно
    });

    ulElement.appendChild(li);
  });

  if (filteredTimes.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Нет вариантов';
    li.style.color = '#999';
    li.style.cursor = 'default';
    ulElement.appendChild(li);
  }
}

// Функция динамического позиционирования выпадающего списка
function positionDropdown(input, ul) {
  const rect = input.getBoundingClientRect();
  ul.style.position = 'absolute';
  ul.style.top = rect.bottom + window.scrollY + 'px';
  ul.style.left = rect.left + window.scrollX + 'px';
  ul.style.width = rect.width + 'px';
  ul.style.zIndex = 1000;
}

// Установка кастомного комбо-бокса на инпут
function setupCustomComboBox(input) {
  const ul = document.querySelector(`.combo-options[data-for="${input.id}"]`);
  if (!ul) {
    console.warn(`No combo-options found for input with id="${input.id}"`);
    return;
  }

  input.addEventListener('focus', () => {
    fillTimeOptionsList(ul, input.value);
    positionDropdown(input, ul);
    ul.classList.remove('hidden');
  });

  input.addEventListener('input', () => {
    fillTimeOptionsList(ul, input.value);
    positionDropdown(input, ul);
    ul.classList.remove('hidden');
  });

  input.addEventListener('blur', () => {
    // Таймаут нужен, чтобы не скрывать список раньше, чем сработает клик по варианту из списка
    setTimeout(() => {
      ul.classList.add('hidden');
    }, 150);
  });

  // Обновление позиции списка при скролле и ресайзе, если он показан
  window.addEventListener('scroll', () => {
    if (!ul.classList.contains('hidden')) {
      positionDropdown(input, ul);
    }
  });

  window.addEventListener('resize', () => {
    if (!ul.classList.contains('hidden')) {
      positionDropdown(input, ul);
    }
  });
}

// Функция открытия списка, при его наличии (для ивентов)
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
  for (let h = 1; h < 24; h++) {
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
        const eventNameValue = eventName.value.trim();
        const eventParticipantsValue = eventParticipants.value.trim();
        const eventDescriptionValue = eventDescription.value.trim();
        eventDiv.innerHTML = `
          <strong>${eventNameValue || '(Без названия)'}</strong><br>
          <strong>${r.start} – ${r.end}</strong><br>
          ${eventDescriptionValue ? `<div>Описание: ${eventDescriptionValue}</div>` : ''}
          ${eventParticipantsValue ? `<div>Участники: ${eventParticipantsValue}</div>` : ''}
        `;
        eventDiv.title = `Название: ${eventNameValue}\nВремя: ${r.start} - ${r.end}\n${eventDescriptionValue ? 'Описание: ' + eventDescriptionValue + '\n' : ''}${eventParticipantsValue ? 'Участники: ' + eventParticipantsValue : ''}`;

        calendarEventsContainer.appendChild(eventDiv);
      });

    })
    .catch(err => {
      calendarEventsContainer.innerHTML = `<p style="color:red; text-align:center; margin-top:20px;">Ошибка при загрузке данных</p>`;
      console.error(err);
    });
}

// Проверка, все ли данные введены для бронирования + открытие кнопки, если да
function checkReserveBtnState() {
  const floorSelected = floorList.querySelector('li.selected') !== null;
  const yearSelected = yearSelect.value.trim() !== '';
  const monthSelected = monthSelect.value.trim() !== '';
  const daySelected = daySelect.value.trim() !== '';
  const timeSelectedFrom = timeSelectFrom.value.trim() !== '';
  const timeSelectedTo = timeSelectTo.value.trim() !== '';
  const roomSelected = roomList.querySelector('li.selected') !== null;
  const nameFilled = eventName.value.trim() !== '';
  const participantsFilled = eventParticipants.value.trim() !== '';
  const descriptionFilled = eventDescription.value.trim() !== '';

  reserveBtn.disabled = !(
    floorSelected &&
    yearSelected &&
    monthSelected &&
    daySelected &&
    timeSelectedFrom &&
    timeSelectedTo &&
    roomSelected &&
    nameFilled &&
    participantsFilled &&
    descriptionFilled
  );
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
  const year = yearSelect.value;
  if(year) { daySelect.disabled = false; }
  checkReserveBtnState();

  const li = roomList.querySelector('li.selected');
  if (li) {
    const roomId = li.dataset.room;
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
timeSelectFrom.addEventListener('change', () => checkReserveBtnState());
timeSelectTo.addEventListener('change', () => checkReserveBtnState());
eventName.addEventListener('change', () => checkReserveBtnState());
eventParticipants.addEventListener('change', () => checkReserveBtnState());
eventDescription.addEventListener('change', () => checkReserveBtnState());
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
// Ивенты общих секций
sectionLeftAdd.addEventListener('scroll', () => {
  comboOptionsList.forEach(el => {
    el.classList.add('hidden');
  });
});
sectionFloors.querySelector('.section-header').addEventListener('click', () => toggleSection(sectionFloors));
sectionDate.querySelector('.section-header').addEventListener('click', () => {
  toggleSection(sectionDate);

  if (!isDateSectionOpened) {
    daySelect.disabled = true;
    monthSelect.disabled = false;
    yearSelect.disabled = false;
    isDateSectionOpened = true;
  }
});
sectionRooms.querySelector('.section-header').addEventListener('click', () => toggleSection(sectionRooms));
// Ивенты кнопок
reserveBtn.addEventListener('click', () => {
  const floor = floorList.querySelector('li.selected').dataset.floor;
  const roomId = roomList.querySelector('li.selected').dataset.room;
  const year = yearSelect.value;
  const month = monthSelect.value.padStart(2, '0');
  const day = daySelect.value.padStart(2, '0');
  const timeFrom = timeSelectFrom.value;
  const timeTo = timeSelectTo.value;
  const startTime = `${year}-${month}-${day}T${timeFrom}:00`;
  const endTime = `${year}-${month}-${day}T${timeTo}:00`;
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
loadInitialData();
