"use client";

import { Table } from "antd";

interface GroupedRecord {
  id: string;
  kullaniciAdi: string;
  toplamKazanc: number;
  toplamGiris: number;
  detaylar: {
    tarih: string;
    siralama: string;
    kazanc: string;
  }[];
}

interface GroupedTableProps {
  data: GroupedRecord[];
}

export default function GroupedTable({ data }: GroupedTableProps) {
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Kullanıcı Adı",
      dataIndex: "kullaniciAdi",
      key: "kullaniciAdi",
    },
    {
      title: "Toplam Giriş",
      dataIndex: "toplamGiris",
      key: "toplamGiris",
    },
    {
      title: "Toplam Kazanç",
      dataIndex: "toplamKazanc",
      key: "toplamKazanc",
      render: (val: number) => `$${val.toFixed(2)}`,
    },
    {
      title: "Detaylar",
      dataIndex: "detaylar",
      key: "detaylar",
      render: (detaylar: GroupedRecord["detaylar"]) => (
        <ul className="list-disc ml-4">
          {detaylar.map((detay, index) => (
            <li key={index}>
              {detay.tarih} - Sıra: {detay.siralama} - Kazanç: {detay.kazanc}
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="id"
      pagination={{ pageSize: 10, showSizeChanger: true }}
      bordered
    />
  );
}
