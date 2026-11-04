# Package marker for backend.ai
import sys
# Maintain alias compatibility for legacy smartface_pro_api imports
sys.modules.setdefault("smartface_pro_api", sys.modules[__name__])
