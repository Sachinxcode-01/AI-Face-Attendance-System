# Package marker for backend.ai.app
import sys
# Maintain alias compatibility for legacy smartface_pro_api.app imports
sys.modules.setdefault("smartface_pro_api.app", sys.modules[__name__])
