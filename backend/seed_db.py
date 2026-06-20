from database import SessionLocal, engine, Base
import models

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()

    # ── 1. Categories ──────────────────────────────────────────────────────────
    def get_or_create_category(name, color):
        cat = db.query(models.ProductCategory).filter_by(name=name).first()
        if not cat:
            cat = models.ProductCategory(name=name, color=color)
            db.add(cat)
            db.commit()
            db.refresh(cat)
        return cat

    burgers_cat   = get_or_create_category("Burgers",   "#F97316")   # orange
    pizza_cat     = get_or_create_category("Pizza",     "#EF4444")   # red
    pasta_cat     = get_or_create_category("Pasta",     "#A855F7")   # purple
    beverages_cat = get_or_create_category("Beverages", "#3B82F6")   # blue
    desserts_cat  = get_or_create_category("Desserts",  "#EC4899")   # pink

    # ── 2. Products ────────────────────────────────────────────────────────────
    products = [
        # Burgers
        {"name": "Classic Smash Burger",       "price": 12.50, "cat": burgers_cat.id,   "desc": "Smashed beef patty, American cheese, pickles, special sauce"},
        {"name": "Double Patty Burger",        "price": 15.00, "cat": burgers_cat.id,   "desc": "Two beef patties, double cheese, caramelized onions"},
        {"name": "BBQ Bacon Burger",           "price": 14.50, "cat": burgers_cat.id,   "desc": "Crispy bacon, BBQ sauce, cheddar, onion rings"},
        {"name": "Crispy Chicken Burger",      "price": 13.00, "cat": burgers_cat.id,   "desc": "Fried chicken thigh, coleslaw, honey mustard"},
        {"name": "Mushroom Swiss Burger",      "price": 13.50, "cat": burgers_cat.id,   "desc": "Sautéed mushrooms, Swiss cheese, garlic aioli"},
        {"name": "Veggie Burger",              "price": 11.00, "cat": burgers_cat.id,   "desc": "Black bean patty, avocado, lettuce, tomato"},

        # Pizza
        {"name": "Margherita Pizza",           "price": 13.00, "cat": pizza_cat.id,     "desc": "Classic tomato base, fresh mozzarella, basil"},
        {"name": "Pepperoni Pizza",            "price": 15.50, "cat": pizza_cat.id,     "desc": "Loaded pepperoni, mozzarella, tomato sauce"},
        {"name": "BBQ Chicken Pizza",          "price": 16.00, "cat": pizza_cat.id,     "desc": "Grilled chicken, BBQ sauce, red onion, cheddar"},
        {"name": "Four Cheese Pizza",          "price": 16.50, "cat": pizza_cat.id,     "desc": "Mozzarella, cheddar, parmesan, gorgonzola"},
        {"name": "Veggie Supreme Pizza",       "price": 14.50, "cat": pizza_cat.id,     "desc": "Bell peppers, olives, mushrooms, onion, tomato"},
        {"name": "Spicy Jalapeño Pizza",       "price": 15.00, "cat": pizza_cat.id,     "desc": "Jalapeños, chorizo, mozzarella, sriracha drizzle"},

        # Pasta
        {"name": "Spaghetti Carbonara",        "price": 14.00, "cat": pasta_cat.id,     "desc": "Pancetta, egg, parmesan, black pepper"},
        {"name": "Penne Arrabbiata",           "price": 12.50, "cat": pasta_cat.id,     "desc": "Spicy tomato sauce, garlic, fresh chili"},
        {"name": "Fettuccine Alfredo",         "price": 13.50, "cat": pasta_cat.id,     "desc": "Creamy butter-parmesan sauce, fettuccine"},
        {"name": "Pasta Bolognese",            "price": 14.50, "cat": pasta_cat.id,     "desc": "Slow-cooked beef ragu, rigatoni, parmesan"},
        {"name": "Pesto Farfalle",             "price": 12.00, "cat": pasta_cat.id,     "desc": "Basil pesto, cherry tomatoes, pine nuts"},
        {"name": "Mac & Cheese",               "price": 11.00, "cat": pasta_cat.id,     "desc": "Creamy four-cheese sauce, toasted breadcrumbs"},

        # Beverages
        {"name": "Espresso",                   "price":  3.50, "cat": beverages_cat.id, "desc": "Single shot of rich Italian espresso"},
        {"name": "Cappuccino",                 "price":  4.50, "cat": beverages_cat.id, "desc": "Espresso with steamed milk foam"},
        {"name": "Iced Latte",                 "price":  5.00, "cat": beverages_cat.id, "desc": "Espresso over ice with cold milk"},
        {"name": "Caramel Frappuccino",        "price":  5.50, "cat": beverages_cat.id, "desc": "Blended coffee, caramel, whipped cream"},
        {"name": "Coca-Cola",                  "price":  3.00, "cat": beverages_cat.id, "desc": "Classic Coke, 330 ml"},
        {"name": "Fresh Lemonade",             "price":  4.00, "cat": beverages_cat.id, "desc": "Freshly squeezed lemon, mint, sparkling water"},
        {"name": "Mango Smoothie",             "price":  5.00, "cat": beverages_cat.id, "desc": "Alphonso mango, yogurt, honey"},
        {"name": "Iced Tea",                   "price":  3.50, "cat": beverages_cat.id, "desc": "Black tea, lemon, served over ice"},
        {"name": "Hot Chocolate",              "price":  4.50, "cat": beverages_cat.id, "desc": "Rich Belgian chocolate, steamed milk"},

        # Desserts
        {"name": "Chocolate Lava Cake",        "price":  7.50, "cat": desserts_cat.id,  "desc": "Warm chocolate cake with molten center, vanilla ice cream"},
        {"name": "New York Cheesecake",        "price":  7.00, "cat": desserts_cat.id,  "desc": "Classic baked cheesecake with berry compote"},
        {"name": "Tiramisu",                   "price":  6.50, "cat": desserts_cat.id,  "desc": "Espresso-soaked ladyfingers, mascarpone cream"},
        {"name": "Crème Brûlée",               "price":  7.00, "cat": desserts_cat.id,  "desc": "Silky vanilla custard with caramelized sugar top"},
        {"name": "Brownie Sundae",             "price":  6.00, "cat": desserts_cat.id,  "desc": "Warm fudge brownie, vanilla ice cream, chocolate sauce"},
        {"name": "Seasonal Fruit Tart",        "price":  6.50, "cat": desserts_cat.id,  "desc": "Buttery pastry shell, vanilla cream, fresh seasonal fruits"},
    ]

    added = 0
    for p in products:
        exists = db.query(models.ProductProduct).filter_by(name=p["name"]).first()
        if not exists:
            db.add(models.ProductProduct(
                name=p["name"],
                list_price=p["price"],
                categ_id=p["cat"],
                description=p.get("desc", ""),
                available_in_pos=True,
                show_in_kds=True,
            ))
            added += 1

    # ── 3. Floors and Tables ───────────────────────────────────────────────────
    floor = db.query(models.RestaurantFloor).filter_by(name="Main Floor").first()
    if not floor:
        floor = models.RestaurantFloor(name="Main Floor")
        db.add(floor)
        db.commit()
        db.refresh(floor)

    for t_num in range(1, 13):
        exists = db.query(models.RestaurantTable).filter_by(name=str(t_num)).first()
        if not exists:
            db.add(models.RestaurantTable(name=str(t_num), floor_id=floor.id, seats=4))

    db.commit()
    print(f"Database seeded successfully! Added {added} new products.")
    db.close()

if __name__ == "__main__":
    seed()

