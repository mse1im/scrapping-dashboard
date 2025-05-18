"use client";
import { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext"; // ⬅️ ekle

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); // ⬅️ context'ten al

  const onFinish = async (values: { user: string; password: string }) => {
    setLoading(true);
    try {
      const res = await fetch("https://lucky7api.tr/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        localStorage.setItem("auth_token", result.token);
        login(); // ⬅️ context'e bildir
      } else {
        message.error(result.message || "Giriş başarısız!");
      }
    } catch {
      console.error("Sunucu hatası.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={<Typography.Title level={3}>Giriş Yap</Typography.Title>}
      className="w-full max-w-sm"
    >
      <Form layout="vertical" onFinish={onFinish} autoComplete="off">
        <Form.Item
          name="user"
          label="Kullanıcı Adı"
          rules={[
            { required: true, message: "Kullanıcı adı zorunludur" },
            { min: 3, message: "En az 3 karakter olmalı" },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Kullanıcı adınızı girin"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Şifre"
          rules={[{ required: true, message: "Şifre zorunludur" }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Şifreniz"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
          >
            Giriş Yap
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}