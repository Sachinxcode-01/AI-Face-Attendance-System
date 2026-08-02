import reflex as rx  # type: ignore

config = rx.Config(
    app_name="smartface_pro_web",
    plugins=[
        rx.plugins.SitemapPlugin(),
        rx.plugins.TailwindV4Plugin(),
    ]
)