import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_getapi_leaderboard_retrieves_top_ranked_users():
    session = requests.Session()
    headers = {
        "Origin": "http://localhost:3000",
        "Content-Type": "application/json"
    }

    unique_suffix = str(uuid.uuid4()).replace('-', '')[:8]
    test_email = f"testuser_{unique_suffix}@example.com"
    test_password = "TestPassword123!"

    # Step 0: Register user
    signup_payload = {
        "name": "Test User",
        "email": test_email,
        "password": test_password
    }
    signup_resp = session.post(
        f"{BASE_URL}/api/auth/sign-up/email",
        json=signup_payload,
        headers=headers,
        timeout=TIMEOUT,
    )
    assert signup_resp.status_code == 200, f"Sign-up failed: {signup_resp.text}"

    # Step 1: Authenticate user to obtain session cookie
    signin_payload = {
        "email": test_email,
        "password": test_password
    }
    signin_resp = session.post(
        f"{BASE_URL}/api/auth/sign-in/email",
        json=signin_payload,
        headers=headers,
        timeout=TIMEOUT,
    )
    assert signin_resp.status_code == 200, f"Sign-in failed: {signin_resp.text}"

    # Step 2: Access GET /api/leaderboard with tab=global
    params_global = {"tab": "global"}
    leaderboard_global_resp = session.get(
        f"{BASE_URL}/api/leaderboard",
        headers=headers,
        params=params_global,
        timeout=TIMEOUT,
    )
    assert leaderboard_global_resp.status_code == 200, f"Global leaderboard fetch failed: {leaderboard_global_resp.text}"
    json_global = leaderboard_global_resp.json()
    assert "tab" in json_global and json_global["tab"] == "global", "Global tab not returned correctly"
    assert "leaderboard" in json_global and isinstance(json_global["leaderboard"], list), "Global leaderboard data missing or invalid"

    # Step 3: Access GET /api/leaderboard with tab=friends
    params_friends = {"tab": "friends"}
    leaderboard_friends_resp = session.get(
        f"{BASE_URL}/api/leaderboard",
        headers=headers,
        params=params_friends,
        timeout=TIMEOUT,
    )
    assert leaderboard_friends_resp.status_code == 200, f"Friends leaderboard fetch failed: {leaderboard_friends_resp.text}"
    json_friends = leaderboard_friends_resp.json()
    assert "tab" in json_friends and json_friends["tab"] == "friends", "Friends tab not returned correctly"
    assert "leaderboard" in json_friends and isinstance(json_friends["leaderboard"], list), "Friends leaderboard data missing or invalid"

test_getapi_leaderboard_retrieves_top_ranked_users()