"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Typography,
  Button,
  Checkbox,
  Space,
  Input,
} from "antd";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ColumnsType, TableProps } from "antd/es/table";

interface Kullanici {
  page: number;
  profil: string;
  siralama: string;
  kullaniciAdi: string;
  kazanc: string;
  id: string;
}

const allColumns = [
  { title: "Sıralama", dataIndex: "siralama" },
  { title: "Kullanıcı Adı", dataIndex: "kullaniciAdi" },
  { title: "Kazanç", dataIndex: "kazanc" },
  { title: "Profil", dataIndex: "profil" },
  { title: "ID", dataIndex: "id" },
];

export default function List() {
  const [data, setData] = useState<Kullanici[]>([]);
  const [selectedCols, setSelectedCols] = useState<(keyof Kullanici)[]>(
    allColumns.map((col) => col.dataIndex as keyof Kullanici)
  );
  const [searchText, setSearchText] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    fetch("https://lucky7api.tr/kullanicilar")
      .then((res) => res.json())
      .then((json: Kullanici[]) => {
        const enriched = json.map((item: Kullanici) => ({
          ...item,
          id: item.profil.split("/").pop() || "",
        }));
        setData(enriched);
      });

    fetch("https://lucky7api.tr/logs/tikleap-cron.log")
      .then((res) => res.text())
      .then((text) => {
        const lines = text.trim().split("\n").reverse();
        const latest = lines.find((line) => line.startsWith("✅"));
        if (latest) {
          const match = latest.match(/Bitti: (.+)/);
          if (match) {
            setLastUpdated(match[1]);
          }
        }
      });
  }, []);

  const exportToExcel = () => {
    const filteredData = data.map((row) => {
      const filteredRow: Partial<Kullanici> = {};
      (selectedCols as (keyof Kullanici)[]).forEach((key) => {
        filteredRow[key] = row[key] as any;
      });
      return filteredRow;
    });

    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kullanicilar");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "kullanicilar.xlsx");
  };

  const exportAllToExcel = () => {
    setSelectedCols(allColumns.map((col) => col.dataIndex as keyof Kullanici));
    setTimeout(() => {
      exportToExcel();
    }, 0);
  };

  const handleColChange = (checkedValues: any[]) => {
    setSelectedCols(checkedValues);
  };

  const columns = [
    {
      title: "Sıralama",
      dataIndex: "siralama",
      sorter: (a: Kullanici, b: Kullanici) =>
        parseInt(a.siralama) - parseInt(b.siralama),
    },
    {
      title: "Kullanıcı Adı",
      dataIndex: "kullaniciAdi",
      sorter: (a: Kullanici, b: Kullanici) =>
        a.kullaniciAdi.localeCompare(b.kullaniciAdi),
    },
    {
      title: "Kazanç",
      dataIndex: "kazanc",
      sorter: (a: Kullanici, b: Kullanici) =>
        parseFloat(a.kazanc.replace("$", "")) -
        parseFloat(b.kazanc.replace("$", "")),
      filters: [
        { text: "$0", value: "0" },
        { text: "$1+", value: "1" },
        { text: "$10+", value: "10" },
        { text: "$50+", value: "50" },
      ],
      onFilter: (value: string | number, record: Kullanici) => {
        const amount = parseFloat(record.kazanc.replace("$", ""));
        return amount >= Number(value);
      },
    },
    {
      title: "Profil",
      dataIndex: "profil",
      render: (value: string) => (
        <a href={value} target="_blank" rel="noopener noreferrer">
          Profili Gör
        </a>
      ),
    },
    {
      title: "ID",
      dataIndex: "id",
      sorter: (a: Kullanici, b: Kullanici) => a.id.localeCompare(b.id),
    },
  ];

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const handleTableChange: TableProps<Kullanici>["onChange"] = (
    newPagination
  ) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
  };

  const filteredData = data.filter((item) =>
    item.kullaniciAdi.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredColumns = columns.filter((col) =>
    selectedCols.includes(col.dataIndex as keyof Kullanici)
  );

  return (
    <div className="w-full max-w-7xl mt-5">
      <div className="flex items-center justify-between">
        <Typography.Title level={2}>Güncel Kullanıcı Listesi</Typography.Title>
        <Button onClick={exportAllToExcel} type="default">
          Hepsini Seç ve Aktar
        </Button>
      </div>

      {lastUpdated && (
        <Typography.Text type="secondary" className="block mb-2">
          Bu liste en son <strong>{lastUpdated}</strong> tarihinde çekilmiştir.
        </Typography.Text>
      )}

      <Space direction="vertical" className="mb-4 w-full">
        <div className="flex justify-between w-full flex-wrap gap-4">
          <Input.Search
            placeholder="Kullanıcı adı ara"
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            autoComplete="off"
            style={{ maxWidth: 300 }}
          />
          <div className="flex w-full items-center justify-end">
            <Checkbox.Group
              options={allColumns.map((col) => ({
                label: col.title,
                value: col.dataIndex,
              }))}
              value={selectedCols}
              onChange={handleColChange}
            />
            <Button onClick={exportToExcel} type="primary">
              Seçilenleri Excel'e Aktar
            </Button>
          </div>
        </div>
      </Space>

      <Table
        dataSource={filteredData}
        columns={filteredColumns as ColumnsType<Kullanici>}
        rowKey="id"
        bordered
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
        onChange={handleTableChange}
      />
    </div>
  );
}