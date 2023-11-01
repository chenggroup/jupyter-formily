import anywidget
import traitlets
import os
from ._contant import PARENT_DIR_PATH
from IPython.display import display

ESM = os.path.join(PARENT_DIR_PATH, f"vendor{os.sep}formily{os.sep}dist{os.sep}Toast.js")
CSS = os.path.join(PARENT_DIR_PATH, f"vendor{os.sep}formily{os.sep}dist{os.sep}Toast.css")


class Toast(anywidget.AnyWidget):
    _esm = ESM
    _css = CSS
    on_click = traitlets.Bool().tag(sync=True)
    type = traitlets.Enum(["info", "success", "error", "warning", "confirm"], "info").tag(sync=True)
    component = traitlets.Enum(["notification", "message", "modal"], "message").tag(sync=True)
    content = traitlets.Unicode("").tag(sync=True)
    props = traitlets.Dict({}).tag(sync=True)
    config = traitlets.Dict({}).tag(sync=True)

    # on_confirm function's first argv is required
    # eg:
    #     def on_confirm(change):
    #         do something
    def __init__(self, type="info", content="", options=None, on_confirm=lambda x: x):
        super(Toast, self).__init__()
        self.type = type
        self.content = content
        self.props = options and options.get("props") or {}
        self.config = options and options.get("config") or {}
        self.component = options and options.get("component") or "message"
        self.observe(on_confirm, names='on_click')

    def display(self):
        display(self)