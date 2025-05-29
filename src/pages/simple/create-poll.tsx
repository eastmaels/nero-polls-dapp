"use client"

import { useState } from "react"
import { useNavigate } from 'react-router-dom'
import { Trash2, PlusCircle, } from "lucide-react"
import { ConfigProvider, DatePicker, DatePickerProps, InputNumber, Select } from "antd";
import { Button, Form, Input, Card, Space } from 'antd';
import { Steps } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

interface CreatePollProps {
  handleCreatePoll: (pollData: any) => Promise<void>;
  handleTabChange?: (tab: string) => void;
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<PollOption[]>([
    { id: 1, text: "" },
    { id: 2, text: "" },
  ]);

  const [current, setCurrent] = useState(0);
  const steps = [
    { title: 'Basic Info' },
    { title: 'Options' },
    { title: 'Settings' }
  ];

  const next = async () => {
    setCurrent(current + 1);
  };

  const prev = async () => {
    setCurrent(current - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await form.validateFields();
      const fieldsValue = form.getFieldsValue(true);
      console.log('fieldsValue:', fieldsValue);

      // Calculate duration in days
      const endDate = fieldsValue.endDate?.toDate();
      console.log('endDate:', endDate);
      const currentDate = new Date();
      const durationInMs = endDate.getTime() - currentDate.getTime();
      const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));

      const rewardPerResponse = parseFloat(form.getFieldValue("rewardPerResponse"));
      const maxResponses = parseFloat(form.getFieldValue("maxResponses"));
      const targetFund = (rewardPerResponse * maxResponses).toPrecision(12);
      console.log('target fund', targetFund)

      const pollData = {
        ...fieldsValue,
        options: fieldsValue.options.map((item: any) => item.text),
        endDate: endDate,
        duration: durationInDays,
        targetFund: targetFund.toString(),
      };

      console.log('Submitting poll data:', pollData);
      await handleCreatePoll(pollData);
      navigate("/polls/live");
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };
 
  const selectAfter = (
    <Select defaultValue="NEON" style={{ width: "auto" }}>
      <Option value="NEON">NEON</Option>
    </Select>
  );

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 6 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 14 },
    },
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl" data-tour="poll-form">
      <Form
        layout={"horizontal"}
        form={form}
        name="basicInfo"
        style={{ maxWidth: 600, margin: '0 auto' }}
      >

        <ConfigProvider
          theme={{
            components: {
              Steps: {
                navArrowColor: "#FFFFFF"
              },
            },
          }}
        >
          <Steps
            current={current}
            percent={current / (steps.length - 1) * 100}
            items={steps}
            size="small" labelPlacement="vertical"
            direction="horizontal"
            responsive={false}
          />
        </ConfigProvider>
        {/* <div style={contentStyle}>{stepItems[current].content}</div> */}
        <Card
          style={current == 0 ? {} : { display: "none" }}
        >
          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: 'Please enter a subject' }]}
            style={{ textAlign: 'center' }}
          >
            <Input placeholder="Subject" />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter a description' }]}
            style={{ textAlign: 'center' }}
          >
            <Input placeholder="Enter poll description" />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select
              placeholder="Select a category"
              allowClear
            >
              <Option value="art">Art</Option>
              <Option value="design">Design</Option>
              <Option value="tech">Technology</Option>
              <Option value="defi">DeFi</Option>
              <Option value="lifestyle">Lifestyle</Option>
              <Option value="environment">Environment</Option>
              <Option value="web3">Web3</Option>
              <Option value="food">Food</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="End Date"
            name="endDate"
            rules={[{ required: true, message: 'Please select an end date' }]}
            style={{ textAlign: 'center' }}
          >
            <DatePicker
              onChange={onChange}
              picker="date"
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
              disabledDate={(current) => {
                return current && current < dayjs().endOf('day');
              }}
            />
          </Form.Item>
        </Card>

        {/* Options */}
        <Card
          // className={`steps-content ${current == 1 ? "" : "hidden"}`}
          style={current == 1 ? {} : { display: "none" }}
        >
          <Form.List
            name="options"
            initialValue={options}
          >
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <Form.Item
                    key={key}
                    label={`Option ${name + 1}`}
                    style={{ textAlign: 'center' }}
                    name={[name, "text"]}
                  >
                    <Space.Compact style={{ width: '100%', justifyContent: 'center' }}>
                      <Input
                        placeholder={`Enter option ${name + 1}`}
                      />
                      {fields.length > 2 && (
                        <Button
                          color="default"
                          type="text"
                          danger
                          icon={<Trash2 size={16} />}
                          onClick={() => remove(name)}
                        />
                      )}
                    </Space.Compact>
                  </Form.Item>
                ))}
                <Form.Item style={{ textAlign: 'center' }}>
                  <Button
                    color="default"
                    type="dashed"
                    onClick={() => add({ text: "" })}
                    block
                    icon={<PlusCircle size={16} />}
                  >
                    Add Option
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Card>

        {/* Settings */}
        <Card
          style={current == 2 ? {} : { display: "none" }}
        >
          <Form.Item
            label="Reward per Response"
            name="rewardPerResponse"
            tooltip="(in NERO units)"
            rules={[
              { required: true, message: 'Please enter reward amount' },
            ]}
            style={{ textAlign: 'center' }}
          >
            <InputNumber
              placeholder="Amount in NEONs that responders will receive"
              min="0.001"
              step="0.001"
              addonAfter={selectAfter}
              stringMode
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="Max Responses"
            name="maxResponses"
            rules={[
              { required: true, message: 'Please enter max responses' },
            ]}
            style={{ textAlign: 'center' }}
          >
            <InputNumber 
              placeholder="Limit to the number of responses the poll will gather" 
              min="1"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="Min Contribution"
            name="minContribution"
            tooltip="(in NERO units)"
            rules={[
              { required: true, message: 'Please enter minimum contribution' },
            ]}
            style={{ textAlign: 'center' }}
          >
            <InputNumber 
              placeholder="Minimum amount in NEON that funders (if crowdfunding) can contribute"
              min="0.001"
              step="0.001"
              addonAfter={selectAfter}
              stringMode
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Card>

        <div style={{ marginTop: 24 }}>
          {current > 0 && (
            <Button
              color="default"
              style={{ margin: '0 8px' }} onClick={() => prev()}
              disabled={loading}
            >
              Previous
            </Button>
          )}
          {current < steps.length - 1 && (
            <Button
              color="default" variant="solid"
              onClick={() => next()}
            >
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button
              color="default" variant="solid"
              onClick={handleSubmit}
              loading={loading}
            >
              Submit
            </Button>
          )}
        </div>
      </Form>
    </div>
  )
}