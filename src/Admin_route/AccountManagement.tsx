"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  Select,
  Popconfirm,
  message,
} from "antd";
import { EditOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";
import "./AccountManagement.css";

interface Account {
  userId: string;
  userName: string;
  passWord?: string;
  maSV: string | null;
  fullName: string | null;
  gender: "MALE" | "FEMALE" | null;
  roomNameStudent: string | null;
  cccd: string | null;
  phoneNumber: string | null;
  status: "Staying" | "Left" | "Disciplined" | "Disabled" | null;
  country: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  code: number;
  result: Account[];
}

const AccountManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [form] = Form.useForm();

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/v1/user/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data: ApiResponse = await response.json();

      if (data.code === 1000) {
        const filteredAccounts = data.result.filter(
          (acc) => !acc.roles.includes("ADMIN")
        );
        setAccounts(filteredAccounts);
      } else {
        console.error("Failed to fetch accounts:", data);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (editingAccount) {
      form.setFieldsValue({
        ...editingAccount,
        fullName: editingAccount.fullName || "",
        gender: editingAccount.gender || undefined,
        roomNameStudent: editingAccount.roomNameStudent || "",
        cccd: editingAccount.cccd || "",
        phoneNumber: editingAccount.phoneNumber || "",
        status: editingAccount.status || undefined,
        country: editingAccount.country || "",
        maSV: editingAccount.maSV || "",
        roles: editingAccount.roles || [],
      });
    } else {
      form.resetFields();
    }
  }, [editingAccount, form]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
  };

  const filteredAccounts = accounts
    .filter((acc) =>
      acc.userName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((acc) =>
      roleFilter === "ALL" ? true : acc.roles.includes(roleFilter)
    );

  const handleAdd = () => {
    setEditingAccount(null);
    setModalVisible(true);
  };

  const handleEdit = (record: Account) => {
    setEditingAccount(record);
    setModalVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      const token = localStorage.getItem("token");
  
      // Đảm bảo roles luôn là mảng
      const rolesArray: string[] = typeof values.roles === "string"
        ? [values.roles]
        : values.roles;
  
      // Chuẩn bị payload
      const payload = {
        ...values,
        roles: rolesArray,
        maSV: values.maSV || null,
      };
  
      if (!editingAccount) {
        // Tạo mới account
        const response = await fetch("http://localhost:8080/api/v1/user/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data.code === 1000) {
          message.success("Tạo tài khoản thành công");
          fetchAccounts();
        } else {
          message.error("Tạo tài khoản thất bại");
        }
      } else {
        // Cập nhật account
        const response = await fetch(
          `http://localhost:8080/api/v1/user/${editingAccount.userId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );
        const data = await response.json();
        if (data.code === 1000) {
          message.success("Cập nhật tài khoản thành công");
          fetchAccounts();
        } else {
          message.error("Cập nhật tài khoản thất bại");
        }
      }
    } catch (error) {
      console.error("Error saving account:", error);
      message.error("Đã xảy ra lỗi khi lưu tài khoản");
    } finally {
      setModalVisible(false);
      setEditingAccount(null);
      form.resetFields();
    }
  };
  

  const handleDelete = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/v1/user/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const text = await response.text();
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = JSON.parse(text);
      if (data.code === 1000) {
        message.success("Xóa tài khoản thành công");
        fetchAccounts();
      } else {
        message.error("Xóa tài khoản thất bại");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      message.error(
        "Đã xảy ra lỗi khi xóa tài khoản, có thể tài khoản này đang được sử dụng"
      );
    }
  };

  const handleChangeStatus = async (record: Account, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const payload = { ...record, status: newStatus };
      const response = await fetch(
        `http://localhost:8080/api/v1/user/${record.userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (data.code === 1000) {
        message.success("Cập nhật trạng thái thành công");
        fetchAccounts();
      } else {
        message.error("Cập nhật trạng thái thất bại");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("Đã xảy ra lỗi khi cập nhật trạng thái");
    }
  };

  const handleToggleActivation = (record: Account) => {
    const targetStatus = record.status === "Disciplined" ? "Staying" : "Disciplined";
    handleChangeStatus(record, targetStatus);
  };

  const getStatusTag = (status: string | null) => {
    let color = "";
    switch (status) {
      case "Staying":
        color = "#52c41a";
        break;
      case "Left":
        color = "#faad14";
        break;
      case "Disciplined":
        color = "#f5222d";
        break;
      case "Disabled":
        color = "#d9d9d9";
        break;
      default:
        color = "#d9d9d9";
    }
    return <span style={{ color }}>{status || "Chưa xác định"}</span>;
  };

  return (
    <div className="account-container">
      <h2>Quản lý tài khoản</h2>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm tài khoản bằng tên đăng nhập"
          value={searchTerm}
          onChange={handleSearch}
          style={{ width: 240, marginRight: 16 }}
        />
        <Select
          value={roleFilter}
          onChange={handleRoleFilterChange}
          style={{ width: 180, marginRight: 16 }}
        >
          <Select.Option value="ALL">Tất cả vai trò</Select.Option>
          <Select.Option value="STUDENT">Sinh viên</Select.Option>
          <Select.Option value="MANAGER">Quản lý</Select.Option>
          <Select.Option value="STAFF">Nhân viên</Select.Option>
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm tài khoản
        </Button>
      </div>

      <Table
        loading={loading}
        dataSource={filteredAccounts}
        rowKey="userId"
        columns={[
          { title: "ID", dataIndex: "userId", key: "userId" },
          { title: "Mã sinh viên", dataIndex: "maSV", key: "maSV" },
          { title: "Tên đăng nhập", dataIndex: "userName", key: "userName" },
          { title: "Họ và tên", dataIndex: "fullName", key: "fullName" },
          { title: "Giới tính", dataIndex: "gender", key: "gender" },
          { title: "CCCD", dataIndex: "cccd", key: "cccd" },
          { title: "Số điện thoại", dataIndex: "phoneNumber", key: "phoneNumber" },
          { title: "Quốc gia", dataIndex: "country", key: "country" },
          {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: getStatusTag,
          },
          {
            title: "Vai trò",
            dataIndex: "roles",
            key: "roles",
            render: (roles: string[]) => roles.join(", "),
          },
          {
            title: "Hành động",
            key: "action",
            render: (_: any, record: Account) => (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                  style={{ marginRight: 8 }}
                />
                <Popconfirm
                  title="Bạn có chắc chắn muốn xóa tài khoản này?"
                  onConfirm={() => handleDelete(record.userId)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
                <Button
                  onClick={() => handleToggleActivation(record)}
                  style={{ marginLeft: 8 }}
                  type={record.status === "Disciplined" ? "primary" : "default"}
                  danger={record.status !== "Disciplined"}
                >
                  {record.status === "Disciplined" ? "Kích hoạt" : "Vô hiệu hóa"}
                </Button>
              </>
            ),
          },
        ]}
        className="account-table"
      />

      <Modal
        title={editingAccount ? "Chỉnh sửa tài khoản" : "Thêm tài khoản"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item
            name="userName"
            label="Tên đăng nhập"
            rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
          >
            <Input />
          </Form.Item>

          {!editingAccount && (
            <Form.Item
              name="passWord"
              label="Mật khẩu"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            name="roles"
            label="Vai trò"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Select placeholder="Chọn vai trò">
              <Select.Option value="STUDENT">Sinh viên</Select.Option>
              <Select.Option value="MANAGER">Quản lý</Select.Option>
              <Select.Option value="STAFF">Nhân viên</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.roles !== curr.roles}>
            {({ getFieldValue }) =>
              getFieldValue("roles") === "STUDENT" ? (
                <Form.Item
                  name="maSV"
                  label="Mã sinh viên"
                  rules={[{ required: true, message: "Vui lòng nhập mã sinh viên" }]}
                >
                  <Input />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item name="fullName" label="Họ và tên">
            <Input />
          </Form.Item>

          <Form.Item name="gender" label="Giới tính">
            <Select>
              <Select.Option value="MALE">Nam</Select.Option>
              <Select.Option value="FEMALE">Nữ</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="cccd"
            label="CCCD"
            rules={[
              { required: true, message: "Vui lòng nhập CCCD" },
              { pattern: /^[1-9]\d*$/, message: "CCCD phải là số nguyên dương" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              // { pattern: /^[1-9]\d*$/, message: "Số điện thoại phải là số nguyên dương" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="country" label="Quốc gia">
            <Input />
          </Form.Item>

          <Form.Item name="status" label="Trạng thái">
            <Select>
              <Select.Option value="Staying">Đang ở</Select.Option>
              <Select.Option value="Left">Đã rời đi</Select.Option>
              <Select.Option value="Disciplined">Kỷ luật</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountManagement;
