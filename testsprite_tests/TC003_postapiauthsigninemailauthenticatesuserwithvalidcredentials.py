import requests
import uuid

base_url = "http://localhost:3000"

def test_postapiauthsigninemailauthenticatesuserwithvalidcredentials():
    sign_up_url = f"{base_url}/api/auth/sign-up/email"
    sign_in_url = f"{base_url}/api/auth/sign-in/email"
    get_session_url = f"{base_url}/api/auth/get-session"
    headers = {
        "Origin": "http://localhost:3000",
        "Content-Type": "application/json"
    }

    unique_suffix = str(uuid.uuid4()).replace('-', '')[:8]
    valid_email = f"testuser_{unique_suffix}@example.com"
    valid_password = "StrongPassword123!"

    session = requests.Session()

    try:
        # Register user first
        signup_payload = {
            "name": "Test User",
            "email": valid_email,
            "password": valid_password
        }
        signup_resp = session.post(sign_up_url, json=signup_payload, headers=headers, timeout=30)
        assert signup_resp.status_code == 200, f"Expected status 200 on signup, got {signup_resp.status_code}"

        # POST /api/auth/sign-in/email
        payload = {
            "email": valid_email,
            "password": valid_password
        }
        response = session.post(sign_in_url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
        auth_obj = response.json()
        assert isinstance(auth_obj, dict), "Response should be a JSON object"
        # Check auth object contains at least a user or token field (based on typical auth response)
        assert "user" in auth_obj or "token" in auth_obj, "Auth object missing 'user' or 'token' field"

        # Use cookies set from sign-in for session call
        cookies = response.cookies
        # GET /api/auth/get-session with session cookie and Origin
        get_session_headers = {
            "Origin": "http://localhost:3000",
            "Cookie": "; ".join([f"{k}={v}" for k,v in cookies.items()])
        }
        session_response = session.get(get_session_url, headers=get_session_headers, timeout=30)
        assert session_response.status_code == 200, f"Expected status 200 from get-session, got {session_response.status_code}"
        session_obj = session_response.json()
        assert isinstance(session_obj, dict), "Session response should be a JSON object"
        # Check session object indicates active session, typically with user info or session token
        assert "user" in session_obj or "session" in session_obj, "Session object should contain user/session info"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_postapiauthsigninemailauthenticatesuserwithvalidcredentials()