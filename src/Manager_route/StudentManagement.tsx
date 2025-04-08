import React, { useState, useEffect } from "react";
import "./StudentManagement.css";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  message,
  Alert,
} from "antd";

interface Student {
  userId: string;
  maSV: string | null;
  userName: string;
  passWord: string;
  fullName: string | null;
  gender: string | null;
  roomNameStudent: string | null;
  cccd: string | null;
  phoneNumber: string | null;
  status: string | null;
  country: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

interface Room {
  roomId: string;
  roomName: string;
  roomStatus: string;
  roomPrice: number;
}

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [filterOption, setFilterOption] = useState<'all' | 'active' | 'inactive'>('all');
  const [activeStudentsIds, setActiveStudentsIds] = useState<string[]>([]);

  const [assignForm] = Form.useForm();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/v1/user/manager/list", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Lỗi khi lấy dữ liệu!");

        const data = await response.json();
        const filteredStudents = data.result.filter((student: Student) =>
          student.roles.includes("STUDENT")
        );
        setStudents(filteredStudents);
      } catch (error) {
        console.error("Lỗi:", error);
      }
    };

    fetchStudents();
  }, [token]);

  const fetchAvailableRooms = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/rooms/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Lỗi khi lấy danh sách phòng");
      const data = await response.json();
      const available = data
        .filter((room: any) => room.roomStatus === "empty_room")
        .map((room: any) => ({
          roomId: room.roomId,
          roomName: room.roomName,
          roomStatus: room.roomStatus,
          roomPrice: room.roomPrice,
        }));
      setAvailableRooms(available);
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  const fetchActiveContractsForAllStudents = async () => {
    try {
      const activeIds: string[] = [];
      await Promise.all(
        students.map(async (student) => {
          const response = await fetch(
            `http://localhost:8080/api/v1/contracts/user/${student.userId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const contractData = await response.json();
            const activeContract = contractData.result.find(
              (contract: any) => contract.contractStatus === "Active"
            );
            if (activeContract) activeIds.push(student.userId);
          }
        })
      );
      setActiveStudentsIds(activeIds);
    } catch (error) {
      console.error("Lỗi khi tải hợp đồng cho tất cả sinh viên:", error);
    }
  };

  useEffect(() => {
    if (filterOption !== "all") fetchActiveContractsForAllStudents();
  }, [filterOption]);

  const handleAssignButton = (student: Student) => {
    setSelectedStudent(student);
    fetchAvailableRooms();
    assignForm.resetFields();
    setAssignModalVisible(true);
  };

  const handleAssignRoom = async (values: any) => {
    if (!selectedStudent) return;
    try {
      const selectedRoom = availableRooms.find(
        (room) => room.roomId === values.roomId
      );
      if (!selectedRoom) {
        message.error("Phòng được chọn không hợp lệ!");
        return;
      }

      const payload = {
        userId: selectedStudent.userId,
        roomId: selectedRoom.roomId,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate.format("YYYY-MM-DD"),
        price: String(selectedRoom.roomPrice),
        depositStatus: "COMPLETED",
        contractStatus: "Active",
        note: values.note || "",
      };

      const response = await fetch(
        "http://localhost:8080/api/v1/contracts/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (result.code === 1000) {
        message.success("Tạo hợp đồng thành công!");
        setAssignModalVisible(false);
        setSelectedStudent(null);
      } else {
        message.error("Lỗi khi tạo hợp đồng: " + (result.message || "Không rõ lỗi"));
      }
    } catch (error: any) {
      console.error("Lỗi:", error);
      message.error("Tạo hợp đồng thất bại: " + (error.message || "Lỗi không xác định"));
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.userName.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterOption === "active") {
      return matchesSearch && activeStudentsIds.includes(student.userId);
    } else if (filterOption === "inactive") {
      return matchesSearch && !activeStudentsIds.includes(student.userId);
    }
    return matchesSearch;
  });

  return (
    <div className="student-management">
      <h2>Quản lý sinh viên</h2>
      <div className="search-filters">
        <Input
          placeholder="Tìm kiếm theo username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          value={filterOption}
          onChange={(value) => setFilterOption(value)}
          style={{ width: 250 }}
        >
          <Select.Option value="all">Hiển thị tất cả sinh viên</Select.Option>
          <Select.Option value="active">Sinh viên có hợp đồng hiệu lực</Select.Option>
          <Select.Option value="inactive">Sinh viên không có hợp đồng</Select.Option>
        </Select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Mã SV</th>
            <th>Họ tên</th>
            <th>Tên đăng nhập</th>
            <th>Giới tính</th>
            <th>CCCD</th>
            <th>Số điện thoại</th>
            <th>Trạng thái</th>
            <th>Quốc gia</th>
            <th>Vai trò</th>
            <th>Ngày tạo</th>
            <th>Ngày cập nhật</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => (
            <tr key={student.userId}>
              <td>{student.maSV || "N/A"}</td>
              <td>{student.fullName || "Không có tên"}</td>
              <td>{student.userName}</td>
              <td>{student.gender || "Chưa cập nhật"}</td>
              <td>{student.cccd || "N/A"}</td>
              <td>{student.phoneNumber || "N/A"}</td>
              <td>{student.status || "Chưa cập nhật"}</td>
              <td>{student.country || "Chưa cập nhật"}</td>
              <td>{student.roles.join(", ")}</td>
              <td>{new Date(student.createdAt).toLocaleString()}</td>
              <td>{new Date(student.updatedAt).toLocaleString()}</td>
              <td>
                <button onClick={() => handleAssignButton(student)}>Xếp phòng</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        title={`Xếp phòng cho ${selectedStudent?.fullName || "sinh viên"}`}
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          setSelectedStudent(null);
        }}
        footer={null}
      >
        <Form layout="vertical" form={assignForm} onFinish={handleAssignRoom}>
          <Form.Item
            label="Chọn phòng"
            name="roomId"
            rules={[{ required: true, message: "Vui lòng chọn phòng!" }]}
          >
            <Select placeholder="Chọn phòng">
              {availableRooms.map((room) => (
                <Select.Option key={room.roomId} value={room.roomId}>
                  {room.roomName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Ngày bắt đầu"
            name="startDate"
            rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu!" }]}
          >
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            label="Ngày kết thúc"
            name="endDate"
            rules={[{ required: true, message: "Vui lòng chọn ngày kết thúc!" }]}
          >
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Xác nhận
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentManagement;
