import reflex as rx

class Theme:
    # Colors
    midnight_navy = "#0F172A"
    royal_gold = "#D4AF37"
    text_muted = "#94A3B8"
    glass_border = "rgba(212, 175, 55, 0.2)"
    
    # Styles
    glass_panel = {
        "background_color": "rgba(15, 23, 42, 0.8)",
        "backdrop_filter": "blur(12px)",
        "border": f"1px solid {glass_border}",
        "border_radius": "24px",
        "box_shadow": "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    }
    
    button_gold = {
        "background_color": royal_gold,
        "color": "#0F172A",
        "font_weight": "bold",
        "border_radius": "12px",
        "_hover": {
            "background_color": "#E5C158",
            "transform": "scale(1.02)",
        },
        "transition": "all 0.2s ease",
    }
