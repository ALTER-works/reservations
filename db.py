from datetime import datetime

# Пользователи
users_db = {
    'user1@example.com': {'password': 'pass123'},
    'user2@example.com': {'password': 'pass456'},
    'user3@example.com': {'password': 'pass789'},
}

# Этажи и аудитории
floors_db = {
    'floor_1': {'auditories': ['s101', 's102', 's103']},
    'floor_2': {'auditories': ['s201', 's202']},
    'floor_3': {'auditories': ['s301']},
}

# Бронирования с привязкой к emails и с интервалами времени
reservation_db = {
    'id1': {
        'user_email': 'user1@example.com',
        'floor': 'floor_1',
        'auditorie': 's101',
        'start_time': datetime.fromisoformat('2025-07-15T09:00:00'),
        'end_time': datetime.fromisoformat('2025-07-15T11:00:00'),
    },
    'id2': {
        'user_email': 'user2@example.com',
        'floor': 'floor_1',
        'auditorie': 's102',
        'start_time': datetime.fromisoformat('2025-07-15T09:30:00'),
        'end_time': datetime.fromisoformat('2025-07-15T11:30:00'),
    },
    'id3': {
        'user_email': 'user3@example.com',
        'floor': 'floor_1',
        'auditorie': 's103',
        'start_time': datetime.fromisoformat('2025-07-15T10:00:00'),
        'end_time': datetime.fromisoformat('2025-07-15T12:00:00'),
    },
    'id4': {
        'user_email': 'user1@example.com',
        'floor': 'floor_1',
        'auditorie': 's101',
        'start_time': datetime.fromisoformat('2025-07-15T11:00:00'),
        'end_time': datetime.fromisoformat('2025-07-15T13:00:00'),
    },
    'id5': {
        'user_email': 'user2@example.com',
        'floor': 'floor_1',
        'auditorie': 's102',
        'start_time': datetime.fromisoformat('2025-07-15T12:00:00'),
        'end_time': datetime.fromisoformat('2025-07-15T14:00:00'),
    },
    'id6': {
        'user_email': 'user3@example.com',
        'floor': 'floor_1',
        'auditorie': 's103',
        'start_time': datetime.fromisoformat('2025-07-15T13:00:00'),
        'end_time': datetime.fromisoformat('2025-07-15T15:00:00'),
    },
    'id7': {
        'user_email': 'user1@example.com',
        'floor': 'floor_1',
        'auditorie': 's101',
        'start_time': datetime.fromisoformat('2025-07-15T14:00:00'),
        'end_time': datetime.fromisoformat('2025-07-15T16:00:00'),
    },
    'id8': {
        'user_email': 'user2@example.com',
        'floor': 'floor_2',
        'auditorie': 's201',
        'start_time': datetime.fromisoformat('2025-07-16T10:00:00'),
        'end_time': datetime.fromisoformat('2025-07-16T12:00:00'),
    },
    'id9': {
        'user_email': 'user3@example.com',
        'floor': 'floor_2',
        'auditorie': 's202',
        'start_time': datetime.fromisoformat('2025-07-16T13:00:00'),
        'end_time': datetime.fromisoformat('2025-07-16T15:00:00'),
    },
    'id10': {
        'user_email': 'user1@example.com',
        'floor': 'floor_1',
        'auditorie': 's101',
        'start_time': datetime.fromisoformat('2025-08-15T11:00:00'),
        'end_time': datetime.fromisoformat('2025-08-15T13:00:00'),
    },
    'id11': {
        'user_email': 'user1@example.com',
        'floor': 'floor_1',
        'auditorie': 's101',
        'start_time': datetime.fromisoformat('2025-09-15T11:00:00'),
        'end_time': datetime.fromisoformat('2025-09-15T13:00:00'),
    },
    'id12': {
        'user_email': 'user1@example.com',
        'floor': 'floor_1',
        'auditorie': 's101',
        'start_time': datetime.fromisoformat('2025-10-15T11:00:00'),
        'end_time': datetime.fromisoformat('2025-10-15T13:00:00'),
    },
    'id13': {
        'user_email': 'user1@example.com',
        'floor': 'floor_1',
        'auditorie': 's102',
        'start_time': datetime.fromisoformat('2025-07-15T15:30:00'),
        'end_time': datetime.fromisoformat('2025-07-15T17:00:00'),
    },
}

def add_reservation(user_email, floor, auditorie, start_time, end_time):
    new_id = f'id{len(reservation_db) + 1}'
    reservation_db[new_id] = {
        'user_email': user_email,
        'floor': floor,
        'auditorie': auditorie,
        'start_time': start_time,
        'end_time': end_time,
    }
    return new_id

def is_room_busy(auditorie, start_time, end_time):
    for res in reservation_db.values():
        if res['auditorie'] == auditorie:
            if not (res['end_time'] <= start_time or res['start_time'] >= end_time):
                return True
    return False

def get_reservations_by_user(user_email):
    return [res for res in reservation_db.values() if res['user_email'] == user_email]
