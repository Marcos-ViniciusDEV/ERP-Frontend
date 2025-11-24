import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { RefreshCw, Send, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface PDV {
  id: string;
  name: string;
  location: string;
  lastSeen: Date;
  online: boolean;
}

export default function GerenciarPDV() {
  const [loading, setLoading] = useState(false);
  const [pdvs, setPdvs] = useState<PDV[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadActivePDVs();
    const interval = setInterval(loadActivePDVs, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const loadActivePDVs = async () => {
    try {
      const { data } = await api.get('/pdv/ativos');
      setPdvs(data.data || []);
    } catch (err) {
      console.error('Failed to load PDVs:', err);
    }
  };

  const handleEnviarCarga = async (pdvIds?: string[]) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await api.post('/pdv/enviar-carga', {
        pdvIds: pdvIds || undefined, // undefined = send to all
      });

      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar carga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar PDV</h1>
          <p className="text-muted-foreground mt-1">
            Configure e sincronize os pontos de venda
          </p>
        </div>

        {/* Card de PDVs Ativos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                PDVs Conectados ({pdvs.length})
              </CardTitle>
              <Button
                onClick={loadActivePDVs}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pdvs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum PDV conectado</p>
                <p className="text-sm mt-2">
                  Abra o PDV em http://localhost:5174 para conectar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pdvs.map((pdv) => (
                  <div
                    key={pdv.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                      <div>
                        <p className="font-semibold">{pdv.name}</p>
                        <p className="text-sm text-muted-foreground">
                          📍 {pdv.location || 'Localização não especificada'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {pdv.id}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleEnviarCarga([pdv.id])}
                      disabled={loading}
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Carga
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Enviar para Todos */}
        {pdvs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Enviar Carga para Todos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Envia a carga inicial (produtos, usuários e formas de pagamento)
                para todos os PDVs conectados automaticamente.
              </p>

              <Button
                onClick={() => handleEnviarCarga()}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar para Todos ({pdvs.length} PDV{pdvs.length > 1 ? 's' : ''})
                  </>
                )}
              </Button>

              {error && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Erro</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">
                      {result.message}
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Os PDVs receberão a carga automaticamente
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Card de Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>O PDV se conecta automaticamente ao servidor via WebSocket</li>
              <li>Você pode ver quais PDVs estão online nesta página</li>
              <li>Clique em "Enviar Carga" para enviar dados para um PDV específico</li>
              <li>Ou clique em "Enviar para Todos" para atualizar todos os PDVs</li>
              <li>Os PDVs receberão e carregarão os dados automaticamente</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
