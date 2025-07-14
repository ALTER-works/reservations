from flask import Flask, render_template, request, redirect, url_for, session
from functools import wraps

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # для сессий

# Заглушка БД пользователей
users_db = {
    'user@example.com': {'password': 'pass123'}
}
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
        user = session.get('user')  # Получаем пользователя из сессии (проверяем по дб и куки)
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
            # Регистрация нового пользователя
            if email in users_db:
                error = 'Пользователь уже существует'
                return render_template('login.html', error=error)
            users_db[email] = {'password': password}
            session['user'] = email
            return redirect(url_for('main'))

        elif action == 'login':
            # Вход существующего пользователя
            user = users_db.get(email)
            if user and user['password'] == password:
                session['user'] = email
                return redirect(url_for('main'))
            else:
                error = 'Неверный логин или пароль'
                return render_template('login.html', error=error)

    return render_template('login.html')

@app.route('/main')
@login_required
def main():
    user_email = session['user']
    return f"Добро пожаловать, {user_email}! Вы вошли в систему."

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('main_page'))

if __name__ == '__main__':
    app.run(debug=True)
