import os
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configure PostgreSQL database
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'postgres')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'sparkathon')
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')

app.config['SQLALCHEMY_DATABASE_URI'] = (
    f'postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# User schema
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    image = db.Column(db.String(255))  # Path to user image
    def as_dict(self):
        return {"id": self.id, "username": self.username, "email": self.email, "image": self.image}

# Product schema
class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255))
    image = db.Column(db.String(255))  # Path to product image
    def as_dict(self):
        return {"id": self.id, "name": self.name, "price": self.price, "description": self.description, "image": self.image}

@app.route('/')
def index():
    return jsonify({"message": "Welcome to the Sparkathon Flask API!"})

# User endpoints
@app.route('/users', methods=['POST'])
def create_user():
    data = request.json
    user = User(username=data['username'], email=data['email'])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.as_dict()), 201

@app.route('/users', methods=['GET'])
def list_users():
    users = User.query.all()
    return jsonify([u.as_dict() for u in users])

@app.route('/users/<int:user_id>/upload_image', methods=['POST'])
def upload_user_image(user_id):
    user = User.query.get_or_404(user_id)
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(f'user_{user_id}_' + file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        user.image = filename
        db.session.commit()
        return jsonify({'message': 'Image uploaded', 'image': filename})
    return jsonify({'error': 'Invalid file type'}), 400

# Product endpoints
@app.route('/products', methods=['POST'])
def create_product():
    data = request.json
    product = Product(name=data['name'], price=data['price'], description=data.get('description', ''))
    db.session.add(product)
    db.session.commit()
    return jsonify(product.as_dict()), 201

@app.route('/products', methods=['GET'])
def list_products():
    products = Product.query.all()
    return jsonify([p.as_dict() for p in products])

@app.route('/products/<int:product_id>/upload_image', methods=['POST'])
def upload_product_image(product_id):
    product = Product.query.get_or_404(product_id)
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(f'product_{product_id}_' + file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        product.image = filename
        db.session.commit()
        return jsonify({'message': 'Image uploaded', 'image': filename})
    return jsonify({'error': 'Invalid file type'}), 400

# Serve uploaded images
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)
