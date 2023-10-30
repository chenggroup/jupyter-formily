import React, { useEffect, useRef, useState } from "react";
import { Button, List, Breadcrumb, message, Popover, Input, Row } from "antd";
import type { InputProps } from "antd/lib/input";
import {
  FolderFilled,
  FolderOpenOutlined,
  FileOutlined,
  CloseOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useModelState } from "@anywidget/react";
import "./FileSelector.css";
import { observer } from "@formily/react";

interface IFile {
  name: string;
  isDir?: boolean;
}

interface IMsg {
  content: string;
  type?: "info" | "success" | "error" | "warning";
}

// refer: https://github.com/alibaba/formily/blob/formily_next/packages/react/src/components/ReactiveField.tsx#L96-L102
interface IReactiveFieldProps<T> {
  disabled: boolean;
  readOnly: boolean;
  value?: T;
  onChange: (data: T) => void;
  onFocus: () => void;
  onBlur: () => void;
}

interface IPathSelectorForFormily extends IReactiveFieldProps<string> {
  select_type?: "folder" | "file" | "both";
  init_path?: string;
  input_props?: InputProps;
}

const PathSelectorForFormily: React.FC<IPathSelectorForFormily> = observer(
  (props) => {
    // console.log({props})
    const value = props?.value;
    const inputProps = props?.input_props || {};
    const selectType = props?.select_type || "both";
    const [osSep] = useModelState<string>("os_sep");
    const [msg, setMsg] = useModelState<IMsg>("msg");
    const [pwd, setPwd] = useModelState<string>("pwd");
    const [files] = useModelState<IFile[]>("files");
    const [loading] = useModelState<boolean>("files_loading");

    const divEl = useRef<HTMLDivElement>(null);
    const fileContentEl = useRef<HTMLDivElement>(null);
    const inputEl = useRef<any>(null);
    const [popupContainer, setPopupContainer] = useState<HTMLDivElement>();
    const [popupOpen, setPopupOpen] = useState<boolean>(false);
    const escEvent = useRef<any>(null);

    useEffect(() => {
      if (divEl.current) {
        setPopupContainer(divEl.current);
      }
    }, [divEl]);

    useEffect(() => {
      if (inputEl.current) {
        const el = inputEl.current.input as HTMLInputElement;
        el.scrollLeft = el.scrollWidth;
      }
    }, [value]);

    useEffect(() => {
      if (fileContentEl.current) {
        const el = fileContentEl.current;
        el.scrollTop = 0;
      }
    }, [files]);

    useEffect(() => {
      if (popupOpen && value) {
        const valueSplit = value.split(osSep);
        const newPwd = valueSplit
          .slice(0, valueSplit.length - 1)
          .join(osSep);
        setPwd(
          newPwd.includes(osSep) ? newPwd : `${newPwd}${osSep}`
        );
        return;
      }
      if (popupOpen && props.init_path) {
        setPwd(props.init_path);
      }
    }, [props.init_path, popupOpen]);

    useEffect(() => {
      if (popupOpen) {
        escEvent.current = (evt: KeyboardEvent) => {
          // console.log(evt)
          if (evt.key === "Escape") {
            evt.stopPropagation();
            setPopupOpen(false);
          }
        };
        window.addEventListener("keydown", escEvent.current, true);
      } else {
        window.removeEventListener("keydown", escEvent.current, true);
      }
    }, [popupOpen]);

    useEffect(() => {
      try {
        if (!popupOpen) {
          return;
        }
        msg?.content && message[msg.type || "warning"](msg.content);
        setTimeout(() => {
          setMsg({ content: "" });
        }, 0);
      } catch (e) {
        console.error(e);
      }
    }, [msg]);

    const joinPath = (path: string, next: string) => {
      if (path.endsWith(osSep)) {
        return `${pwd}${next}`;
      }
      return `${pwd}${osSep}${next}`;
    };

    const pwdSplit = pwd.split(osSep);
    const firstDirBack: IFile[] =
      pwdSplit.length > 1 && pwdSplit[1] !== ""
        ? [{ name: "..", isDir: true }]
        : [];
    
    const handleParentFolder = (ind = pwdSplit.length - 1) => {
      const newPwd = pwdSplit
        .slice(0, ind)
        .join(osSep);
      setPwd(
        newPwd.includes(osSep) ? newPwd : `${newPwd}${osSep}`
      );
    }

    const dataSource = [
      ...firstDirBack,
      ...(selectType === "folder"
        ? files.filter((file) => file.isDir)
        : (files as IFile[])),
    ];

    const pwdBreadcrumb = (
      <Breadcrumb
        style={{ marginTop: "8px" }}
        separator=">"
        items={pwdSplit.map((item, ind) => ({
          title: (
            <Button
              type="link"
              size="small"
              disabled={loading}
              onClick={() => {
                handleParentFolder(ind + 1);
              }}
            >
              {item || osSep}
            </Button>
          ),
        }))}
      />
    );

    const widthProps = {
      width: popupContainer?.offsetWidth || "100%",
      maxWidth: "500px",
      minWidth: "250px",
    };

    const filesContent = (
      <div
        onClick={(evt) => evt.stopPropagation()}
        onScroll={(evt) => evt.stopPropagation()}
        style={{
          height: "300px",
          maxHeight: "300px",
          overflowY: "auto",
          ...widthProps,
        }}
        ref={fileContentEl}
      >
        <List
          className="file-selector-list"
          itemLayout="horizontal"
          style={{ width: "100%" }}
          dataSource={dataSource}
          loading={loading}
          size="small"
          renderItem={(item, ind) => {
            const isFirstBack = ind === 0 && item.name === "..";
            const hideSelectBtn =
              isFirstBack || (selectType === "file" && item.isDir);
            return (
              <List.Item
                className={
                  joinPath(pwd, item.name) === value ? "file-selected" : ""
                }
                style={item.isDir ? { cursor: "pointer" } : {}}
                actions={
                  hideSelectBtn
                    ? []
                    : [
                        <Button
                          icon={<CheckOutlined size={16} />}
                          rootClassName="file-selector-select-btn"
                          size="small"
                          shape="circle"
                          type="text"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            props.onChange(joinPath(pwd, item.name));
                            setPopupOpen(false);
                          }}
                        />,
                      ]
                }
                onClick={() => {
                  if (isFirstBack) {
                    handleParentFolder()
                    return;
                  }
                  if (item.isDir) {
                    setPwd(joinPath(pwd, item.name));
                  }
                }}
              >
                <List.Item.Meta
                  avatar={
                    item.isDir ? (
                      item.name === ".." && ind === 0 ? (
                        <FolderOpenOutlined />
                      ) : (
                        <FolderFilled />
                      )
                    ) : (
                      <FileOutlined />
                    )
                  }
                  title={
                    <div
                      style={{ fontWeight: "normal", wordBreak: "break-all" }}
                    >
                      {item.name}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </div>
    );

    return (
      <div ref={divEl}>
        {popupContainer && (
          <Popover
            onOpenChange={(open) => {
              setPopupOpen(open);
            }}
            destroyTooltipOnHide
            placement="bottom"
            rootClassName="path-selector-popover"
            getPopupContainer={() =>
              document.querySelector(".formily-modal-root") || document.body
            }
            content={filesContent}
            title={
              <Row
                justify="space-between"
                align="top"
                wrap={false}
                style={widthProps}
              >
                {pwdBreadcrumb}
                <Button
                  icon={<CloseOutlined size={16} />}
                  size="small"
                  shape="circle"
                  type="text"
                  onClick={() => {
                    setPopupOpen(false);
                  }}
                />
              </Row>
            }
            open={popupOpen}
            trigger="click"
          >
            <Input
              {...inputProps}
              value={value}
              suffix={
                <FolderOpenOutlined onClick={() => setPopupOpen(!popupOpen)} />
              }
              ref={inputEl}
              onChange={(evt) => props.onChange(evt.target.value)}
              onBlur={(evt) => {
                evt.target.scrollLeft = evt.target.scrollWidth;
              }}
            />
          </Popover>
        )}
      </div>
    );
  }
);

export default PathSelectorForFormily;
