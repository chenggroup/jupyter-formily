import { useModelState } from "@anywidget/react";
import {
  Form,
  FormItem,
  DatePicker,
  Checkbox,
  Cascader,
  Editable,
  Input,
  NumberPicker,
  Switch,
  Password,
  PreviewText,
  Radio,
  Reset,
  Select,
  Space,
  Submit,
  TimePicker,
  Transfer,
  TreeSelect,
  Upload,
  FormGrid,
  FormLayout,
  FormTab,
  FormCollapse,
  ArrayTable,
  ArrayCards,
  FormButtonGroup,
} from "@formily/antd-v5";
import { createForm } from "@formily/core";
import { createSchemaField, ISchema } from "@formily/react";
import { Card, Slider, Rate, Modal, Button, Divider, Popconfirm } from "antd";
import React, { useEffect } from "react";
import PathSelectorForFormily from "./_PathSelectorForFormily";

import type { ISubmitProps, IFormLayoutProps } from "@formily/antd-v5";
import type { ButtonProps } from "antd/lib/button";
import type { ModalProps } from "antd/lib/modal";

const Text: React.FC<{
  value?: string;
  content?: string;
  mode?: "normal" | "h1" | "h2" | "h3" | "p";
}> = ({ value, mode, content, ...props }) => {
  const tagName = mode === "normal" || !mode ? "div" : mode;
  return React.createElement(tagName, props, value || content);
};

const SchemaField = createSchemaField({
  components: {
    Space,
    FormGrid,
    FormLayout,
    FormTab,
    FormCollapse,
    ArrayTable,
    ArrayCards,
    FormItem,
    DatePicker,
    Checkbox,
    Cascader,
    Editable,
    Input,
    Text,
    NumberPicker,
    Switch,
    Password,
    PreviewText,
    Radio,
    Reset,
    Select,
    Submit,
    TimePicker,
    Transfer,
    TreeSelect,
    Upload,
    Card,
    Slider,
    Rate,
    FilePicker: PathSelectorForFormily, // Custom component
  },
});

const form = createForm();

interface IOptions {
  show_modal: boolean;
  ok_label: string;
  cancel_label: string;
  ok_props: ISubmitProps;
  cancel_props: ButtonProps;
  form_props: IFormLayoutProps;
  modal_props: ModalProps;
}

interface ISchemaJSON extends ISchema {
  form?: IFormLayoutProps;
  schema?: ISchema;
}

const defaultModalProps: ModalProps = {
  destroyOnClose: true,
  maskClosable: false,
  centered: true,
  closeIcon: null,
  width: "60vw",
  style: { maxWidth: "700px" },
  styles: { body: { maxHeight: "70vh", overflowY: "auto" } },
};

const Formily: React.FC = () => {
  const [schema] = useModelState<ISchemaJSON>("schema");
  const [online, setOnline] = useModelState<boolean>("online");
  const [value, setValue] = useModelState<Record<string, any>>("value");
  const [options] = useModelState<IOptions>("options");
  // const [isModalOpen, setIsModalOpen] = useState(online);

  const {
    show_modal,
    ok_label,
    cancel_label,
    ok_props,
    cancel_props,
    form_props,
    modal_props,
  } = options;

  const handleOK = () => {
    const data = form.getState().values;
    const _timestamp = new Date().valueOf();
    setValue({ data, _timestamp });
    setOnline(false);
  };

  const handleCancel = () => {
    setOnline(false);
  };

  useEffect(() => {
    console.log(value);
    form.initialValues = value?.data;
  }, [value]);

  const formLayoutFromJSON = schema?.form || {};
  const schemaFromJSON = schema?.schema || schema;

  if (!show_modal) {
    return <Form {...formLayoutFromJSON} {...form_props} form={form}>
      <SchemaField schema={schemaFromJSON} />
      <Divider />
      <FormButtonGroup align="right">
        <Submit {...ok_props} onSubmit={handleOK}>
          {ok_label}
        </Submit>
      </FormButtonGroup>
    </Form>
  }

  return (
    <Modal
      title="&nbsp;"
      keyboard={false}
      {...defaultModalProps}
      {...modal_props}
      classNames={{body: "formily-modal-body " + (modal_props?.classNames?.body || "")}}
      rootClassName={"formily-modal-root " + (modal_props?.className || "")}
      open={online}
      footer={
        <>
          <Divider />
          <Space>
            <Button type="primary" {...ok_props} onClick={handleOK}>
              {ok_label}
            </Button>
            <Popconfirm
              title="Exit modal form"
              description="The changed data would not be update. Are you sure to exit?"
              onConfirm={handleCancel}
              // onCancel={}
              okText="Yes"
              cancelText="No"
            >
              <Button {...cancel_props}>{cancel_label}</Button>
            </Popconfirm>
          </Space>
        </>
      }
      onCancel={handleCancel}
    >
      <div onKeyDown={(evt) => evt.stopPropagation()}>
        <Form {...formLayoutFromJSON} {...form_props} form={form}>
          <SchemaField schema={schemaFromJSON} />
        </Form>
      </div>
    </Modal>
  );
};

export default Formily;
