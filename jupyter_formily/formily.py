import anywidget
import traitlets
import os
from ._contant import PARENT_DIR_PATH
from IPython.display import display
import time

ESM = os.path.join(PARENT_DIR_PATH, f"vendor{os.sep}formily{os.sep}dist{os.sep}Formily.js")
CSS = os.path.join(PARENT_DIR_PATH, f"vendor{os.sep}formily{os.sep}dist{os.sep}Formily.css")


default_schema = {
  "type": "object",
  "properties": {
      "example": {
        "type": "string",
        "title": "Example",
        "x-decorator": "FormItem",
        "x-component": "Input",
        "x-validator": [],
        "x-component-props": {},
        "x-decorator-props": {},
        "x-designable-id": "cgp0vw9a874",
        "x-index": 0,
        "name": "example"
      },
      "tip": {
        "type": "string",
        "x-component": "Text",
        "x-component-props": {
          "content": "Go to: https://designable-antd.formilyjs.org/ design form, and generate JSON schema",
          "style": {
            "margin": "0px 0px 0px 0px",
            "display": "flex",
            "justifyContent": "center"
          }
        },
        "x-designable-id": "tucchh62ask",
        "x-index": 1
      }
  }
}

class Formily(anywidget.AnyWidget):
    _esm = ESM
    _css = CSS

    # generate schema from https://designable-antd.formilyjs.org/
    schema = traitlets.Dict({}).tag(sync=True)
    value = traitlets.Dict({}).tag(sync=True)
    options = traitlets.Dict({
        "show_modal": True,
        "ok_label": "OK",
        "cancel_label": "Cancel",
        "ok_props": {},
        "cancel_props": {},
        "form_props": {},
        "modal_props": {},
    }).tag(sync=True)
    
    # variable for custom file selector
    os_sep= traitlets.Unicode(os.sep).tag(sync=True)
    event_content = traitlets.Dict({"event": "", "argv": {}}).tag(sync=True)
    pwd = traitlets.Unicode("").tag(sync=True)
    files = traitlets.List([]).tag(sync=True)
    msg = traitlets.Dict({"content": ""}).tag(sync=True) # use for error msg action
    online = traitlets.Bool(False).tag(sync=True)
    files_loading = traitlets.Bool(False).tag(sync=True)

    def __init__(self, schema = default_schema, options = None, default_value = None, on_change = lambda x: x):
        super(Formily, self).__init__()
        self.value = default_value and {"data": default_value} or {}
        self.schema = schema
        self.options = {**self.options, **(options or {})}

        self.pwd = os.getcwd()
        self._get_files()
        self.observe(self._on_event, names='event_content')
        self.observe(self._get_files, names='pwd')
        self.observe(on_change, names='value')

    def _on_event(self, change = ""):
        event = self.event_content.get("event")
        argv = self.event_content.get("argv")

        if event == "init_pwd":
            value = argv.get("value")
            init_path = argv.get("init_path")
            if value and os.path.exists(value):
                self.pwd = os.path.abspath(os.path.dirname(value))
            elif init_path and os.path.exists(init_path):
                self.pwd = os.path.abspath(init_path)
            else:
                self.pwd = os.getcwd()
        elif event == "parent_pwd":
            value = argv.get("value")
            level = argv.get("level")
            for i in range(0, level):
                value = os.path.dirname(value)
            self.pwd = value
        elif event == "child_pwd":
            value = argv.get("value")
            dirname = argv.get("dirname")
            self.pwd = os.path.join(value, dirname)
    
    def _get_files(self, change = ""):
        path = self.pwd
        self.files_loading = True
        time.sleep(0.3)
        try:
            files = os.listdir(path)
        except PermissionError as e:
            self.msg = {"content": str(e), "type": "error"}
            self.pwd = os.path.dirname(self.pwd)
            return
        except BaseException as e:
            self.msg = {"content": str(e), "type": "error"}
            self.pwd = os.getcwd()
            return
        files = [{"name": file, "isDir":  os.path.isdir(os.path.join(path, file))} for file in files]
        files.sort(key=lambda item: item["name"])
        files.sort(key=lambda item: not item["isDir"])
        self.files = files
        self.files_loading = False

    def display(self):
        display(self)
        self.online = True
