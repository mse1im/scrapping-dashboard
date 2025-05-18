"use client";

import { useState } from "react";
import {
  Input,
  Switch,
  Typography,
  Button,
  Table,
  Space,
  Tag,
  message,
} from "antd";

export default function AramaPage() {
  const [query, setQuery] = useState("");
  const [includeArchive, setIncludeArchive] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      message.warning("Lütfen bir ID veya kullanıcı adı girin.");
      return;
    }

    setLoading(true);
    const allResults: any[] = [];

    try {
      // 🔍 Güncel dosyada ara
      const currentRes = await fetch("https://lucky7api.tr/kullanicilar");
      const currentData = await currentRes.json();
      const matchedCurrent = currentData
        .filter((u: any) =>
          u.kullaniciAdi.includes(query) ||
          u.profil.includes(query) ||
          u.profil.split("/").pop().includes(query)
        )
        .map((u: any) => ({
          ...u,
          kaynak: "Güncel",
        }));
      allResults.push(...matchedCurrent);

      if (includeArchive) {
        const foldersRes = await fetch("https://lucky7api.tr/arsiv");
        const folders = await foldersRes.json();

        for (const folder of folders) {
          const filesRes = await fetch(`https://lucky7api.tr/arsiv/${folder}`);
          const files = await filesRes.json();

          for (const file of files) {
            const fileDataRes = await fetch(
              `https://lucky7api.tr/arsiv/${folder}/${file.name}`
            );
            const fileData = await fileDataRes.json();

            const matched = fileData
              .filter((u: any) =>
                u.kullaniciAdi.includes(query) ||
                u.profil.includes(query) ||
                u.profil.split("/").pop().includes(query)
              )
              .map((u: any) => ({
                ...u,
                kaynak: `${folder} - ${file.name}`,
              }));

            allResults.push(...matched);
          }
        }
      }

      setResults(allResults);
    } catch (e) {
      message.error("Arama sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Kullanıcı Adı",
      dataIndex: "kullaniciAdi",
    },
    {
      title: "Kazanç",
      dataIndex: "kazanc",
    },
    {
      title: "ID",
      dataIndex: "profil",
      render: (val: string) => val.split("/").pop(),
    },
    {
      title: "Profil",
      dataIndex: "profil",
      render: (val: string) => (
        <a href={val} target="_blank" rel="noreferrer">
          Profili Gör
        </a>
      ),
    },
    {
      title: "Kaynak",
      dataIndex: "kaynak",
      render: (val: string) => <Tag color="blue">{val}</Tag>,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Typography.Title level={3}>🔍 Genel Arama</Typography.Title>

      <Space className="w-full mb-4" direction="vertical">
        <Input.Search
          placeholder="Kullanıcı adı, profil URL'si veya ID ara"
          enterButton="Ara"
          size="large"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={handleSearch}
        />
        <div className="flex items-center gap-2">
          <Switch
            checked={includeArchive}
            onChange={setIncludeArchive}
          />
          <span>Arşivde de ara</span>
        </div>
      </Space>

      <Table
        loading={loading}
        dataSource={results.map((r, i) => ({ ...r, key: i }))}
        columns={columns}
        bordered
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}