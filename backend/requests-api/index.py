"""
API заявок ЖКХ. Единственный endpoint /, роутинг через action в теле:
  action=list        — список заявок по роли
  action=masters     — список мастеров (для диспетчера)
  action=create      — создать заявку (жилец)
  action=update      — обновить статус/мастера/комментарий (диспетчер)
  action=notifications — уведомления жильца (выполненные заявки с комментарием)
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

STATUS_LABELS = {
    "new": "Новая", "assigned": "Назначена",
    "in_progress": "В работе", "done": "Выполнена", "waiting": "Ожидает"
}
PRIORITY_LABELS = {
    "urgent": "Срочно", "high": "Высокий", "medium": "Средний", "low": "Низкий"
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={SCHEMA}")

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def get_user(cur, token):
    if not token:
        return None
    cur.execute(
        f"SELECT u.id, u.name, u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s",
        (token,)
    )
    row = cur.fetchone()
    return {"id": row[0], "name": row[1], "role": row[2]} if row else None

def fmt(row):
    return {
        "id": row[0], "category": row[1], "description": row[2], "address": row[3],
        "status": row[4], "status_label": STATUS_LABELS.get(row[4], row[4]),
        "priority": row[5], "priority_label": PRIORITY_LABELS.get(row[5], row[5]),
        "created_at": str(row[6]), "updated_at": str(row[7]),
        "resident_name": row[8], "resident_phone": row[9],
        "master_name": row[10], "master_id": row[11], "resident_id": row[12],
        "close_comment": row[13], "closed_at": str(row[14]) if row[14] else None,
    }

SELECT_SQL = """
    SELECT r.id, r.category, r.description, r.address, r.status, r.priority,
           r.created_at, r.updated_at,
           res.name, res.phone,
           m.name, r.master_id, r.resident_id,
           r.close_comment, r.closed_at
    FROM {schema}.requests r
    JOIN {schema}.users res ON res.id = r.resident_id
    LEFT JOIN {schema}.users m ON m.id = r.master_id
"""

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token")

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Неверный JSON")

    conn = get_conn()
    cur = conn.cursor()

    user = get_user(cur, token)
    if not user:
        return err("Требуется авторизация", 401)

    role = user["role"]
    uid = user["id"]
    action = body.get("action") or "list"
    base_sql = SELECT_SQL.format(schema=SCHEMA)

    # ── Список заявок ─────────────────────────────────────────
    if action == "list":
        if role == "resident":
            cur.execute(base_sql + "WHERE r.resident_id = %s ORDER BY r.created_at DESC", (uid,))
        elif role == "master":
            cur.execute(base_sql + "WHERE r.master_id = %s ORDER BY r.created_at DESC", (uid,))
        else:
            cur.execute(base_sql + "ORDER BY r.created_at DESC")
        return ok([fmt(r) for r in cur.fetchall()])

    # ── Уведомления жильца (выполненные заявки с комментарием) ─
    if action == "notifications":
        if role != "resident":
            return err("Недостаточно прав", 403)
        cur.execute(
            base_sql + "WHERE r.resident_id = %s AND r.status = 'done' AND r.close_comment IS NOT NULL ORDER BY r.closed_at DESC",
            (uid,)
        )
        return ok([fmt(r) for r in cur.fetchall()])

    # ── Список мастеров ───────────────────────────────────────
    if action == "masters":
        if role != "dispatcher":
            return err("Недостаточно прав", 403)
        cur.execute(f"SELECT id, name, phone FROM {SCHEMA}.users WHERE role = 'master' ORDER BY name")
        rows = cur.fetchall()
        return ok([{"id": r[0], "name": r[1], "phone": r[2]} for r in rows])

    # ── Создать заявку ────────────────────────────────────────
    if action == "create":
        if role != "resident":
            return err("Только жильцы могут создавать заявки", 403)
        category = (body.get("category") or "").strip()
        description = (body.get("description") or "").strip()
        address = (body.get("address") or "").strip()
        priority = body.get("priority") or "medium"

        if not category or not description or not address:
            return err("Заполните категорию, описание и адрес")

        cur.execute(
            f"INSERT INTO {SCHEMA}.requests (resident_id, category, description, address, priority) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (uid, category, description, address, priority)
        )
        req_id = cur.fetchone()[0]
        cur.execute(
            f"INSERT INTO {SCHEMA}.request_history (request_id, user_id, action) VALUES (%s, %s, %s)",
            (req_id, uid, "Заявка создана")
        )
        conn.commit()
        return ok({"id": req_id, "message": "Заявка создана"}, 201)

    # ── Обновить (диспетчер) ──────────────────────────────────
    if action == "update":
        if role != "dispatcher":
            return err("Недостаточно прав", 403)
        req_id = body.get("id")
        new_status = body.get("status")
        master_id = body.get("master_id")
        close_comment = (body.get("close_comment") or "").strip() or None

        if not req_id:
            return err("Укажите id заявки")

        cur.execute(f"SELECT id FROM {SCHEMA}.requests WHERE id = %s", (req_id,))
        if not cur.fetchone():
            return err("Заявка не найдена", 404)

        updates, vals = [], []
        if new_status:
            updates.append("status = %s"); vals.append(new_status)
        if master_id is not None:
            updates.append("master_id = %s"); vals.append(master_id)
            if not new_status:
                updates.append("status = %s"); vals.append("assigned")
        if close_comment is not None:
            updates.append("close_comment = %s"); vals.append(close_comment)
        if new_status == "done":
            updates.append("closed_at = NOW()")
        updates.append("updated_at = NOW()")
        vals.append(req_id)

        cur.execute(f"UPDATE {SCHEMA}.requests SET {', '.join(updates)} WHERE id = %s", vals)

        action_log = f"Статус: {STATUS_LABELS.get(new_status or '', new_status or '')}"
        if master_id:
            cur.execute(f"SELECT name FROM {SCHEMA}.users WHERE id = %s", (master_id,))
            mrow = cur.fetchone()
            action_log += f", мастер: {mrow[0]}" if mrow else ""
        if close_comment:
            action_log += f". Комментарий: {close_comment}"
        cur.execute(
            f"INSERT INTO {SCHEMA}.request_history (request_id, user_id, action) VALUES (%s, %s, %s)",
            (req_id, uid, action_log)
        )
        conn.commit()
        return ok({"message": "Обновлено"})

    return err("Неверное действие", 400)
