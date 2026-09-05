import reflex as rx
from .. import theme
Theme = theme.Theme

class DashboardState(rx.State):
    """State for the Admin Dashboard."""
    total_students: int = 450
    present_today: int = 382
    threats_detected: int = 2
    system_status: str = "Operational"
    
    # Session Control
    selected_subject: str = "Computer Science"
    is_session_active: bool = False
    
    subjects: list[str] = ["Computer Science", "Artificial Intelligence", "Cyber Security", "Data Structures"]

    attendance_data: list[dict] = [
        {"name": "Mon", "value": 380},
        {"name": "Tue", "value": 410},
        {"name": "Wed", "value": 395},
        {"name": "Thu", "value": 382},
        {"name": "Fri", "value": 420},
    ]
    
    security_logs: list[dict] = [
        {"time": "10:45 AM", "event": "Unrecognized Face", "location": "Main Entrance", "severity": "High"},
        {"time": "09:30 AM", "event": "Session Started", "location": "Room 302", "severity": "Info"},
        {"time": "08:15 AM", "event": "System Audit", "location": "Server Room", "severity": "Low"},
        {"time": "07:45 AM", "event": "DB Backup", "location": "Cloud Storage", "severity": "Low"},
    ]

    def set_selected_subject(self, selected_subject: str):
        self.selected_subject = selected_subject

    def toggle_session(self):
        self.is_session_active = not self.is_session_active
        # In a real app, this would trigger the core/attendance_system.py via API
        if self.is_session_active:
            self.system_status = f"Active: {self.selected_subject}"
        else:
            self.system_status = "Operational"

def stat_card(label: str, value: str, icon: str, color: str) -> rx.Component:
    return rx.vstack(
        rx.hstack(
            rx.icon(tag=icon, color=color, size=24),
            rx.text(label, color=Theme.text_muted, font_size="0.9em"),
            width="100%",
            justify="between",
        ),
        rx.heading(value, size="7", color="white", margin_top="0.2em"),
        style=Theme.glass_panel,
        padding="1.5em",
        width="100%",
    )

def log_row(log: dict) -> rx.Component:
    severity_color = rx.match(
        log["severity"],
        ("High", "red"),
        ("Info", "blue"),
        ("Low", "green"),
        "gray"
    )
    return rx.table.row(
        rx.table.cell(log["time"]),
        rx.table.cell(log["event"]),
        rx.table.cell(log["location"]),
        rx.table.cell(rx.badge(log["severity"], color_scheme=severity_color)),
    )

def dashboard_view() -> rx.Component:
    return rx.vstack(
        # Top Navigation
        rx.hstack(
            rx.heading("SmartAttendance - AI", size="6", color=Theme.royal_gold),
            rx.spacer(),
            rx.badge(DashboardState.system_status, color_scheme="green", variant="surface"),
            rx.avatar(fallback="AD", variant="soft", color_scheme="amber"),
            width="100%",
            padding="1em 2em",
            align_items="center",
            border_bottom=f"1px solid {Theme.glass_border}",
        ),
        
        # Main Content
        rx.grid(
            # Column 1: Stats, Charts & Security Logs
            rx.vstack(
                rx.hstack(
                    stat_card("Total Enrolled", str(DashboardState.total_students), "users", Theme.royal_gold),
                    stat_card("Active Today", str(DashboardState.present_today), "check-check", "#10B981"),
                    stat_card("Security Alerts", str(DashboardState.threats_detected), "shield-alert", "#EF4444"),
                    spacing="4",
                    width="100%",
                ),
                
                # Chart
                rx.vstack(
                    rx.heading("Attendance Trends", size="4", color="white", margin_bottom="1em"),
                    rx.recharts.bar_chart(
                        rx.recharts.bar(
                            data_key="value",
                            stroke=Theme.royal_gold,
                            fill=Theme.royal_gold,
                        ),
                        rx.recharts.x_axis(data_key="name"),
                        rx.recharts.y_axis(),
                        rx.recharts.cartesian_grid(stroke_dasharray="3 3", vertical=False),
                        rx.recharts.graphing_tooltip(),
                        data=DashboardState.attendance_data,
                        width="100%",
                        height=300,
                    ),
                    style=Theme.glass_panel,
                    padding="2em",
                    width="100%",
                ),

                # Security Logs
                rx.vstack(
                    rx.heading("Security & Event Logs", size="4", color="white", margin_bottom="1em"),
                    rx.table.root(
                        rx.table.header(
                            rx.table.row(
                                rx.table.column_header_cell("Time"),
                                rx.table.column_header_cell("Event"),
                                rx.table.column_header_cell("Location"),
                                rx.table.column_header_cell("Severity"),
                            )
                        ),
                        rx.table.body(
                            rx.foreach(DashboardState.security_logs, log_row)
                        ),
                        width="100%",
                    ),
                    style=Theme.glass_panel,
                    padding="2em",
                    width="100%",
                ),
                spacing="6",
                width="100%",
            ),
            
            # Column 2: Session Control, Live Feed & AI
            rx.vstack(
                # Session Control
                rx.vstack(
                    rx.heading("Session Control", size="4", color="white"),
                    rx.select(
                        DashboardState.subjects,
                        value=DashboardState.selected_subject,
                        on_change=DashboardState.set_selected_subject,
                        width="100%",
                        style={"background_color": "rgba(255, 255, 255, 0.05)"},
                    ),
                    rx.button(
                        rx.cond(DashboardState.is_session_active, "Terminate Session", "Start Recognition"),
                        on_click=DashboardState.toggle_session,
                        color_scheme=rx.cond(DashboardState.is_session_active, "red", "amber"),
                        width="100%",
                        margin_top="1em",
                    ),
                    style=Theme.glass_panel,
                    padding="1.5em",
                    width="100%",
                    border_bottom=f"4px solid {Theme.royal_gold}",
                ),
                
                # Camera Feed Placeholder
                rx.vstack(
                    rx.heading("Tactical Live Feed", size="4", color="white"),
                    rx.center(
                        rx.icon(tag="video", size=48, color="#94A3B8"),
                        rx.text("Camera Initializing...", color="#94A3B8", margin_top="1em"),
                        width="100%",
                        height="300px",
                        background="black",
                        border_radius="12px",
                        border=f"2px solid {Theme.glass_border}",
                    ),
                    style=Theme.glass_panel,
                    padding="1.5em",
                    width="100%",
                ),
                
                # Leave Requests Review
                rx.vstack(
                    rx.heading("Pending Leave Requests", size="4", color="white"),
                    rx.vstack(
                        rx.hstack(
                            rx.avatar(fallback="AJ", size="1"),
                            rx.vstack(
                                rx.text("Alex Johnson", font_weight="bold", color="white", font_size="0.9em"),
                                rx.text("Medical Checkup", color=Theme.text_muted, font_size="0.8em"),
                                spacing="0",
                            ),
                            rx.spacer(),
                            rx.button("Review", size="1", color_scheme="amber", variant="soft"),
                            width="100%",
                            align_items="center",
                            padding="0.5em",
                            border_radius="8px",
                            background="rgba(255, 255, 255, 0.03)",
                        ),
                        rx.hstack(
                            rx.avatar(fallback="SW", size="1"),
                            rx.vstack(
                                rx.text("Sarah Williams", font_weight="bold", color="white", font_size="0.9em"),
                                rx.text("Family Event", color=Theme.text_muted, font_size="0.8em"),
                                spacing="0",
                            ),
                            rx.spacer(),
                            rx.button("Review", size="1", color_scheme="amber", variant="soft"),
                            width="100%",
                            align_items="center",
                            padding="0.5em",
                            border_radius="8px",
                            background="rgba(255, 255, 255, 0.03)",
                        ),
                        width="100%",
                        spacing="2",
                    ),
                    style=Theme.glass_panel,
                    padding="1.5em",
                    width="100%",
                ),
                
                # AI Analyst Insight
                rx.vstack(
                    rx.heading("🧠 AI Security Analyst", size="4", color=Theme.royal_gold),
                    rx.text(
                        "Attendance is stable. One leave request from Sarah Williams is pending medical documentation. Security status: Clear.",
                        color="white",
                        font_style="italic",
                        font_size="0.9em",
                    ),
                    style=Theme.glass_panel,
                    padding="1.5em",
                    width="100%",
                    border_left=f"4px solid {Theme.royal_gold}",
                ),

                # Administrative Actions
                rx.vstack(
                    rx.heading("Admin Actions", size="4", color="white"),
                    rx.button("Manage Student Records", variant="outline", width="100%", color_scheme="gray"),
                    rx.button("Export Attendance Report", variant="outline", width="100%", color_scheme="gray"),
                    rx.button("Configure Biometric Threshold", variant="outline", width="100%", color_scheme="gray"),
                    spacing="2",
                    width="100%",
                    style=Theme.glass_panel,
                    padding="1.5em",
                ),
                spacing="6",
                width="100%",
            ),
            
            grid_template_columns="2fr 1fr",
            width="100%",
            padding="2em",
            spacing="6",
        ),
        
        width="100%",
        min_height="100vh",
        background="#0F172A",
    )
