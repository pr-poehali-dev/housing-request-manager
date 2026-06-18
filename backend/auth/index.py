"""
Аутентификация: регистрация, вход, получение профиля.
Роутинг через поле action в теле запроса (единственный endpoint /):
  POST {action: "register"} — регистрация
  POST {action: "login"}    — вход
  POST {action: "me"}       — профиль по токену
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={SCHEMA}")

def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()

def make_token(user_id: int) -> str:
    raw = f"{user_id}:{secrets.token_hex(32)}"
    return hashlib.sha256(raw.encode()).hexdigest()

def ok(data: dict, status: int = 200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg: str, status: int = 400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Неверный JSON")

    action = body.get("action") or ""
    conn = get_conn()
    cur = conn.cursor()

    # ── Регистрация ──────────────────────────────────────────
    if action == "register":
        name = (body.get("name") or "").strip()
        phone = (body.get("phone") or "").strip()
        password = body.get("password") or ""
        role = body.get("role") or "resident"
        address = (body.get("address") or "").strip()

        if not name or not phone or not password:
            return err("Заполните имя, телефон и пароль")
        if role not in ("resident", "master", "dispatcher"):
            return err("Неверная роль")
        if len(password) < 6:
            return err("Пароль должен быть не менее 6 символов")

        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone = %s", (phone,))
        if cur.fetchone():
            return err("Пользователь с таким номером уже существует")

        pwd_hash = hash_password(password)
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (name, phone, password_hash, role, address) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (name, phone, pwd_hash, role, address or None)
        )
        user_id = cur.fetchone()[0]
        token = make_token(user_id)
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user_id, token))
        conn.commit()
        return ok({"token": token, "user": {"id": user_id, "name": name, "phone": phone, "role": role, "address": address}}, 201)

    # ── Вход ─────────────────────────────────────────────────
    if action == "login":
        phone = (body.get("phone") or "").strip()
        password = body.get("password") or ""

        if not phone or not password:
            return err("Введите телефон и пароль")

        cur.execute(
            f"SELECT id, name, role, address FROM {SCHEMA}.users WHERE phone = %s AND password_hash = %s",
            (phone, hash_password(password))
        )
        row = cur.fetchone()
        if not row:
            return err("Неверный номер телефона или пароль", 401)

        user_id, name, role, address = row
        token = make_token(user_id)
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user_id, token))
        conn.commit()
        return ok({"token": token, "user": {"id": user_id, "name": name, "phone": phone, "role": role, "address": address or ""}})

    # ── Профиль ───────────────────────────────────────────────
    if action == "me":
        token = (event.get("headers") or {}).get("X-Auth-Token") or (event.get("headers") or {}).get("x-auth-token")
        if not token:
            return err("Требуется авторизация", 401)

        cur.execute(
            f"""SELECT u.id, u.name, u.phone, u.role, u.address
                FROM {SCHEMA}.sessions s
                JOIN {SCHEMA}.users u ON u.id = s.user_id
                WHERE s.token = %s""",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return err("Токен недействителен", 401)

        uid, name, phone, role, address = row
        return ok({"id": uid, "name": name, "phone": phone, "role": role, "address": address or ""})

    return err("Неверное действие", 400)
