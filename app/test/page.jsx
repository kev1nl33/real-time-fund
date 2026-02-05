'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFunds();
  }, []);

  async function loadFunds() {
    try {
      setLoading(true);
      
      // 动态导入，避免构建时执行
      const { fundService } = await import('../../lib/supabase');
      const { data, error } = await fundService.getFunds();
      
      if (error) {
        setError(error.message);
      } else {
        setFunds(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Supabase 连接测试</h1>
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Supabase 连接测试</h1>
        <p style={{ color: 'red' }}>错误: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Supabase 连接测试</h1>
      <p>✅ 连接成功！</p>
      <p>找到 {funds.length} 只基金：</p>
      
      <ul>
        {funds.map((fund) => (
          <li key={fund.id}>
            <strong>{fund.fund_name}</strong> ({fund.fund_code})
            <br />
            成本: {fund.cost} 元 | 份额: {fund.shares}
          </li>
        ))}
      </ul>

      <button onClick={loadFunds} style={{ marginTop: '20px', padding: '10px 20px' }}>
        刷新数据
      </button>
    </div>
  );
}
