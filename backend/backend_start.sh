#!/bin/bash

# start the server
gunicorn -c backend/config.py -b :5000 backend.app:app;
