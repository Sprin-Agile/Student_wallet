from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash # <--- THÊM DÒNG NÀY
import os
from dotenv import load_dotenv
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

DB_CONFIG = {
    "host": "mysql-student-wallet-student-d520.b.aivencloud.com",
    "user": "avnadmin",
    "password": os.environ.get("DB_PASSWORD"), 
    "database": "defaultdb",
    "port": 14854,
    "ssl_disabled": False
}

@app.route('/')
def home():
    return "Server Student Wallet đang chạy tốt!", 200

def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"❌ LỖI KẾT NỐI DATABASE: {err}")
        return None

# --- XÁC THỰC ---
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username, password = data.get('username'), data.get('password')

    db = get_db_connection()
    if db is None:
        return jsonify({"error": "Không thể kết nối cơ sở dữ liệu. Hãy kiểm tra DB_PASSWORD trên Render!"}), 500

    cursor = db.cursor()
    try:
        hashed_pw = generate_password_hash(password)
        cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_pw))
        db.commit()
        return jsonify({"message": "Đăng ký thành công!", "user": username}), 201
    except mysql.connector.Error as err:
        # Nếu lỗi là trùng tên đăng nhập (mã 1062)
        if err.errno == 1062:
            return jsonify({"error": "Tên đăng nhập này đã có người dùng rồi!"}), 400
        print(f"❌ LỖI SQL: {err}")
        return jsonify({"error": "Lỗi hệ thống khi đăng ký!"}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username, password = data.get('username'), data.get('password')
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    cursor.close()
    db.close()

    # Kiểm tra xem user có tồn tại và mật khẩu băm có khớp không
    if user and check_password_hash(user['password'], password):
        return jsonify({"message": "Đăng nhập thành công!", "user": user['username']}), 200
    return jsonify({"error": "Sai tài khoản hoặc mật khẩu!"}), 401

# --- GIAO DỊCH ---
@app.route('/get_transactions', methods=['POST'])
def get_transactions():
    username = request.json.get('username')
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM transactions WHERE username = %s ORDER BY id ASC", (username,))
    transactions = cursor.fetchall()
    for t in transactions:
        t['walletId'] = t.get('wallet_id') or 'w_main'
        if t['date']: t['date'] = t['date'].strftime('%d/%m/%Y')
    cursor.close()
    db.close()
    return jsonify(transactions)

@app.route('/add_transaction', methods=['POST'])
def add_transaction():
    data = request.json
    db = get_db_connection()
    cursor = db.cursor()
    sql = "INSERT INTO transactions (username, amount, category, note, type, wallet_id) VALUES (%s, %s, %s, %s, %s, %s)"
    cursor.execute(sql, (data['username'], data['amount'], data['category'], data['note'], data['type'], data.get('walletId', 'w_main')))
    db.commit()
    cursor.close()
    db.close()
    return jsonify({"id": cursor.lastrowid}), 201

@app.route('/delete_transaction', methods=['POST'])
def delete_transaction():
    data = request.json
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("DELETE FROM transactions WHERE id = %s AND username = %s", (data['id'], data['username']))
    db.commit()
    cursor.close()
    db.close()
    return jsonify({"message": "Đã xóa thành công!"}), 200

# --- VÍ (WALLETS) ---
@app.route('/get_wallets', methods=['POST'])
def get_wallets():
    username = request.json.get('username')
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM wallets WHERE username = %s", (username,))
    wallets = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(wallets)

@app.route('/add_wallet', methods=['POST'])
def add_wallet():
    data = request.json
    db = get_db_connection()
    cursor = db.cursor()
    sql = """
          INSERT INTO wallets (id, username, name, type, icon, initial_balance)
          VALUES (%s, %s, %s, %s, %s, %s)
          ON DUPLICATE KEY UPDATE
                               name = VALUES(name), icon = VALUES(icon), initial_balance = VALUES(initial_balance) \
          """
    cursor.execute(sql, (data['id'], data['username'], data['name'], data['type'], data['icon'], data['initialBalance']))
    db.commit()
    cursor.close()
    db.close()
    return jsonify({"status": "success"})

# --- NGÂN SÁCH (BUDGETS) ---
@app.route('/get_budgets', methods=['POST'])
def get_budgets():
    username = request.json.get('username')
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM budgets WHERE username = %s", (username,))
    budgets = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(budgets)

@app.route('/add_budget', methods=['POST'])
def add_budget():
    data = request.json
    db = get_db_connection()
    cursor = db.cursor()
    sql = "INSERT INTO budgets (username, category, name, amount, created_at, is_general) VALUES (%s, %s, %s, %s, %s, %s)"
    cursor.execute(sql, (data['username'], data.get('category'), data.get('name'), data['amount'], data['createdAt'], data['isGeneral']))
    db.commit()
    cursor.close()
    db.close()
    return jsonify({"id": cursor.lastrowid})

@app.route('/delete_budget', methods=['POST'])
def delete_budget():
    data = request.json
    db = get_db_connection()
    cursor = db.cursor()
    if data.get('all'):
        cursor.execute("DELETE FROM budgets WHERE username = %s", (data['username'],))
    else:
        cursor.execute("DELETE FROM budgets WHERE id = %s AND username = %s", (data['id'], data['username']))
    db.commit()
    cursor.close()
    db.close()
    return jsonify({"status": "deleted"})

@app.route('/get_goal', methods=['POST'])
def get_goal():
    username = request.json.get('username')
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM goals WHERE username = %s", (username,))
    goal = cursor.fetchone()
    cursor.close()
    db.close()
    return jsonify(goal) if goal else jsonify({})

@app.route('/add_goal', methods=['POST'])
def add_goal():
    data = request.json
    db = get_db_connection()
    cursor = db.cursor()
    sql = "INSERT INTO goals (username, name, target_amount) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE name=%s, target_amount=%s"
    cursor.execute(sql, (data['username'], data['name'], data['amount'], data['name'], data['amount']))
    db.commit()
    cursor.close()
    db.close()
    return jsonify({"status": "success"})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)