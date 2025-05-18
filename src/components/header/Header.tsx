"use client";

import { Typography, Button, Space } from "antd";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { SearchOutlined } from "@ant-design/icons";
import { Modal, Input, message } from "antd";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { loggedIn, logout } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const handleApiKeySave = async () => {
    setSaving(true);
    try {
      const res = await fetch("https://lucky7api.tr/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (res.ok) {
        message.success("API anahtarı güncellendi!");
        setModalVisible(false);
        setApiKey("");
      } else {
        message.error("API anahtarı güncellenemedi.");
      }
    } catch {
      message.error("Sunucu hatası.");
    } finally {
      setSaving(false);
    }
  };

  if (!loggedIn) return null;

  return (
    <>
      <div className="flex justify-between w-full max-w-7xl mb-10 border-b-gray-300 border-b-1 pb-5 items-center">
        <Space align="center">
          <Link href="/">
            <Typography.Title level={2} className="!m-0 cursor-pointer">
              Lucky7 Back Office
            </Typography.Title>
          </Link>
        </Space>

        <Space>
          <Button icon={<SearchOutlined />} onClick={() => router.push("/search")}>
            Arama
          </Button>

          {!pathname.startsWith("/arsiv") ? (
            <Link href="/archive"><Button type="primary">Arşiv</Button></Link>
          ) : (
            <Button onClick={() => router.push("/")} type="default">← Anasayfa</Button>
          )}

          <Link href="/logs"><Button type="dashed">Loglar</Button></Link>

          <Button onClick={() => setModalVisible(true)} type="dashed">
            API Key
          </Button>

          <Button onClick={() => { logout(); router.push("/"); }} type="default">
            Çıkış Yap
          </Button>
        </Space>
      </div>

      <Modal
        title="🔑 API Anahtarını Güncelle"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleApiKeySave}
        okText="Kaydet"
        confirmLoading={saving}
      >
        <Input.Password
          placeholder="Yeni API key girin"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </Modal>
    </>
  );
}