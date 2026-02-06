# E-Market

Fullstack marketplace project

## Stack

- Backend: Django REST
- Frontend: React + Vite
- DB: SQLite / PostgreSQL
- Auth: JWT

---

## Structure

E-MARKET/
├─ backend/
├─ frontend/

---

## Backend Setup

```bash
cd backend

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env

python manage.py migrate
python manage.py runserver


## Frontend  Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
