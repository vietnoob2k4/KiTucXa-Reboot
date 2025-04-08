"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "antd";
import { useNavigate } from "react-router-dom";
// import "../styles/Dashboard.css";

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

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const initialNewRoom = {
    userId: localStorage.getItem("userId") || "",
    roomName: "",
    roomType: "Single",
    roomPrice: 0,
    maximumOccupancy: 1,
    roomStatus: "empty_room",
    department: "",
    note: "",
  };

  const [newRoom, setNewRoom] = useState<Omit<Room, "roomId" | "createdAt" | "updatedAt" | "currentOccupancy">>(initialNewRoom);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Fetch rooms từ API
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/v1/rooms/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setRooms(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Không thể tải danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Xử lý thêm phòng
  const handleAddRoom = async () => {
    if (!validateForm(newRoom)) return;

    try {
      const response = await fetch("http://localhost:8080/api/v1/rooms/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRoom),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      fetchRooms();
      setAddModalVisible(false);
      setNewRoom(initialNewRoom);
      alert("Thêm phòng thành công!");
    } catch (err) {
      console.error("Error adding room:", err);
      alert("Thêm phòng thất bại");
    }
  };

  // Xử lý cập nhật phòng
  const handleUpdateRoom = async () => {
    if (!editingRoom || !validateForm(editingRoom)) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/rooms/update/${editingRoom.roomId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editingRoom),
        }
      );

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      fetchRooms();
      setEditModalVisible(false);
      alert("Cập nhật phòng thành công!");
    } catch (err) {
      console.error("Error updating room:", err);
      alert("Cập nhật phòng thất bại");
    }
  };

  // Xử lý xóa phòng
  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa phòng này?")) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/rooms/delete/${roomId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      fetchRooms();
      alert("Xóa phòng thành công!");
    } catch (err) {
      console.error("Error deleting room:", err);
      alert("Xóa phòng thất bại");
    }
  };

  // Validate form
  const validateForm = (room: any) => {
    if (
      !room.roomName?.trim() ||
      room.roomPrice <= 0 ||
      room.maximumOccupancy <= 0 ||
      !room.department?.trim()
    ) {
      alert("Vui lòng điền đầy đủ các trường bắt buộc (*)");
      return false;
    }
    return true;
  };

  // Helper hiển thị trạng thái
  const statusConfig = {
    empty_room: { text: "Còn trống", className: "available" },
    full_room: { text: "Đã đầy", className: "occupied" },
  };

  return (
    <div className="room-management-container">
      <div className="header">
        <h2>QUẢN LÝ PHÒNG</h2>
        <button className="add-btn" onClick={() => setAddModalVisible(true)}>
          + Thêm phòng mới
        </button>
      </div>

      {/* Modal thêm phòng */}
      <Modal
        title="Thêm phòng mới"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="form-container">
          <div className="form-group">
            <label>Tên phòng *</label>
            <input
              value={newRoom.roomName}
              onChange={(e) => setNewRoom({ ...newRoom, roomName: e.target.value })}
            />

            <label>Loại phòng *</label>
            <select
              value={newRoom.roomType}
              onChange={(e) => {
                const type = e.target.value;
                const occupancy = type === "Single" ? 1 : type === "Double" ? 2 : 4;
                setNewRoom({
                  ...newRoom,
                  roomType: type,
                  maximumOccupancy: occupancy,
                });
              }}
            >
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Quad">Quad</option>
            </select>

            <label>Giá phòng (VNĐ) *</label>
            <input
              type="number"
              value={newRoom.roomPrice}
              onChange={(e) =>
                setNewRoom({ ...newRoom, roomPrice: Number(e.target.value) })
              }
            />

            <label>Khoa/Bộ phận *</label>
            <input
              value={newRoom.department}
              onChange={(e) => setNewRoom({ ...newRoom, department: e.target.value })}
            />

            <label>Ghi chú</label>
            <textarea
              value={newRoom.note}
              onChange={(e) => setNewRoom({ ...newRoom, note: e.target.value })}
            />

            <div className="form-actions">
              <button className="submit-btn" onClick={handleAddRoom}>
                Thêm
              </button>
              <button className="cancel-btn" onClick={() => setAddModalVisible(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal sửa phòng */}
      <Modal
        title="Chỉnh sửa thông tin phòng"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        {editingRoom && (
          <div className="form-container">
            <div className="form-group">
              <label>Tên phòng *</label>
              <input
                value={editingRoom.roomName}
                onChange={(e) =>
                  setEditingRoom({ ...editingRoom, roomName: e.target.value })
                }
              />

              <label>Loại phòng *</label>
              <select
                value={editingRoom.roomType}
                onChange={(e) => {
                  const type = e.target.value;
                  const occupancy = type === "Single" ? 1 : type === "Double" ? 2 : 4;
                  setEditingRoom({
                    ...editingRoom,
                    roomType: type,
                    maximumOccupancy: occupancy,
                  });
                }}
              >
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Quad">Quad</option>
              </select>

              <label>Giá phòng (VNĐ) *</label>
              <input
                type="number"
                value={editingRoom.roomPrice}
                onChange={(e) =>
                  setEditingRoom({ ...editingRoom, roomPrice: Number(e.target.value) })
                }
              />

              <label>Khoa/Bộ phận *</label>
              <input
                value={editingRoom.department}
                onChange={(e) =>
                  setEditingRoom({ ...editingRoom, department: e.target.value })
                }
              />

              <label>Trạng thái</label>
              <select
                value={editingRoom.roomStatus}
                onChange={(e) =>
                  setEditingRoom({ ...editingRoom, roomStatus: e.target.value })
                }
              >
                <option value="empty_room">Còn trống</option>
                <option value="full_room">Đã đầy</option>
              </select>

              <div className="form-actions">
                <button className="submit-btn" onClick={handleUpdateRoom}>
                  Lưu thay đổi
                </button>
                <button className="cancel-btn" onClick={() => setEditModalVisible(false)}>
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Bảng hiển thị danh sách phòng */}
      <div className="room-table-container">
        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <table className="room-table">
            <thead>
              <tr>
                <th>Tên phòng</th>
                <th>Loại</th>
                <th>Giá</th>
                <th>Sức chứa</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.roomId}>
                  <td>{room.roomName}</td>
                  <td>{room.roomType}</td>
                  <td>{room.roomPrice.toLocaleString()} VNĐ</td>
                  <td>{room.currentOccupancy}/{room.maximumOccupancy}</td>
                  <td>
                    <span className={`status ${statusConfig[room.roomStatus as keyof typeof statusConfig]?.className}`}>
                      {statusConfig[room.roomStatus as keyof typeof statusConfig]?.text}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditingRoom(room);
                        setEditModalVisible(true);
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteRoom(room.roomId)}
                    >
                      Xóa
                    </button>
                    <button
                      className="detail-btn"
                      onClick={() => navigate(`/room-details?roomId=${room.roomId}`)}
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RoomManagement;