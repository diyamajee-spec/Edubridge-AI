import requests
import json
import uuid

BASE_URL = "http://127.0.0.1:8000/api/auth"

def test_auth_flow():
    # Scenario A: Register new student
    test_email = f"test_student_{uuid.uuid4().hex[:6]}@example.com " # add space to test trim
    test_password = "SecurePassword123!"
    
    print(f"--- Scenario A: Registering Student {test_email} ---")
    register_payload = {
        "email": test_email,
        "name": "Test Student",
        "password": test_password,
        "role": "student"
    }
    
    # We will simulate Next.js frontend by trimming before sending
    trimmed_email = register_payload["email"].strip()
    register_payload["email"] = trimmed_email
    
    r_reg = requests.post(f"{BASE_URL}/register", json=register_payload)
    print(f"Register Response: {r_reg.status_code}")
    if r_reg.status_code != 201:
        print("Registration failed:", r_reg.text)
        return
        
    print("Registration successful.")
    reg_data = r_reg.json()
    print("Register response includes user object:", reg_data.get("user") is not None)
    
    print("\n--- Simulating Logout (Discarding tokens) ---")
    
    print("\n--- Scenario B: Login with same credentials ---")
    login_payload = {
        "email": trimmed_email,
        "password": test_password
    }
    
    r_log = requests.post(f"{BASE_URL}/login", json=login_payload)
    print(f"Login Response: {r_log.status_code}")
    if r_log.status_code != 200:
        print("Login failed:", r_log.text)
        return
        
    print("Login successful.")
    log_data = r_log.json()
    print("Login response includes user object:", log_data.get("user") is not None)
    
if __name__ == "__main__":
    test_auth_flow()
