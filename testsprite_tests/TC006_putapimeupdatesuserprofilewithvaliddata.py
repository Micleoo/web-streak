import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
ORIGIN = "http://localhost:3000"
HEADERS_COMMON = {
    "Origin": ORIGIN,
    "Content-Type": "application/json"
}

def putapimeupdatesuserprofilewithvaliddata():
    session = requests.Session()
    # Generate unique user data for sign-up
    unique_suffix = uuid.uuid4().hex[:8]
    name_signup = f"TestUser{unique_suffix}"
    email_signup = f"testuser{unique_suffix}@example.com"
    password_signup = "TestPass123!"
    # Sign up new user
    try:
        signup_resp = session.post(
            f"{BASE_URL}/api/auth/sign-up/email",
            headers=HEADERS_COMMON,
            json={
                "name": name_signup,
                "email": email_signup,
                "password": password_signup
            },
            timeout=TIMEOUT
        )
        assert signup_resp.status_code == 200, f"Sign-up failed: {signup_resp.text}"

        # Sign in the user
        signin_resp = session.post(
            f"{BASE_URL}/api/auth/sign-in/email",
            headers=HEADERS_COMMON,
            json={
                "email": email_signup,
                "password": password_signup
            },
            timeout=TIMEOUT
        )
        assert signin_resp.status_code == 200, f"Sign-in failed: {signin_resp.text}"

        # Confirm session by GET /api/auth/get-session to get session cookie and verify auth
        session.headers.update({
            "Origin": ORIGIN
        })
        get_sess_resp = session.get(f"{BASE_URL}/api/auth/get-session", headers={"Origin": ORIGIN}, timeout=TIMEOUT)
        assert get_sess_resp.status_code == 200, f"Get session failed: {get_sess_resp.text}"

        # Prepare update profile data
        updated_name = f"UpdatedName{unique_suffix}"
        updated_username = f"updatedusername{unique_suffix}"
        updated_favorite_categories = ["productivity", "health", "learning"]

        # PUT /api/me to update user profile
        put_resp = session.put(
            f"{BASE_URL}/api/me",
            headers={"Origin": ORIGIN, "Content-Type": "application/json"},
            json={
                "name": updated_name,
                "username": updated_username,
                "favoriteCategories": updated_favorite_categories
            },
            timeout=TIMEOUT
        )
        assert put_resp.status_code == 200, f"PUT /api/me failed: {put_resp.text}"
        put_resp_json = put_resp.json()
        assert isinstance(put_resp_json, dict), "Response is not an object"
        # Check if the updated fields are correctly reflected in response
        assert put_resp_json.get("name") == updated_name, "Name not updated correctly"
        assert put_resp_json.get("username") == updated_username, "Username not updated correctly"
        # favoriteCategories can be different types, but expect list or string reflecting categories
        resp_fav_cats = put_resp_json.get("favoriteCategories")
        assert resp_fav_cats is not None, "favoriteCategories missing in response"
        # Accept both string or list (string likely)
        if isinstance(resp_fav_cats, str):
            for cat in updated_favorite_categories:
                assert cat in resp_fav_cats, f"Category {cat} not found in response favoriteCategories string"
        elif isinstance(resp_fav_cats, list):
            for cat in updated_favorite_categories:
                assert cat in resp_fav_cats, f"Category {cat} not found in response favoriteCategories list"
        else:
            assert False, "favoriteCategories has unexpected type"

        # GET /api/me to verify update persisted
        get_me_resp = session.get(
            f"{BASE_URL}/api/me",
            headers={"Origin": ORIGIN},
            timeout=TIMEOUT
        )
        assert get_me_resp.status_code == 200, f"GET /api/me failed: {get_me_resp.text}"
        profile_data = get_me_resp.json()
        assert profile_data.get("name") == updated_name, "Name not updated in GET /api/me"
        assert profile_data.get("username") == updated_username, "Username not updated in GET /api/me"
        # favoriteCategories may be string in profile, check presence of categories as substrings
        profile_fav_cats = profile_data.get("favoriteCategories")
        assert profile_fav_cats is not None, "favoriteCategories missing in GET /api/me response"
        if isinstance(profile_fav_cats, str):
            for cat in updated_favorite_categories:
                assert cat in profile_fav_cats, f"Category {cat} not found in GET /api/me favoriteCategories string"
        elif isinstance(profile_fav_cats, list):
            for cat in updated_favorite_categories:
                assert cat in profile_fav_cats, f"Category {cat} not found in GET /api/me favoriteCategories list"
        else:
            assert False, "favoriteCategories has unexpected type in GET /api/me"

    finally:
        # Sign out user to clean session
        try:
            session.post(f"{BASE_URL}/api/auth/sign-out", headers={"Origin": ORIGIN}, timeout=TIMEOUT)
        except Exception:
            pass

putapimeupdatesuserprofilewithvaliddata()