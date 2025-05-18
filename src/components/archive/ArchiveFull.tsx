"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Input,
  Select,
  Button,
  Card,
  Table,
  Checkbox,
  Row,
  Col,
  List as AntList,
  message,
  Space,
} from "antd";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import GroupedTable from "@/components/archive/GroupedTable";

export default function ArchivePage() {
  const [dates, setDates] = useState<string[]>([]);
  const [filteredDates, setFilteredDates] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileData, setFileData] = useState<any[]>([]);
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [groupedData, setGroupedData] = useState<any[]>([]);
  const [isGroupedVisible, setIsGroupedVisible] = useState(false);

  useEffect(() => {
    fetch("https://lucky7api.tr/arsiv")
      .then((res) => res.json())
      .then((data: string[]) => {
        setDates(data);
        setFilteredDates(data);
      });
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setFilteredDates(dates.filter((date) => date.includes(value)));
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    fetch(`https://lucky7api.tr/arsiv/${date}`)
      .then((res) => res.json())
      .then((data) => setFiles(data.map((f: any) => f.name)));
  };

  const handleFileSelect = (file: string) => {
    setSelectedFile(file);
    fetch(`https://lucky7api.tr/arsiv/${selectedDate}/${file}`)
      .then((res) => res.json())
      .then((json) => {
        const enriched = json.map((item: any) => ({
          ...item,
          ID: item.profil?.split("/").pop() || "",
        }));
        setFileData(enriched);
        setSelectedCols(
          Object.keys(enriched[0] || {}).filter((k) => k !== "page")
        );
      });
  };

  const handleExport = () => {
    const filteredData = fileData.map((row) => {
      const result: Record<string, any> = {};
      selectedCols.forEach((key) => (result[key] = row[key]));
      return result;
    });

    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Veri");
    const blob = new Blob([
      XLSX.write(wb, { type: "array", bookType: "xlsx" }),
    ]);
    saveAs(blob, `${selectedDate}-${selectedFile}.xlsx`);
  };

  const handleExportAll = () => {
    if (fileData[0]) {
      setSelectedCols(Object.keys(fileData[0]).filter((key) => key !== "page"));
      setTimeout(handleExport, 0);
    }
  };

  const handleFileDownload = async (selected: string[]) => {
    if (!selectedDate) return;

    const zip = new JSZip();
    for (const file of selected) {
      const res = await fetch(
        `https://lucky7api.tr/arsiv/${selectedDate}/${file}`
      );
      const text = await res.text();
      zip.file(`${selectedDate}/${file}`, text);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `arsiv-${selectedDate}.zip`);
  };

  const handleGroupFilter = async () => {
    const allData: any[] = [];

    for (const file of selectedFiles) {
      const res = await fetch(
        `https://lucky7api.tr/arsiv/${selectedDate}/${file}`
      );
      const json = await res.json();
      const enriched = json.map((item: any) => ({
        ...item,
        ID: item.profil?.split("/").pop() || "",
        tarih: selectedDate,
        dosya: file,
      }));
      allData.push(...enriched);
    }

    const grouped: Record<string, any> = {};
    for (const item of allData) {
      if (!grouped[item.ID]) {
        grouped[item.ID] = {
          id: item.ID,
          kullaniciAdi: item.kullaniciAdi,
          toplamKazanc: parseFloat(item.kazanc.replace("$", "")) || 0,
          toplamGiris: 1,
          detaylar: [
            { tarih: item.tarih, siralama: item.siralama, kazanc: item.kazanc },
          ],
        };
      } else {
        grouped[item.ID].toplamGiris++;
        grouped[item.ID].toplamKazanc +=
          parseFloat(item.kazanc.replace("$", "")) || 0;
        grouped[item.ID].detaylar.push({
          tarih: item.tarih,
          siralama: item.siralama,
          kazanc: item.kazanc,
        });
      }
    }

    setGroupedData(Object.values(grouped));
    setIsGroupedVisible(true);
  };

  const handleGroupedExport = () => {
    const mapped = groupedData.map((item: any) => ({
      ID: item.id,
      KullaniciAdi: item.kullaniciAdi,
      ToplamGiris: item.toplamGiris,
      ToplamKazanc: item.toplamKazanc,
      Detaylar: item.detaylar
        .map((d: any) => `${d.tarih} - ${d.siralama} - ${d.kazanc}`)
        .join(" | "),
    }));

    const ws = XLSX.utils.json_to_sheet(mapped);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gruplanan");
    const blob = new Blob([
      XLSX.write(wb, { type: "array", bookType: "xlsx" }),
    ]);
    saveAs(blob, `grup-${selectedDate}.xlsx`);
  };

  const columns = selectedCols.map((key) => ({
    title: key,
    dataIndex: key,
    key,
    render:
      key === "profil"
        ? (val: string) => (
            <a href={val} target="_blank" rel="noreferrer">
              Profili Gör
            </a>
          )
        : undefined,
  }));

  return (
    <div className="w-full max-w-7xl mx-auto">
      {!selectedDate ? (
        <Card title="📁 Arşiv Klasörleri" className="shadow-sm mb-6">
          <Space direction="vertical" className="w-full mb-4">
            <Input.Search
              placeholder="Tarih ara"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              size="large"
              allowClear
            />
            <Select
              showSearch
              placeholder="Tarih seçin"
              className="w-full"
              size="large"
              onChange={handleSelectDate}
              options={filteredDates.map((d) => ({ value: d, label: d }))}
            />
          </Space>
          <Table
            dataSource={filteredDates.map((d) => ({ date: d, key: d }))}
            columns={[{ title: "Tarih", dataIndex: "date", key: "date" }]}
            onRow={(record) => ({
              onClick: () => handleSelectDate(record.date),
              style: { cursor: "pointer" },
            })}
            pagination={{ pageSize: 10 }}
            bordered
          />
        </Card>
      ) : (
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Card
              title={`📂 ${selectedDate} - JSON Dosyaları`}
              extra={<Button onClick={() => setSelectedDate("")}>← Geri</Button>}
            >
              <div className="flex justify-end gap-2 mb-4 flex-wrap">
                <Button onClick={() => setSelectedFiles(files)}>
                  Tümünü Seç
                </Button>
                <Button
                  onClick={() => {
                    setSelectedFiles([]);
                    setIsGroupedVisible(false);
                  }}
                >
                  Temizle
                </Button>
                <Button onClick={() => handleFileDownload(files)}>
                  Tümünü İndir
                </Button>
                <Button
                  type="primary"
                  onClick={() => handleFileDownload(selectedFiles)}
                >
                  Seçilenleri İndir
                </Button>
              </div>
              <Checkbox.Group
                value={selectedFiles}
                onChange={(list) => setSelectedFiles(list as string[])}
                className="w-full"
                style={{ maxHeight: 500, overflowY: "auto" }}
              >
                <AntList
                  bordered
                  dataSource={files}
                  renderItem={(file) => (
                    <AntList.Item
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleFileSelect(file)}
                    >
                      <Checkbox value={file}>{`${selectedDate}-${file}`}</Checkbox>
                    </AntList.Item>
                  )}
                />
              </Checkbox.Group>
              <Button className="mt-4 w-full" onClick={handleGroupFilter}>
                Seçilenleri Grupla & Filtrele
              </Button>
            </Card>
          </Col>
          <Col xs={24} md={16}>
            {isGroupedVisible ? (
              <Card
                title="🗞 Gruplanmış Liste"
                extra={<Button onClick={handleGroupedExport}>Excel'e Aktar</Button>}
              >
                <GroupedTable data={groupedData} />
              </Card>
            ) : (
              selectedFile && fileData.length > 0 && (
                <Card title={`📜 ${selectedDate}-${selectedFile}`}>
                  <Space className="flex justify-between mb-4 w-full">
                    <Input.Search
                      placeholder="İçerikte ara"
                      allowClear
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ maxWidth: 300 }}
                    />
                    <Space>
                      <Button onClick={handleExportAll}>Hepsini Seç</Button>
                      <Button type="primary" onClick={handleExport}>
                        Seçilenleri Excel'e Aktar
                      </Button>
                    </Space>
                  </Space>
                  <Checkbox.Group
                    options={Object.keys(fileData[0] || {}).map((key) => ({
                      label: key,
                      value: key,
                    }))}
                    value={selectedCols}
                    onChange={(vals) => setSelectedCols(vals as string[])}
                    className="flex flex-wrap gap-4 mb-4"
                  />
                  <Table
                    dataSource={fileData.filter((row) =>
                      selectedCols.some((key) =>
                        String(row[key] || "")
                          .toLowerCase()
                          .includes(searchText.toLowerCase())
                      )
                    )}
                    columns={columns}
                    rowKey={(_, i) => i?.toString() || ""}
                    bordered
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                  />
                </Card>
              )
            )}
          </Col>
        </Row>
      )}
    </div>
  );
}