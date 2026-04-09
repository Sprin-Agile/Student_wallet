from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# Kết nối đến MySQL (Giữ nguyên mật khẩu của bạn)
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
        # ĐÃ SỬA: Trả về thêm tên user để frontend nhận diện ngay lập tức
        return jsonify({"message": "Đăng ký thành công!", "user": username}), 201
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
    cursor = db.cursor(dictionary=True)

    try:
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

# --- CÁC HÀM XỬ LÝ GIAO DỊCH (THU/CHI) ---

@app.route('/get_transactions', methods=['POST'])
def get_transactions():
    data = request.json
    username = data.get('username')
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        sql = "SELECT * FROM transactions WHERE username = %s ORDER BY id ASC"
        cursor.execute(sql, (username,))
        transactions = cursor.fetchall()

        for t in transactions:
            if t['date']:
                t['date'] = t['date'].strftime('%d/%m/%Y')

        return jsonify(transactions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        db.close()


@app.route('/add_transaction', methods=['POST'])
def add_transaction():
    data = request.json
    db = get_db_connection()
    cursor = db.cursor()
    try:
        sql = "INSERT INTO transactions (username, amount, category, note, type) VALUES (%s, %s, %s, %s, %s)"
        cursor.execute(sql, (
            data['username'],
            data['amount'],
            data['category'],
            data['note'],
            data['type']
        ))
        db.commit()

        new_id = cursor.lastrowid
        return jsonify({"message": "Thêm thành công!", "id": new_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        db.close()


@app.route('/delete_transaction', methods=['POST'])
def delete_transaction():
    data = request.json
    trans_id = data.get('id')
    username = data.get('username')
    db = get_db_connection()
    cursor = db.cursor()
    try:
        sql = "DELETE FROM transactions WHERE id = %s AND username = %s"
        cursor.execute(sql, (trans_id, username))
        db.commit()
        return jsonify({"message": "Đã xóa thành công!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        db.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)