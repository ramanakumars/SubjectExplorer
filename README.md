# Zooniverse Subject Explorer

The goal of this app is to explore subject metadata of projects hosted on Zooniverse.

## Building and running the Docker container

Run the docker using the following command which will host the app on port 80:
```
docker-compose -f docker-compose.yml up --build
```

## Building and running the development version

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
