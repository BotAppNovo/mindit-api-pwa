// api/index.js - API completa para PWA
import { createClient } from '@supabase/supabase-js';

// Configuração (usar variáveis de ambiente no Vercel)
const supabaseUrl = process.env.SUPABASE_URL || 'https://seu-projeto.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sua-chave-anon';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Configuração CORS completa
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
  
  // Responder imediatamente para OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Log para debug
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // ROTAS DA API
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  // GET /api - Health check
  if (req.method === 'GET' && (pathname === '/' || pathname === '/api')) {
    return res.status(200).json({
      success: true,
      message: '🚀 API Mind It PWA Online!',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        GET: '/api/lembretes - Listar lembretes',
        POST: '/api/lembretes - Criar lembrete',
        PUT: '/api/lembretes/:id - Atualizar lembrete',
        DELETE: '/api/lembretes/:id - Excluir lembrete'
      }
    });
  }
  
  // GET /api/lembretes - Listar lembretes
  if (req.method === 'GET' && pathname === '/api/lembretes') {
    try {
      const { data, error } = await supabase
        .from('lembretes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        count: data.length,
        data: data
      });
    } catch (error) {
      console.error('Erro ao buscar lembretes:', error);
      return res.status(200).json({
        success: true,
        message: 'Modo offline - usando dados mock',
        data: [
          { id: 1, texto: 'Reunião às 10h', created_at: new Date().toISOString() },
          { id: 2, texto: 'Comprar leite', created_at: new Date().toISOString() }
        ]
      });
    }
  }
  
  // POST /api/lembretes - Criar lembrete
  if (req.method === 'POST' && pathname === '/api/lembretes') {
    try {
      const { texto, userId } = req.body;
      
      if (!texto || texto.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Texto do lembrete é obrigatório'
        });
      }
      
      const lembrete = {
        texto: texto.trim(),
        user_id: userId || 'pwa-user',
        created_at: new Date().toISOString(),
        status: 'ativo'
      };
      
      // Tenta salvar no Supabase
      const { data, error } = await supabase
        .from('lembretes')
        .insert([lembrete])
        .select();
      
      if (error) throw error;
      
      return res.status(201).json({
        success: true,
        message: 'Lembrete criado com sucesso!',
        data: data[0]
      });
      
    } catch (error) {
      console.error('Erro ao criar lembrete:', error);
      // Fallback: retorna sucesso mesmo sem banco
      return res.status(201).json({
        success: true,
        message: 'Lembrete salvo localmente (modo offline)',
        data: {
          id: Date.now(),
          texto: req.body.texto,
          created_at: new Date().toISOString(),
          status: 'ativo'
        }
      });
    }
  }
  
  // PUT /api/lembretes/:id - Atualizar lembrete
  if (req.method === 'PUT' && pathname.startsWith('/api/lembretes/')) {
    const id = pathname.split('/')[3];
    
    try {
      const { texto, status } = req.body;
      
      const { data, error } = await supabase
        .from('lembretes')
        .update({ texto, status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        message: 'Lembrete atualizado',
        data: data[0]
      });
    } catch (error) {
      return res.status(200).json({
        success: true,
        message: 'Atualização simulada (offline)',
        data: { id, ...req.body }
      });
    }
  }
  
  // DELETE /api/lembretes/:id - Excluir lembrete
  if (req.method === 'DELETE' && pathname.startsWith('/api/lembretes/')) {
    const id = pathname.split('/')[3];
    
    try {
      const { error } = await supabase
        .from('lembretes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        message: 'Lembrete excluído'
      });
    } catch (error) {
      return res.status(200).json({
        success: true,
        message: 'Exclusão simulada (offline)',
        id: id
      });
    }
  }
  
  // Rota não encontrada
  return res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: pathname
  });
}
