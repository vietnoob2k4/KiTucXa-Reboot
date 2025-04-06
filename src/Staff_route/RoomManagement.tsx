"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

interface Room {
  roomId: string;
  userId: string;
  roomName: string;
  department: string;
  maximumOccupancy: number;
  currentOccupancy: number;
  roomType: string;
  roomPrice: number;
  roomStatus: "empty_room" | "full_room";
  note: string;
  createdAt?: string;
  updatedAt?: string;
}

// Cấu hình hiển thị trạng thái phòng
const STATUS_CONFIG = {
  empty_room: { text: "Còn trống", className: "available" },
  full_room:  { text: "Đã đầy",   className: "occupied" },
} as const;

const RoomManagement: React.FC = () => {
  const navigate = useNavigate();

  // Lấy token và userId ngay lập tức
  const token   = localStorage.getItem("token")   || "";
  const userId  = localStorage.getItem("userId")  || "";

  const [rooms,  setRooms]  = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    // Nếu thiếu token hoặc userId, không fetch
    if (!token || !userId) {
      setError("Bạn chưa đăng nhập hoặc token đã hết hạn.");
      return;
    }

    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          "http://localhost:8080/api/v1/rooms/staff/list",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          throw new Error(`Lỗi HTTP ${res.status}`);
        }
        const data: Room[] = await res.json();
        // Lọc ngay trên client
        const filtered = data.filter(r => r.userId === userId);
        setRooms(filtered);
      } catch (err: any) {
        console.error(err);
        setError("Không thể tải danh sách phòng.");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [token, userId]);

  return (
    <div className="room-management-container">
      <header className="header">
        <h1>Quản lý phòng</h1>
      </header>

      <div className="room-table-container">
        {loading && <div className="loading">Đang tải dữ liệu...</div>}
        {error   && <div className="error">{error}</div>}

        {!loading && !error && (
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
              {rooms.length > 0 ? (
                rooms.map(room => {
                  const cfg = STATUS_CONFIG[room.roomStatus];
                  return (
                    <tr key={room.roomId}>
                      <td>{room.roomName}</td>
                      <td>{room.roomType}</td>
                      <td>{room.roomPrice.toLocaleString()} VNĐ</td>
                      <td>
                        {room.currentOccupancy}/{room.maximumOccupancy}
                      </td>
                      <td>
                        <span className={`status ${cfg.className}`}>
                          {cfg.text}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="detail-btn"
                          onClick={() =>
                            navigate(
                              `/staff-room-details?roomId=${room.roomId}`
                            )
                          }
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    Không tìm thấy phòng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RoomManagement;
