import React, { useState, useEffect } from "react";
import { Table, Input, Button, Modal, Select } from "antd";
import QRCode from "react-qr-code";
import "./InvoiceStudent.css";

const { Search } = Input;
const { Option } = Select;

interface Invoice {
  id: string;
  contractId: string;
  totalAmount: number;
  paymentDate: string;
  paymentMethod: string;
  status: "paid" | "unpaid";
  createdAt: string;
}

interface Contract {
  contractId: string;
  roomName: string;
  customerName: string;
}

const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");
const INVOICES_API = `http://localhost:8080/api/v1/bills/user/${userId}`;
const PAYMENT_API = `http://localhost:8080/api/v1/bills/payment`;

const InvoiceStudent: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [qrValue, setQrValue] = useState("");

  useEffect(() => {
    fetchInvoices();
    fetchContracts();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(INVOICES_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Lỗi khi lấy hóa đơn");
      const data = await res.json();
      setInvoices(
        data.map((item: any) => ({
          id: item.billId,
          contractId: item.contractId,
          totalAmount: item.sumPrice,
          paymentDate: item.paymentDate || "",
          paymentMethod: item.paymentMethod || "",
          status: item.billStatus === "PAID" ? "paid" : "unpaid",
          createdAt: item.createdAt.split("T")[0],
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/v1/contracts/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Lỗi khi lấy hợp đồng");
      const data = await res.json();
      setContracts(
        data.map((c: any) => ({
          contractId: c.contractId,
          roomName: c.room?.roomName || "N/A",
          customerName: c.user?.fullName || "N/A",
        }))
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Lọc theo tìm kiếm và trạng thái
  const filtered = invoices
    .filter(inv =>
      inv.id.toLowerCase().includes(searchQuery) ||
      inv.contractId.toLowerCase().includes(searchQuery)
    )
    .filter(inv =>
      statusFilter === "all" ? true : inv.status === statusFilter
    );

  const openPaymentModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentMethod("");
    setQrValue("");
    setShowPaymentModal(true);
  };

  useEffect(() => {
    if (selectedInvoice && paymentMethod) {
      setQrValue(
        `bill_id:${selectedInvoice.id},sum_price:${selectedInvoice.totalAmount},payment_method:${paymentMethod}`
      );
    }
  }, [selectedInvoice, paymentMethod]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentMethod) return;

    try {
      const res = await fetch(`${PAYMENT_API}/${selectedInvoice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethod: paymentMethod.toUpperCase() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return alert(`Lỗi: ${err.message || res.statusText}`);
      }
      // cập nhật local state
      setInvoices(prev =>
        prev.map(inv =>
          inv.id === selectedInvoice.id
            ? {
                ...inv,
                status: "paid",
                paymentMethod: paymentMethod.toUpperCase(),
                paymentDate: new Date().toISOString().split("T")[0],
              }
            : inv
        )
      );
      setShowPaymentModal(false);
      alert("Thanh toán thành công!");
    } catch (e) {
      console.error(e);
      alert("Lỗi khi thanh toán");
    }
  };

  const handlePrint = (inv: Invoice) => {
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    const ct = contracts.find(c => c.contractId === inv.contractId);
    const html = `
      <html><head><title>Hóa đơn ${inv.id}</title>
      <style>body{font-family:Arial;margin:20px;}h1{text-align:center}</style>
      </head><body>
        <h1>HÓA ĐƠN</h1>
        <p><b>Mã HD:</b> ${inv.id}</p>
        <p><b>Mã hợp đồng:</b> ${inv.contractId}</p>
        <p><b>Phòng:</b> ${ct?.roomName}</p>
        <p><b>Khách:</b> ${ct?.customerName}</p>
        <p><b>Ngày tạo:</b> ${inv.createdAt}</p>
        <p><b>Ngày thanh toán:</b> ${inv.paymentDate}</p>
        <p><b>Phương thức:</b> ${inv.paymentMethod}</p>
        <p><b>Tổng tiền:</b> ${inv.totalAmount.toLocaleString()} VND</p>
        <script>window.print()</script>
      </body></html>`;
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="invoice-student">
      <h1>Danh sách hóa đơn</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Search
          placeholder="Tìm mã hóa đơn hoặc hợp đồng"
          onSearch={v => setSearchQuery(v.toLowerCase())}
          style={{ width: 300 }}
        />
        <Select
          value={statusFilter}
          onChange={value => setStatusFilter(value)}
          style={{ width: 180 }}
        >
          <Option value="all">Tất cả</Option>
          <Option value="paid">Đã thanh toán</Option>
          <Option value="unpaid">Chưa thanh toán</Option>
        </Select>
      </div>

      <Table
        dataSource={filtered}
        rowKey="id"
        loading={loading}
        columns={[
          { title: "Mã hóa đơn", dataIndex: "id", key: "id" },
          { title: "Mã hợp đồng", dataIndex: "contractId", key: "contractId" },
          {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
          },
          {
            title: "Ngày thanh toán",
            dataIndex: "paymentDate",
            key: "paymentDate",
          },
          {
            title: "Phương thức",
            dataIndex: "paymentMethod",
            key: "paymentMethod",
          },
          {
            title: "Tổng tiền",
            dataIndex: "totalAmount",
            key: "totalAmount",
            render: v => `${v.toLocaleString()} VND`,
          },
          {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: s => (
              <span className={s === "paid" ? "paid" : "unpaid"}>
                {s === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
            ),
          },
          {
            title: "Thao tác",
            key: "action",
            render: (_: any, inv: Invoice) =>
              inv.status === "unpaid" ? (
                <>
                  <Button type="primary" onClick={() => openPaymentModal(inv)}>
                    Thanh toán
                  </Button>
                  <Button
                    style={{ marginLeft: 8 }}
                    onClick={() => handlePrint(inv)}
                  >
                    In hóa đơn
                  </Button>
                </>
              ) : (
                <Button onClick={() => handlePrint(inv)}>In hóa đơn</Button>
              ),
          },
        ]}
      />

      <Modal
        visible={showPaymentModal}
        title="Thanh toán hóa đơn"
        onCancel={() => setShowPaymentModal(false)}
        footer={null}
      >
        {selectedInvoice && (
          <form onSubmit={handlePaymentSubmit}>
            <p>
              <b>Mã hóa đơn:</b> {selectedInvoice.id}
            </p>
            <p>
              <b>Tổng tiền:</b>{" "}
              {selectedInvoice.totalAmount.toLocaleString()} VND
            </p>
            <div className="form-group">
              <label>Phương thức:</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                required
              >
                <option value="">-- Chọn --</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
                <option value="CASH">Tiền mặt</option>
              </select>
            </div>
            {paymentMethod === "BANK_TRANSFER" && (
              <div className="form-group">
                <label>Mã QR:</label>
                <QRCode value={qrValue} size={128} />
              </div>
            )}
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <Button
                onClick={() => setShowPaymentModal(false)}
                style={{ marginRight: 8 }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Xác nhận
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default InvoiceStudent;
