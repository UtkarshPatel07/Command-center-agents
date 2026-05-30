import requests
import sys

token = "EAALT9ZAJpkd0BRoDj7vTIOxnZBJctpOPffN6GR0jLbXNFjgaJvEhZCNZBzzcVZBVgKJuc6ATespjWMEfAfOdksr5DaooEY2heYjIG74AFiYN3WLAGiBiOa3M7MVmDhZC7Q09CXDU2ZAbQl2WxB2lYzPHm0z9gsf837AUVI8QUsS5nNTDeKU6g8exwifRSwS0ZAkEyCwnS7LOkS4tuBZA4BjrqzGy4NVgjCuf4Ne35Ye51WimyRNJ1KdG7TaIIeFZCruXylJLITvebzFrGZCClzdCtZC4"
url = f"https://graph.facebook.com/me?access_token={token}"

try:
    resp = requests.get(url, timeout=5)
    print("STATUS:", resp.status_code)
    print("JSON:", resp.json())
except Exception as e:
    print("ERROR:", str(e))
