import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_api_auth_signup_email_creates_user_with_valid_data():
    signup_url = f"{BASE_URL}/api/auth/sign-up/email"
    session_url = f"{BASE_URL}/api/auth/get-session"

    unique_suffix = uuid.uuid4().hex[:8]
    name = "Test User"
    email = f"testuser_{unique_suffix}@example.com"
    password = "ValidPassword123!"

    headers = {
        "Content-Type": "application/json",
    }
    payload = {
        "name": name,
        "email": email,
        "password": password
    }

    # Send POST request to sign-up endpoint
    response = requests.post(signup_url, json=payload, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    response_json = response.json()
    # Basic sanity check that auth object is present
    assert isinstance(response_json, dict), "Response is not a JSON object"
    assert "user" in response_json or "auth" in response_json or "session" in response_json or "token" in response_json or len(response_json) > 0, "Auth object not found in response"

    # Immediately call GET /api/auth/get-session to confirm session established
    # Extract cookies from signup response for this session call
    cookies = response.cookies

    session_response = requests.get(session_url, timeout=TIMEOUT, cookies=cookies, headers={"Origin": BASE_URL})
    assert session_response.status_code == 200, f"Session retrieval failed with status code {session_response.status_code}"
    session_data = session_response.json()
    assert isinstance(session_data, dict), "Session response is not a JSON object"
    # Check keys that commonly appear in session data, e.g., user info or session object
    assert "user" in session_data or "session" in session_data or len(session_data) > 0, "Session data missing expected keys"

test_post_api_auth_signup_email_creates_user_with_valid_data()