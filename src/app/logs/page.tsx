"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Typography,
  List,
  Spin,
  Alert,
  Button
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";

export default function LogPage() {
  const [logContent, setLogContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogContent = () => {
    setLoading(true);
    fetch("https://lucky7api.tr/logs/tikleap-cron.log")
      .then((res) => {
        if (!res.ok) throw new Error("Log alınamadı");
        return res.text(); // 🔁 DİKKAT: .json değil .text
      })
      .then((text) => {
        // 🪄 Ters çevirerek son işlemleri en üste alıyoruz
        const reversed = text.split("\n").reverse().join("\n");
        setLogContent(reversed);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogContent();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Typography.Title level={3} className="mb-4">
        🧾 Bot Logları
      </Typography.Title>

      {loading && <Spin size="large" />}
      {error && <Alert type="error" message={error} showIcon className="mt-4" />}

      {!loading && !error && (
        <Card
          title="tikleap-cron.log"
          extra={<Button icon={<ReloadOutlined />} onClick={fetchLogContent}>Yenile</Button>}
          bodyStyle={{
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            maxHeight: 600,
            overflowY: "auto",
            fontSize: 13,
            backgroundColor: "#f9f9f9",
            padding: "1rem",
          }}
        >
          {logContent}
        </Card>
      )}
    </div>
  );
}