import requests

def test_post_api_cron_daily():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/cron/daily"
    try:
        response = requests.post(url, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to POST /api/cron/daily failed: {e}"
    else:
        json_data = response.json()
        assert isinstance(json_data, dict), "Response is not a JSON object"
        assert "success" in json_data, "Response missing 'success' field"
        assert json_data["success"] is True, "'success' is not True"
        assert "streaksUpdated" in json_data, "Response missing 'streaksUpdated' field"
        assert isinstance(json_data["streaksUpdated"], int), "'streaksUpdated' is not an integer"

test_post_api_cron_daily()