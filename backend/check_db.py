from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check pos_order columns
    result = conn.execute(text(
        "SELECT column_name, is_nullable, data_type FROM information_schema.columns "
        "WHERE table_name = 'pos_order' ORDER BY ordinal_position"
    ))
    print("=== pos_order columns ===")
    for row in result:
        print(f"  {row[0]:25s} nullable={row[1]:5s} type={row[2]}")

    # Check product data
    print("\n=== product_product sample ===")
    result2 = conn.execute(text("SELECT id, name, uom_id, list_price FROM product_product LIMIT 5"))
    for row in result2:
        print(f"  id={row[0]}, name={row[1]}, uom_id={row[2]}, price={row[3]}")

    # Check if any orders exist
    print("\n=== existing orders ===")
    result3 = conn.execute(text("SELECT id, name, state, amount_total, generated_coupon FROM pos_order LIMIT 5"))
    rows = result3.fetchall()
    if rows:
        for row in rows:
            print(f"  id={row[0]}, name={row[1]}, state={row[2]}, total={row[3]}, coupon={row[4]}")
    else:
        print("  No orders found")

    # Check cafe_coupon table
    print("\n=== cafe_coupon table ===")
    try:
        result4 = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'cafe_coupon' ORDER BY ordinal_position"
        ))
        cols = result4.fetchall()
        if cols:
            print("  Columns:", [c[0] for c in cols])
        else:
            print("  Table does not exist!")
    except Exception as e:
        print(f"  Error: {e}")
