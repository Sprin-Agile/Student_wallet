from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# Kết nối đến MySQL
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "383834",      
    "database": "student_wallet"
}

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    db = get_db_connection()
    cursor = db.cursor()
    try:
        sql = "INSERT INTO users (username, password) VALUES (%s, %s)"
        cursor.execute(sql, (username, password))
        db.commit()
        return jsonify({"message": "Đăng ký thành công!"}), 201
    except:
        return jsonify({"error": "Tên đăng nhập đã tồn tại!"}), 400
    finally:
        cursor.close()
        db.close()


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)  # Sử dụng dictionary=True để dễ lấy dữ liệu

    try:
        # Kiểm tra xem user có tồn tại và mật khẩu có đúng không
        sql = "SELECT * FROM users WHERE username = %s AND password = %s"
        cursor.execute(sql, (username, password))
        user = cursor.fetchone()

        if user:
            return jsonify({"message": "Đăng nhập thành công!", "user": user['username']}), 200
        else:
            return jsonify({"error": "Sai tài khoản hoặc mật khẩu!"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        db.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)