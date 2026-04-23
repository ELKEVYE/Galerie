# Projet Django + React

Structure du projet :

- `backend/` : API Django, configuration, base SQLite locale, fichiers media et dependances Python.
- `frontend/` : application React/Vite.

## Lancer le backend

```powershell
cd backend
& "..\.venv\Scripts\Activate.ps1"
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Lancer le frontend

```powershell
cd frontend
npm install
npm run dev
```

En developpement, Vite redirige `/api` et `/media` vers `http://127.0.0.1:8000`.

## Deploiement

Pour deployer separement :

- backend : pointer la plateforme vers le dossier `backend/`, installer `requirements.txt`, puis utiliser `gunicorn config.wsgi:application` comme start command.
- frontend : pointer la plateforme vers le dossier `frontend/`, definir `VITE_API_BASE_URL` avec l'URL publique du backend, puis executer `npm run build`.

Variables d'environnement backend conseillees sur Render :

- `SECRET_KEY` : une valeur secrete longue.
- `DEBUG` : `False`.
- `ALLOWED_HOSTS` : le domaine Render du backend, par exemple `mon-api.onrender.com`.
