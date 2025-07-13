#!/usr/bin/env python3
"""
Test data setup script for Sparkathon API
Creates sample products for testing QR code functionality
"""
import requests
import json
import os

API_BASE_URL = "http://localhost:8000"

def create_test_user():
    """Create a test user for trying on products"""
    user_data = {
        "username": "testuser",
        "email": "test@example.com", 
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/api/users/", json=user_data)
        if response.status_code == 200:
            user = response.json()
            print(f"✓ Created test user: {user['username']} (ID: {user['id']})")
            return user
        else:
            print(f"✗ Failed to create test user: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"✗ Error creating test user: {e}")
        return None

def create_test_products():
    """Create test products with sample data"""
    
    products = [
        {
            "name": "Classic T-Shirt",
            "price": 25.99,
            "description": "A comfortable cotton t-shirt perfect for everyday wear"
        },
        {
            "name": "Denim Jeans",
            "price": 59.99,
            "description": "High-quality denim jeans with a modern fit"
        },
        {
            "name": "Summer Dress",
            "price": 45.00,
            "description": "Light and breezy summer dress for warm days"
        },
        {
            "name": "Hoodie",
            "price": 42.50,
            "description": "Cozy hoodie for cool weather"
        }
    ]
    
    created_products = []
    
    for product_data in products:
        try:
            response = requests.post(f"{API_BASE_URL}/api/products/", json=product_data)
            if response.status_code == 200:
                product = response.json()
                created_products.append(product)
                print(f"✓ Created product: {product['name']} (ID: {product['id']})")
            else:
                print(f"✗ Failed to create product {product_data['name']}: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"✗ Error creating product {product_data['name']}: {e}")
    
    return created_products

def generate_qr_codes(products):
    """Generate QR codes for the created products"""
    print("\nQR Code Data (Product IDs):")
    print("=" * 40)
    for product in products:
        print(f"Product: {product['name']}")
        print(f"QR Code Data: {product['id']}")
        print(f"Price: ${product['price']}")
        print("-" * 40)

if __name__ == "__main__":
    print("Creating test products for Sparkathon API...")
    print(f"API Base URL: {API_BASE_URL}")
    print("=" * 50)
    
    # Check if API is running
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✓ API is running")
        else:
            print("✗ API health check failed")
            exit(1)
    except requests.exceptions.RequestException:
        print("✗ Could not connect to API. Make sure the backend is running.")
        exit(1)
    
    # Create test user
    user = create_test_user()
    if not user:
        print("✗ Could not create test user. Try-on functionality will not work.")
    
    # Create test products
    products = create_test_products()
    
    if products:
        generate_qr_codes(products)
        print(f"\n✓ Successfully created {len(products)} test products")
        if user:
            print(f"✓ Test user created with ID: {user['id']}")
        print("\nTo test the QR functionality:")
        print("1. Use any QR code generator (like qr-code-generator.com)")
        print("2. Generate QR codes using the Product IDs shown above")
        print("3. Scan the QR codes using the Try-On screen in the app")
        if user:
            print(f"4. The app is configured to use user ID {user['id']} for testing")
    else:
        print("\n✗ No products were created")
