# JuDE (JunoCam Data Explorer)

## Building and running the docker container (development)

### Starting the backend
Install the requirments and run the flask app. From the main repo folder, run:
```
python3 -m pip install -r backend/requirements.txt
python3 -m backend.app
```

This starts the backend server on `localhost:5000`.

### Starting the frontend
The frontend uses React, and you can start the server using NodeJS:
```
cd frontend/
npm i
npm run start
```

The app can then be accessed on `localhost:3000`.
