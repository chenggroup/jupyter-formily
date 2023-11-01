import React, { useEffect } from "react";
import { notification, message, Modal } from "antd";
import { useModelState } from "@anywidget/react";
import type { ModalFuncProps } from "antd/lib/modal";
import type { ArgsProps } from "antd/lib/notification";
import type { NotificationConfig } from "antd/lib/notification/interface";
import type {
  ConfigOptions,
  ArgsProps as MessageArgsProps,
} from "antd/lib/message/interface";

type ToastType = "info" | "success" | "error" | "warning" | "confirm";
type ToastComponent = "notification" | "message" | "modal";

const Toast: React.FC = () => {
  const [onclick, setOnclick] = useModelState<boolean>("on_click");
  const [component] = useModelState<ToastComponent>("component");
  const [type] = useModelState<ToastType>("type");
  const [content] = useModelState<string>("content");
  const [props] = useModelState<ModalFuncProps | ArgsProps | MessageArgsProps>(
    "props"
  );
  const [config] = useModelState<
    ConfigOptions | NotificationConfig | ModalFuncProps
  >("config");

  const [api, contextHolder] = notification.useNotification(
    (config as NotificationConfig) || undefined
  );

  useEffect(() => {
    if (type === "confirm") {
      Modal.confirm({
        ...(config as ModalFuncProps),
        ...(props as ModalFuncProps),
        content: content,
        onOk: () => setOnclick(!onclick),
      });
      return;
    }
    switch (component) {
      case "notification":
        api[type]({ message: "", ...(props as any), description: content });
        break;
      case "modal":
        Modal[type]({
          ...(config as ModalFuncProps),
          ...(props as ArgsProps),
          content: content,
        });
        break;
      default:
        message.config(config as ConfigOptions);
        message[type]({ ...(props as MessageArgsProps), content });
        break;
    }
  }, []);
  return <>{component === "notification" && contextHolder}</>;
};

export default Toast;
