
prerequis : 
install uv : powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
and python 



Under u'r backend folder : 
uv init
avoiding a problem and if u'r pythin is supp 3.15 maybe probelm preduce so 
uv python install 3.13
uv python pin 3.13
uv add "fastapi[standard]" --python 3.13

if u already has py 3.15 u can fix it after install the 3.13  :
rmdir /s /q .venv
uv venv --python 3.13

Project root
├── Backend/
│   ├── .venv/              ← local Python virtualenv (uv/poetry style)
│   ├── src_backend/
│   │   └── __init__.py     ← package marker (still empty / minimal)
│   ├── .python-version     ← Pins the Python version
│   ├── pyproject.toml      ←  Project config + dependencies (uv / hatch / poetry)
│   ├── README.md
│   └── uv.lock             ← lockfile (you are using uv)
└── Frontend/               ← Will hold the React app
 
 
create the main.py file under src\backend\ 
run it with : uv run uvicorn backend.main:app --reload --port 8000


for the front on u'r root project npm create vite@latest Frontend -- --template react 
frontend will be the name 
chose / Oxlint(because it faster) and yes for installing npm 

the app.jsx for connect the front with back 

Frontend/
├── node_modules/          ← All the installed packages (React, Vite, etc.) – don’t touch this
├── public/                ← Static files that never change (favicon, robots.txt…)
├── src/                   
│   ├── assets/            ← Images, icons, fonts…
│   ├── App.css            ← Styles only for the App component
│   ├── App.jsx            ← Main React component (the heart of your app)
│   ├── index.css          ← Global styles (applied to the whole page)
│   └── main.jsx           ← Entry point – this is the first file that runs
├── .gitignore             
├── .oxlintrc.json         ← Configuration for Oxlint (the fast linter)
├── index.html             ← The single HTML page that loads your React app
├── package-lock.json      ← Exact versions of all packages (auto-generated)
├── package.json           ← Project info + scripts + dependencies (very important)
├── README.md              
└── vite.config.js         ← Vite configuration (build tool settings)

run it : npm run dev




1-create the Dockerfile for backen and for the Frontend and docker-compose.yml for the root  and nginx.conffor frontend
*nginx.conf : [When you run npm run build, Vite creates a folder called dist/ that contains pure static files (HTML, CSS, JS). Nginx’s job is simply to serve those files ]
*DockerfileRecipe to build one image (one service) Recipe for one 
*dishdocker-compose.yml  Orchestrates multiple containers together Full menu + how to serve everything together

2-add in the main.py "http://localhost:3000",  to running with Docker 
3-then build it : docker compose up --build
*in case u wanna stope it : docker compose down

docker build  :creates the image.
docker run  :creates and starts a container from it.
docker push : uploads the image to Docker Hub; others can then : docker pull .
