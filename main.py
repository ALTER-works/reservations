from flask import Flask, render_template, request, redirect, url_for, session

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # для сессий

# Заглушка БД пользователей
users_db = {
    'user@example.com': {'password': 'pass123'}
}

@app.route('/', methods=['GET', 'POST'])
def main_page():
    if request.method == 'POST':
        # При нажатии "Get started" — переходим на страницу логина
        return redirect(url_for('login'))
    return render_template('main_page.html')

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
def main():
    # Проверка авторизации
    if 'user' not in session:
        return redirect(url_for('login'))
    user_email = session['user']
    return f"Добро пожаловать, {user_email}! Вы вошли в систему."

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('main_page'))

if __name__ == '__main__':
    app.run(debug=True)
