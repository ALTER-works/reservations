# app.py
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from functools import wraps
from datetime import datetime
from db import users_db, floors_db, reservation_db, add_reservation, is_room_busy

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # для сессий

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_email = session.get('user')
        if not user_email or user_email not in users_db:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/', methods=['GET', 'POST'])
def main_page():
    if request.method == 'POST':
        user = session.get('user')
        if not user or user not in users_db:
            return redirect(url_for('login'))
        else:
            return redirect(url_for('main'))
    return render_template('start.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        action = request.form.get('action')
        email = request.form.get('email')
        password = request.form.get('password')

        if action == 'register':
            if email in users_db:
                error = 'Пользователь уже существует'
                return render_template('login.html', error=error)
            users_db[email] = {'password': password}
            session['user'] = email
            return redirect(url_for('main'))

        elif action == 'login':
            user = users_db.get(email)
            if user and user['password'] == password:
                session['user'] = email
                return redirect(url_for('main'))
            else:
                error = 'Неверный логин или пароль'
                return render_template('login.html', error=error)

    return render_template('login.html')

@app.route('/main', methods=['GET', 'POST'])
@login_required
def main():
    if request.method == 'POST':
        data = {}
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form

        action = data.get('action', '')

        if action == 'logout':
            session.pop('user', None)
            return jsonify({'success': True, 'redirect': url_for('main_page')})

        elif action == 'book':
            start_time_str = data.get('start_time')
            end_time_str = data.get('end_time')
            room_id = data.get('room_id')
            floor = data.get('floor')

            if not all([start_time_str, end_time_str, room_id, floor]):
                return jsonify({'success': False, 'error': 'Пожалуйста, заполните все поля бронирования'})

            try:
                start_time = datetime.fromisoformat(start_time_str)
                end_time = datetime.fromisoformat(end_time_str)
            except ValueError:
                return jsonify({'success': False, 'error': 'Неверный формат даты/времени'})

            if floor not in floors_db or room_id not in floors_db[floor].get('auditories', []):
                return jsonify({'success': False, 'error': 'Аудитория не принадлежит выбранному этажу'})

            if is_room_busy(room_id, start_time, end_time):
                return jsonify({'success': False, 'error': 'Комната занята на этот период'})

            add_reservation(session['user'], floor, room_id, start_time, end_time)
            return jsonify({'success': True})

        else:
            flash("Неизвестное действие", "error")
            return redirect(url_for('main'))

    return render_template('main.html',
                           users=users_db,
                           floors=floors_db,
                           reservations=reservation_db)

@app.route('/api/reservations', methods=['GET'])
@login_required
def api_reservations():
    auditorie = request.args.get('auditorie')
    date_str = request.args.get('date')

    if not auditorie or not date_str:
        return jsonify({'error': 'Missing parameters auditorie or date'}), 400

    try:
        date_filter = datetime.fromisoformat(date_str).date()
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400

    result = []
    for res in reservation_db.values():
        if res['auditorie'] == auditorie and res['start_time'].date() == date_filter:
            result.append({
                'start': res['start_time'].strftime("%H:%M"),
                'end': res['end_time'].strftime("%H:%M"),
            })

    return jsonify({'reservations': result})

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    session.pop('user', None)
    return redirect(url_for('main_page'))

if __name__ == '__main__':
    app.run(debug=True)

