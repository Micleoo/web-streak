import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_getapime_fetches_authenticated_user_profile():
    # Test data for signup and signin
    signup_data = {
        "name": "Test User TC005",
        "email": "testuser_tc005@example.com",
        "password": "TestPassword123!"
    }
    headers = {
        "Origin": BASE_URL
    }
    session = requests.Session()
    try:
        # Sign up the user
        signup_resp = session.post(f"{BASE_URL}/api/auth/sign-up/email", json=signup_data, headers=headers, timeout=TIMEOUT)
        assert signup_resp.status_code == 200, f"Signup failed with status code {signup_resp.status_code}"
        
        # Sign in the user
        signin_data = {
            "email": signup_data["email"],
            "password": signup_data["password"]
        }
        signin_resp = session.post(f"{BASE_URL}/api/auth/sign-in/email", json=signin_data, headers=headers, timeout=TIMEOUT)
        assert signin_resp.status_code == 200, f"Signin failed with status code {signin_resp.status_code}"
        
        # Include cookie and origin in headers automatically handled by session
        # Request authenticated user profile
        profile_resp = session.get(f"{BASE_URL}/api/me", headers={"Origin": BASE_URL}, timeout=TIMEOUT)
        assert profile_resp.status_code == 200, f"GET /api/me failed with status code {profile_resp.status_code}"
        profile_json = profile_resp.json()
        
        # Validate required fields in the response
        required_fields = ["id", "name", "username", "email", "currentStreak", "maxStreak", "totalXp", "favoriteCategories", "streakAtRisk", "gracePeriodUntil"]
        for field in required_fields:
            assert field in profile_json, f"Field '{field}' missing in profile response"
        
        # Validate field types
        assert isinstance(profile_json["id"], str)
        assert isinstance(profile_json["name"], str)
        assert isinstance(profile_json["username"], str)
        assert isinstance(profile_json["email"], str)
        assert isinstance(profile_json["currentStreak"], (int, float))
        assert isinstance(profile_json["maxStreak"], (int, float))
        assert isinstance(profile_json["totalXp"], (int, float))
        assert isinstance(profile_json["favoriteCategories"], str)
        assert isinstance(profile_json["streakAtRisk"], bool)
        assert isinstance(profile_json["gracePeriodUntil"], str)
        
    finally:
        # Sign out to clean up session cookie
        session.post(f"{BASE_URL}/api/auth/sign-out", headers={"Origin": BASE_URL}, timeout=TIMEOUT)