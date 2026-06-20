import requests

payload = {
    "name": "ORD-TEST-1234",
    "table_id": None,
    "customer_name": "Test User",
    "customer_phone": "1234567890",
    "state": "Pending",
    "amount_total": 13.0,
    "payment_method": "Cash",
    "generated_coupon": None,
    "lines": [
        {
            "product_id": 1,
            "qty": 1,
            "price_unit": 13.0,
            "price_subtotal": 13.0,
            "state_kitchen": "To Cook"
        }
    ]
}

response = requests.post('http://localhost:8000/api/orders', json=payload)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
