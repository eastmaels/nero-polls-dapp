"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Label } from "@/components/ui_v2/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui_v2/radio-group"
import { Switch } from "@/components/ui_v2/switch"
import { Separator } from "@/components/ui_v2/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_v2/tabs"
import { CalendarIcon, Trash2, PlusCircle, ArrowLeft, Info, Lock, Globe, Users2 } from "lucide-react"
import { DatePicker } from "antd";
import { Button, Form, Input, Radio, Card } from 'antd';
import { message, Steps, theme } from 'antd';

type LayoutType = Parameters<typeof Form>[0]['layout'];

interface CreatePollProps {
  handleCreatePoll: () => Promise<void>;
  handleTabChange: (tab: string) => void;
}

interface PollOption {
  id: number;
  text: string;
}

const onChange: DatePickerProps['onChange'] = (date, dateString) => {
  console.log(date, dateString);
};

export default function CreatePoll({ handleCreatePoll, handleTabChange }: CreatePollProps) {

  const [form] = Form.useForm();
  const [formLayout, setFormLayout] = useState<LayoutType>('horizontal');

  const steps = [
    {
      title: 'Basic Info',
      content: 
        <Card>
          <Form
            layout={formLayout}
            form={form}
            initialValues={{ layout: formLayout }}
            style={{ maxWidth: formLayout === 'inline' ? 'none' : 600 }}
          >
            <Form.Item label="Field A">
              <Input placeholder="input placeholder" />
            </Form.Item>
            <Form.Item label="Field B">
              <Input placeholder="input placeholder" />
            </Form.Item>
            <Form.Item label="End Date">
              <DatePicker
                onChange={onChange}
                picker="date"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Form>
        </Card>
    },
    {
      title: 'Options',
      content: 'options',
    },
    {
      title: 'Settings',
      content: 'settings',
    },
  ];


  const navigate = useNavigate()
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [options, setOptions] = useState<PollOption[]>([
    { id: 1, text: "" },
    { id: 2, text: "" },
  ])
  const [isCreating, setIsCreating] = useState(false)

  const addOption = () => {
    const newId = options.length > 0 ? Math.max(...options.map((o) => o.id)) + 1 : 1
    setOptions([...options, { id: newId, text: "" }])
  }

  const removeOption = (id: number) => {
    if (options.length <= 2) return
    setOptions(options.filter((option) => option.id !== id))
  }

  const updateOption = (id: number, text: string) => {
    setOptions(options.map((option) => (option.id === id ? { ...option, text } : option)))
  }

  const handleCreate = () => {
    setIsCreating(true)
    // Simulate blockchain transaction
    setTimeout(() => {
      setIsCreating(false)
      navigate("/dashboard")
    }, 2000)
  }

  const { token } = theme.useToken();
  const [current, setCurrent] = useState(0);

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  const contentStyle: React.CSSProperties = {
    lineHeight: '260px',
    textAlign: 'center',
    color: token.colorTextTertiary,
    backgroundColor: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    border: `1px dashed ${token.colorBorder}`,
    marginTop: 16,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <>
        <Steps current={current} items={items} />
        <div style={contentStyle}>{steps[current].content}</div>
        <div style={{ marginTop: 24 }}>
          {current > 0 && (
            <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
              Previous
            </Button>
          )}
          {current < steps.length - 1 && (
            <Button type="primary" onClick={() => next()}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" onClick={() => handleCreatePoll()}>
              Done
            </Button>
          )}
        </div>
      </>
    </div>
  )
}