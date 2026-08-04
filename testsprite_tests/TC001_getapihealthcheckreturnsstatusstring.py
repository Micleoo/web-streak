import requests

def test_get_api_health_check_returns_status_string():
    base_url = "http://localhost:3000"
    timeout = 30

    try:
        response = requests.get(f"{base_url}/", timeout=timeout)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to health check endpoint failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    assert isinstance(response.text, str), "Response body is not a string"
    assert len(response.text.strip()) > 0, "Status string is empty"

test_get_api_health_check_returns_status_string()