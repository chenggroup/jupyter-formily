/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  List,
  Breadcrumb,
  message,
  Popover,
  Input,
  Row,
  Tag,
  Tooltip,
} from "antd";
import type { InputProps } from "antd/lib/input";
import {
  FolderFilled,
  FolderOpenOutlined,
  FileOutlined,
  CloseOutlined,
  CheckOutlined,
  PlusOutlined,
  MinusOutlined,
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
  multiple?: boolean;
  delimiter?: string;
}

interface IEventContent {
  event: string;
  argv: Record<string, any>;
}

const PathSelectorForFormily: React.FC<IPathSelectorForFormily> = observer(
  (props) => {
    // console.log({props})
    const value = props?.value;
    const inputProps = props?.input_props || {};
    const selectType = props?.select_type || "both";
    const multiple = props?.multiple || false;
    const pathDelimiter = props?.delimiter || " #^_^# ";

    const [osSep] = useModelState<string>("os_sep");
    const [msg, setMsg] = useModelState<IMsg>("msg");
    const [_, setEventContent] = useModelState<IEventContent>("event_content");
    const [pwd] = useModelState<string>("pwd");
    const [files] = useModelState<IFile[]>("files");
    const [loading] = useModelState<boolean>("files_loading");

    const divEl = useRef<HTMLDivElement>(null);
    const fileContentEl = useRef<HTMLDivElement>(null);
    const inputEl = useRef<any>(null);
    const [popupContainer, setPopupContainer] = useState<HTMLDivElement>();
    const [popupOpen, setPopupOpen] = useState<boolean>(false);
    const escEvent = useRef<any>(null);
    const [pathValues, setPathValues] = useState<string[]>([]);

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
      const newPathValues = value?.split(pathDelimiter).filter(item => item) || [];
      setPathValues(newPathValues);
    }, [value]);

    useEffect(() => {
      if (fileContentEl.current) {
        const el = fileContentEl.current;
        el.scrollTop = 0;
      }
    }, [files]);

    useEffect(() => {
      setEventContent({
        event: "init_pwd",
        argv: {
          value: pathValues[pathValues.length - 1],
          init_path: props.init_path,
        },
      });
    }, [popupOpen]);

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

    const handleParentFolder = (ind = 1) => {
      setEventContent({
        event: "parent_pwd",
        argv: { value: pwd, level: ind },
      });
    };

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
                handleParentFolder(pwdSplit.length - ind - 1);
              }}
            >
              {item || osSep}
            </Button>
          ),
        }))}
      />
    );

    const multipleFileTag =
      multiple &&
      pathValues.map((path) => {
        const isLongTag = path.length > 20;
        return (
          <Tooltip title={path} key={path}>
            <Tag
              closable={true}
              style={{ userSelect: "none" }}
              onClose={() => {
                const newPathValues = pathValues.filter(
                  (item) => path !== item
                );
                props.onChange(newPathValues.join(pathDelimiter));
              }}
            >
              <span>{isLongTag ? `...${path.slice(-16)}` : path}</span>
            </Tag>
          </Tooltip>
        );
      });

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
          height: "40vh",
          maxHeight: "280px",
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
            const isSelected = pathValues.includes(joinPath(pwd, item.name));
            const selectIcon = multiple ? (
              isSelected ? (
                <MinusOutlined size={16} />
              ) : (
                <PlusOutlined size={16} />
              )
            ) : (
              <CheckOutlined size={16} />
            );
            return (
              <List.Item
                className={isSelected ? "file-selected" : ""}
                style={item.isDir ? { cursor: "pointer" } : {}}
                actions={
                  hideSelectBtn
                    ? []
                    : [
                        <Button
                          icon={selectIcon}
                          rootClassName="file-selector-select-btn"
                          style={
                            multiple && isSelected ? { display: "block" } : {}
                          }
                          size="small"
                          shape="circle"
                          type="text"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            if (!multiple) {
                              const newPathValues = [joinPath(pwd, item.name)];
                              props.onChange(newPathValues.join(pathDelimiter));
                              setPopupOpen(false);
                              return;
                            }
                            if (isSelected) {
                              const newPathValues = pathValues.filter(
                                (path) => path !== joinPath(pwd, item.name)
                              );
                              props.onChange(newPathValues.join(pathDelimiter));
                            } else {
                              const newPathValues = [
                                ...pathValues,
                                joinPath(pwd, item.name),
                              ];
                              props.onChange(newPathValues.join(pathDelimiter));
                            }
                          }}
                        />,
                      ]
                }
                onClick={() => {
                  if (isFirstBack) {
                    handleParentFolder();
                    return;
                  }
                  if (item.isDir) {
                    setEventContent({
                      event: "child_pwd",
                      argv: { value: pwd, dirname: item.name },
                    });
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
          <Input
            {...inputProps}
            value={value}
            suffix={
              <Popover
                onOpenChange={(open) => {
                  setPopupOpen(open);
                }}
                destroyTooltipOnHide
                placement="bottomRight"
                arrow={false}
                rootClassName="path-selector-popover"
                getPopupContainer={() =>
                  document.querySelector(".formily-modal-root") || document.body
                }
                content={filesContent}
                title={
                  <>
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
                    <Row gutter={[4,4]} wrap style={widthProps}>
                      {multipleFileTag}
                    </Row>
                  </>
                }
                open={popupOpen}
                trigger="click"
              >
                <FolderOpenOutlined />
              </Popover>
            }
            ref={inputEl}
            onChange={(evt) => props.onChange(evt.target.value)}
            onBlur={(evt) => {
              evt.target.scrollLeft = evt.target.scrollWidth;
            }}
          />
        )}
      </div>
    );
  }
);

export default PathSelectorForFormily;
