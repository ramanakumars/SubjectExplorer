#!/bin/bash

# start the server
gunicorn -c config.py -b :5000 app:app;
