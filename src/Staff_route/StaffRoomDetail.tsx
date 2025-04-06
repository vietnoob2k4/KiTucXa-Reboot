"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./RoomDetail.css";

interface Room {
  roomId: string;
  userId: string;
  roomName: string;
  department: string;
  maximumOccupancy: number;
  currentOccupancy: number;
  roomType: string;
  roomPrice: number;
  roomStatus: string;
  note: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UtilityService {
  utilityServiceId: string;
  serviceName: string;
  description: string;
  pricePerUnit: number;
  calculationUnit: string;
  status: string; // "Active" hoặc "Inactive"
  createdAt: string;
  updatedAt: string;
}

interface RoomService {
  roomServiceId: string;
  utilityServiceId: string;
  price: number;
}

// Interface cho thông tin sinh viên
interface Student {
  userId: string;
  fullName: string;
  maSV: string; // lấy từ trường maSV của User API
}
interface Staff {
  userId: string;
  fullName: string;
}

const StaffRoomDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [utilityServices, setUtilityServices] = useState<UtilityService[]>([]);
  const [roomServices, setRoomServices] = useState<RoomService[]>([]);
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedUtilityServiceId, setSelectedUtilityServiceId] = useState<string>("");
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<UtilityService | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [messageText, setMessageText] = useState<string | null>(null);

  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
const [staffList, setStaffList] = useState<Staff[]>([]);
const [selectedStaffId, setSelectedStaffId] = useState<string>("");
const [assignedStaff, setAssignedStaff] = useState<Staff | null>(null);
  // Lấy roomId từ query string
  const queryParams = new URLSearchParams(location.search);
  const roomId = queryParams.get("roomId");
  const fetchRoomData = useCallback(async () => {
    if (!roomId) {
      setError("Không có mã phòng.");
      setLoading(false);
      return;
    }
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8080/api/v1/rooms/staff/${roomId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRoom(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Không thể tải thông tin phòng.");
    } finally {
      setLoading(false);
    }
  }, [roomId]);
  // Fetch chi tiết phòng
  useEffect(() => {
    if (!roomId) {
      setError("Không có mã phòng.");
      setLoading(false);
      return;
    }
    const token = localStorage.getItem("token");
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8080/api/v1/rooms/staff/${roomId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRoom(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Không thể tải thông tin phòng.");
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId]);

  // Fetch danh sách dịch vụ chung
  useEffect(() => {
    const token = localStorage.getItem("token");
    (async () => {
      try {
        const res = await fetch("http://localhost:8080/api/v1/utility-services/staff/list", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setUtilityServices(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);
  
  
  const fetchRoomServices = async () => {
    if (!roomId) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:8080/api/v1/room-services/room/staff/${roomId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRoomServices(Array.isArray(data) ? data : [data]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRoomServices();
  }, [roomId]);
  
  useEffect(() => {
    if (!room) return;
    const token = localStorage.getItem("token");
    (async () => {
      try {
        // 4.1. Lấy danh sách hợp đồng
        const cRes = await fetch("http://localhost:8080/api/v1/contracts/staff/list", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!cRes.ok) throw new Error(`HTTP ${cRes.status}`);
        const contracts: any[] = await cRes.json();

        // 4.2. Lọc các hợp đồng Active cho phòng này
        const activeContracts = contracts.filter(
          (c) => c.roomId === room.roomId && c.contractStatus === "Active"
        );

        // 4.3. Với mỗi hợp đồng, gọi API user để lấy fullName + maSV
        const students: Student[] = await Promise.all(
          activeContracts.map(async (c) => {
            try {
              // Chú ý endpoint: /user/manager/:id hoặc /user/:id
              const uRes = await fetch(
                `http://localhost:8080/api/v1/user/staff/${c.userId}`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (!uRes.ok) throw new Error(`HTTP ${uRes.status}`);
              const json = await uRes.json();
              // API của bạn trả về { code, result: { … } }
              const user = json.result;
              return {
                userId: c.userId,
                fullName: user.fullName ?? "N/A",
                maSV: user.maSV ?? "N/A",
              };
            } catch (err) {
              console.error("Lỗi fetch user:", err);
              return {
                userId: c.userId,
                fullName: "N/A",
                maSV: "N/A",
              };
            }
          })
        );

        setActiveStudents(students);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [room]);

  // Khi chọn dịch vụ, fetch chi tiết để lấy pricePerUnit
  useEffect(() => {
    if (!selectedUtilityServiceId) {
      setSelectedServiceDetail(null);
      setPrice(0);
      return;
    }
    const token = localStorage.getItem("token");
    (async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/v1/utility-services/staff/${selectedUtilityServiceId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSelectedServiceDetail(data);
        setPrice(data.pricePerUnit);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [selectedUtilityServiceId]);

  const handleDeleteService = async (roomServiceId: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:8080/api/v1/room-services/staff/delete/${roomServiceId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchRoomServices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddService = async () => {
    if (!selectedUtilityServiceId) {
      setMessageText("Vui lòng chọn dịch vụ.");
      return;
    }
    if (price <= 0) {
      setMessageText("Giá dịch vụ không hợp lệ.");
      return;
    }
    if (selectedServiceDetail?.status !== "Active") {
      setMessageText("Dịch vụ này không khả dụng.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8080/api/v1/room-services/staff/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId,
          utilityServiceId: selectedUtilityServiceId,
          price,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMessageText("Dịch vụ đã được thêm thành công!");
      setSelectedUtilityServiceId("");
      setPrice(0);
      setSelectedServiceDetail(null);
      setShowModal(false);
      fetchRoomServices();
    } catch (err) {
      console.error(err);
      setMessageText("Không thể thêm dịch vụ. Vui lòng thử lại.");
    }
  };
  
  const handleBack = () => navigate(-1);

  if (loading) return <p className="loading">Đang tải thông tin phòng...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!room) return <p>Không có dữ liệu phòng.</p>;

  return (
    <div className="room-detail-container">
      <h1 className="title">Chi tiết phòng: {room.roomName}</h1>
      <div className="room-detail-card">
        <p><strong>Mã phòng:</strong> {room.roomId}</p>
        <p><strong>Loại phòng:</strong> {room.roomType}</p>
        <p>
          <strong>Giá phòng:</strong>{" "}
          {Number(room.roomPrice).toLocaleString()} VNĐ
        </p>
        <p>
          <strong>Số người:</strong> {room.currentOccupancy} / {room.maximumOccupancy}
        </p>
        <p><strong>Khoa/Bộ phận:</strong> {room.department}</p>
        <p>
          <strong>Trạng thái:</strong>{" "}
          {room.roomStatus === "empty_room" ? "Còn trống" : "Đã đầy"}
        </p>
        <p><strong>Ghi chú:</strong> {room.note}</p>
        {room.createdAt && (
          <p>
            <strong>Ngày tạo:</strong>{" "}
            {new Date(room.createdAt).toLocaleString()}
          </p>
        )}
        {room.updatedAt && (
          <p>
            <strong>Ngày cập nhật:</strong>{" "}
            {new Date(room.updatedAt).toLocaleString()}
          </p>
          
        )}
 
      </div>

      <div className="active-students-container">
        <h2>Sinh viên có hợp đồng còn hiệu lực</h2>
        {activeStudents.length > 0 ? (
          <ul>
            {activeStudents.map((stu) => (
              <li key={stu.userId}>
                <span className="student-code">Mã SV: {stu.maSV}</span> -{" "}
                <span className="student-name">{stu.fullName}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Chưa có sinh viên nào có hợp đồng còn hiệu lực cho phòng này.</p>
        )}
      </div>

      <div className="room-services-container">
        <h2>Dịch vụ có trong phòng</h2>
        {roomServices.length > 0 ? (
          <ul>
            {roomServices.map((svc) => {
              const info = utilityServices.find(
                (u) => u.utilityServiceId === svc.utilityServiceId
              );
              return (
                <li key={svc.roomServiceId}>
                  <strong>{info?.serviceName ?? "Không xác định"}</strong> -{" "}
                  {Number(svc.price).toLocaleString()} VNĐ{" "}
                  <button
                    onClick={() => handleDeleteService(svc.roomServiceId)}
                    className="delete-btn"
                  >
                    Xóa
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Chưa có dịch vụ nào được thêm vào phòng.</p>
        )}
      </div>


{/* Modal giao phòng */}
{showAssignModal && (
  <div className="modal-overlay">
    <div className="modal-content">
    

      <div className="modal-buttons">
        
        <button
          onClick={() => {
            setShowAssignModal(false);
            setSelectedStaffId("");
          }}
          className="close-modal-button"
        >
          Hủy
        </button>
      </div>
      {messageText && <p className="message">{messageText}</p>}
    </div>
  </div>
)}
      <button
        onClick={() => {
          setShowModal(true);
          setMessageText(null);
        }}
        className="open-modal-button"
      >
        Thêm dịch vụ vào phòng
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Thêm dịch vụ vào phòng</h2>
            <label>
              Chọn dịch vụ:
              <select
                value={selectedUtilityServiceId}
                onChange={(e) => {
                  const id = e.target.value;
                  const svc = utilityServices.find((s) => s.utilityServiceId === id);
                  if (svc?.status !== "Active") {
                    setMessageText("Dịch vụ này không khả dụng.");
                    return;
                  }
                  if (roomServices.some((rs) => rs.utilityServiceId === id)) {
                    setMessageText("Dịch vụ đã được thêm.");
                    return;
                  }
                  setSelectedUtilityServiceId(id);
                  setMessageText(null);
                }}
                className="select-service"
              >
                <option value="">Chọn dịch vụ</option>
                {utilityServices.map((svc) => (
                  <option
                    key={svc.utilityServiceId}
                    value={svc.utilityServiceId}
                    disabled={
                      svc.status !== "Active" ||
                      roomServices.some((rs) => rs.utilityServiceId === svc.utilityServiceId)
                    }
                  >
                    {svc.serviceName} - {Number(svc.pricePerUnit).toLocaleString()} VNĐ{" "}
                    {svc.status !== "Active" ? "(Inactive)" : ""}
                  </option>
                ))}
              </select>
            </label>

            {selectedServiceDetail && (
              <div className="service-detail">
                <p><strong>Mô tả:</strong> {selectedServiceDetail.description}</p>
                <p>
                  <strong>Đơn giá:</strong>{" "}
                  {Number(selectedServiceDetail.pricePerUnit).toLocaleString()} VNĐ/
                  {selectedServiceDetail.calculationUnit}
                </p>
              </div>
            )}

            <p>
              <strong>Giá dịch vụ:</strong>{" "}
              {price > 0
                ? Number(price).toLocaleString() + " VNĐ"
                : "Chưa xác định"}
            </p>

            <div className="modal-buttons">
              <button onClick={handleAddService} className="add-service-button">
                Thêm dịch vụ
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="close-modal-button"
              >
                Đóng
              </button>
            </div>
            {messageText && <p className="message">{messageText}</p>}
          </div>
        </div>
      )}

      <button onClick={handleBack} className="back-button">
        Quay lại
      </button>
    </div>
  );
};

export default StaffRoomDetail;
