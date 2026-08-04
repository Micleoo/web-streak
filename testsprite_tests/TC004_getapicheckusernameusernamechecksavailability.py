import requests
import urllib.parse

def test_get_api_check_username_availability():
    base_url = "http://localhost:3000"
    # Use a valid username expected by the API to avoid 400 Bad Request
    test_username = "testusercheckapi"
    encoded_username = urllib.parse.quote(test_username, safe='')
    url = f"{base_url}/api/check-username/{encoded_username}"
    timeout = 30

    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "available" in data, "'available' key not found in response"
    assert isinstance(data["available"], bool), f"Expected 'available' to be boolean, got {type(data['available'])}"

test_get_api_check_username_availability()
