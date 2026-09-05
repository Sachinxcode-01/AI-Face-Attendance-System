import reflex as rx
from .theme import Theme

class State(rx.State):
    """The app state."""
    username: str = ""
    password: str = ""
    is_logging_in: bool = False

    def set_username(self, username: str):
        self.username = username

    def set_password(self, password: str):
        self.password = password

    def handle_login(self):
        self.is_logging_in = True
        # Simulated successful login
        return rx.redirect("/dashboard")

def index() -> rx.Component:
    return rx.center(
        rx.vstack(
            # Logo Section
            rx.heading("SmartAttendance - AI", size="8", color=Theme.royal_gold, margin_bottom="1em"),
            rx.text("Secure Access Control Center", color=Theme.text_muted, margin_bottom="2em"),
            
            # Login Form
            rx.vstack(
                rx.input(
                    placeholder="Username",
                    on_change=State.set_username,
                    style={"background_color": "rgba(255, 255, 255, 0.05)", "border": f"1px solid {Theme.glass_border}"},
                    width="100%",
                ),
                rx.input(
                    placeholder="Password",
                    type="password",
                    on_change=State.set_password,
                    style={"background_color": "rgba(255, 255, 255, 0.05)", "border": f"1px solid {Theme.glass_border}"},
                    width="100%",
                ),
                rx.button(
                    "Authorize Session",
                    on_click=State.handle_login,
                    is_loading=State.is_logging_in,
                    style=Theme.button_gold,
                    width="100%",
                    margin_top="1em",
                ),
                spacing="4",
                width="100%",
            ),
            
            style=Theme.glass_panel,
            padding="3em",
            width="400px",
            align_items="center",
        ),
        height="100vh",
        background=f"radial-gradient(circle at top, #1E293B 0%, {Theme.midnight_navy} 100%)",
    )

from .pages.dashboard import dashboard_view

app = rx.App(
    theme=rx.theme(
        appearance="dark",
        has_background=True,
        accent_color="amber",
    )
)
app.add_page(index)
app.add_page(dashboard_view, route="/dashboard")
