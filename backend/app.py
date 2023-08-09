from flask import Flask
from flask_cors import CORS
from project import project_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(project_bp)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
