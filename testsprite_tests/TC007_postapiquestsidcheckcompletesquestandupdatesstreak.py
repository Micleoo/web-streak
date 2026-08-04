import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_api_quests_id_check_completes_quest_and_updates_streak():
    session = requests.Session()
    # Use a unique email to register new user
    unique_suffix = str(uuid.uuid4()).replace('-', '')[:8]
    email = f"testuser_{unique_suffix}@example.com"
    password = "StrongPass!123"
    name = "Test User"

    headers_auth = {
        "Origin": BASE_URL,
        "Content-Type": "application/json"
    }

    # Sign up new user
    signup_payload = {
        "name": name,
        "email": email,
        "password": password
    }
    signup_resp = session.post(
        f"{BASE_URL}/api/auth/sign-up/email",
        json=signup_payload,
        headers=headers_auth,
        timeout=TIMEOUT
    )
    assert signup_resp.status_code == 200, f"Sign-up failed: {signup_resp.text}"

    # Sign in user
    signin_payload = {
        "email": email,
        "password": password
    }
    signin_resp = session.post(
        f"{BASE_URL}/api/auth/sign-in/email",
        json=signin_payload,
        headers=headers_auth,
        timeout=TIMEOUT
    )
    assert signin_resp.status_code == 200, f"Sign-in failed: {signin_resp.text}"

    # Confirm session cookie and get session
    headers_auth["Cookie"] = signin_resp.headers.get("set-cookie", "")
    headers_auth["Origin"] = BASE_URL
    session_resp = session.get(
        f"{BASE_URL}/api/auth/get-session",
        headers=headers_auth,
        timeout=TIMEOUT
    )
    assert session_resp.status_code == 200, f"Get session failed: {session_resp.text}"
    session_data = session_resp.json()
    # Should contain user session info
    assert "user" in session_data or "id" in session_data or session_data != {}, "Session data unexpected"

    # Create a new quest (required fields: title, timeGoalMinutes, category)
    quest_payload = {
        "title": "Test Quest for Streak",
        "timeGoalMinutes": 15,
        "category": "test-category"
    }
    quest_resp = session.post(
        f"{BASE_URL}/api/quests",
        json=quest_payload,
        headers=headers_auth,
        timeout=TIMEOUT
    )
    assert quest_resp.status_code == 201, f"Quest creation failed: {quest_resp.text}"
    quest = quest_resp.json()
    quest_id = quest.get("id")
    assert quest_id, "Created quest has no id"

    try:
        # POST to /api/quests/:id/check endpoint to complete quest and update streak
        check_resp = session.post(
            f"{BASE_URL}/api/quests/{quest_id}/check",
            headers=headers_auth,
            timeout=TIMEOUT
        )
        assert check_resp.status_code == 200, f"Quest check failed: {check_resp.text}"
        check_data = check_resp.json()
        
        # Validate response content per schema and convert numeric fields
        completed = check_data.get("completed")
        assert isinstance(completed, bool), "completed should be boolean"

        xp_gained_val = check_data.get("xpGained")
        assert xp_gained_val is not None, "xpGained is missing"
        try:
            xp_gained = int(xp_gained_val)
        except (TypeError, ValueError):
            assert False, "xpGained should be a number"

        streak_bonus = check_data.get("streakBonus")
        assert isinstance(streak_bonus, bool), "streakBonus should be boolean"

        grace_period_restored = check_data.get("gracePeriodRestored")
        assert isinstance(grace_period_restored, bool), "gracePeriodRestored should be boolean"

        new_streak_val = check_data.get("newStreak")
        assert new_streak_val is not None, "newStreak is missing"
        assert isinstance(new_streak_val, int), "newStreak should be int"

        total_xp_val = check_data.get("totalXp")
        assert total_xp_val is not None, "totalXp is missing"
        try:
            total_xp = int(total_xp_val)
        except (TypeError, ValueError):
            assert False, "totalXp should be a number"

        # completed should be True
        assert completed is True, "Quest should be marked as completed"

        # GET /api/me to validate updated streak and XP stats
        me_resp = session.get(
            f"{BASE_URL}/api/me",
            headers=headers_auth,
            timeout=TIMEOUT
        )
        assert me_resp.status_code == 200, f"Get user profile failed: {me_resp.text}"
        me_data = me_resp.json()

        current_streak = me_data.get("currentStreak")
        total_xp_profile = me_data.get("totalXp")

        assert isinstance(current_streak, int), "currentStreak missing or invalid"
        assert total_xp_profile is not None, "totalXp missing in profile"
        try:
            total_xp_profile_int = int(total_xp_profile)
        except (TypeError, ValueError):
            assert False, "totalXp missing or invalid"

        # Streak should be at least 1 (since quest completed today)
        assert current_streak >= 1, "currentStreak should be at least 1"
        # totalXp should be at least xpGained from the quest check
        assert total_xp_profile_int >= xp_gained, "totalXp should be >= xpGained from quest completion"

    finally:
        # Clean up: delete the created quest
        del_resp = session.delete(
            f"{BASE_URL}/api/quests/{quest_id}",
            headers=headers_auth,
            timeout=TIMEOUT
        )
        assert del_resp.status_code == 200, f"Failed to delete quest: {del_resp.text}"
        del_json = del_resp.json()
        assert del_json.get("success") is True, "Deleting quest returned success:false"

test_post_api_quests_id_check_completes_quest_and_updates_streak()