"use client"

import { useState } from "react"
import { ERC20_ABI_DPOLLS,  } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts'
import { Trash2, PlusCircle, } from "lucide-react"
import { DatePicker, DatePickerProps } from "antd";
import { Button, Form, Input, Card, Space } from 'antd';
import { Steps } from 'antd';
import { useSignature, useSendUserOp } from "@/hooks";
import { ethers } from 'ethers';
interface ManagePollProps {
  poll: any;
}

interface PollOption {
  id: number;
  text: string;
}

const NERO_POLL_ABI = [
  // Basic ERC721 functions from the standard ABI
  ...ERC20_ABI_DPOLLS,
  // Add the mint function that exists in the NeroNFT contract
  'function mint(address to, string memory uri) returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string memory)',
];
const onChange: DatePickerProps['onChange'] = (date, dateString) => {
  console.log(date, dateString);
};

export default function ManagePoll({ poll }: ManagePollProps) {
  console.log("poll", poll);

  const { isConnected, } = useSignature();
  const { execute, waitForUserOpResult, sendUserOp } = useSendUserOp();
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<PollOption[]>([]);
  form.setFieldsValue({
    subject: poll.subject,
    description: poll.description,
    endDate: poll.endDate,
    options: poll.options,
    settings: poll.settings
  });

  const [current, setCurrent] = useState(0);
  const steps = [
    { title: 'Basic Info' },
    { title: 'Options' },
    { title: 'Settings'}
  ];

  const next = async () => {
    const fieldsValue = form.getFieldsValue(true);
    console.log("next fieldsValue", fieldsValue);
    setCurrent(current + 1);
  };

  const prev = async () => {
    const fieldsValue = form.getFieldsValue(true);
    console.log("prev fieldsValue", fieldsValue);
    setCurrent(current - 1);
  };

  const handleUpdatePoll = async (pollForm: any) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'createPoll',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: NERO_POLL_ABI, // Use the specific ABI with mint function
        params: [
          pollForm.subject,
          pollForm.description,
          pollForm.options,
          ethers.utils.parseEther(pollForm.rewardPerResponse).toString(),
          parseInt(pollForm.duration),
          parseInt(pollForm.maxResponses),
          ethers.utils.parseEther(pollForm.minContribution).toString(),
          ethers.utils.parseEther(pollForm.targetFund).toString(),
        ],
        value: 0,
      });

      const result = await waitForUserOpResult();
      setUserOpHash(result.userOpHash);
      setIsPolling(true);

      if (result.result === true) {
        setIsPolling(false);
      } else if (result.transactionHash) {
        setTxStatus('Transaction hash: ' + result.transactionHash);
      }
    } catch (error) {
      console.error('Error:', error);
      setTxStatus('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Form
        layout={"horizontal"}
        form={form}
        name="basicInfo"
        style={{ maxWidth: 600, margin: '0 auto' }}
      >

        <Steps
          current={current}
          percent={current / (steps.length - 1) * 100}
          items={steps}
        />
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
            rules={[
              { required: true, message: 'Please enter reward amount' },
            ]}
            style={{ textAlign: 'center' }}
          >
            <Input type="number" placeholder="Enter reward amount" />
          </Form.Item>
          <Form.Item 
            label="Max Responses"
            name="maxResponses"
            rules={[
              { required: true, message: 'Please enter max responses' },
            ]}
            style={{ textAlign: 'center' }}
          >
            <Input type="number" placeholder="Enter maximum number of responses" />
          </Form.Item>
          <Form.Item 
            label="Duration (Days)"
            name="durationDays"
            rules={[
              { required: true, message: 'Please enter duration' },
            ]}
            style={{ textAlign: 'center' }}
          >
            <Input type="number" placeholder="Enter poll duration in days" />
          </Form.Item>
          <Form.Item 
            label="Min Contribution"
            name="minContribution"
            rules={[
              { required: true, message: 'Please enter minimum contribution' },
            ]}
            style={{ textAlign: 'center' }}
          >
            <Input type="number" placeholder="Enter minimum contribution amount" />
          </Form.Item>
          <Form.Item 
            label="Target Fund"
            name="targetFund"
            rules={[
              { required: true, message: 'Please enter target fund' },
            ]}
            style={{ textAlign: 'center' }}
          >
            <Input type="number" placeholder="Enter target fund amount" />
          </Form.Item>
        </Card>

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
            <Button
            type="primary"
            onClick={handleUpdatePoll}
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