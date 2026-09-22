Setup:
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn

Target architecture:
main.py = handles HTTP requests and responses only
services/ = all database + application logic
routes should not touch SQLAlchemy directly

fastapi_app/
│
├── main.py
├── models.py
├── schemas.py
├── database.py
│
└── services/
    ├── __init__.py
    └── task_service.py

To start backend:
source .venv/bin/activate
uvicorn app.main:app --reload

sudo -u postgres createdb -O rich fastapi_app_db

Client → Task (Pydantic) → TaskDB (SQLAlchemy) → PostgreSQL
And reverse on output:
PostgreSQL → TaskDB → Task (response)

To start frontend:
cd frontend
npm run dev

State:
tasks + setTasks
const [tasks, setTasks] = useState([])
const [newTask, setNewTask] = useState('')

Update list
setTasks(...)

Loop
map()

Click
onClick

