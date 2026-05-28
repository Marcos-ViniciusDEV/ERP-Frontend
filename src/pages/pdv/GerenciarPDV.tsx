import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { RefreshCw, Send, CheckCircle, AlertCircle, Wifi, WifiOff, CreditCard, KeyRound, Copy } from 'lucide-react';

interface PDV {
  id: string;
  name: string;
  location: string;
  lastSeen: Date;
  online: boolean;
  cnpjVinculado?: string | null;
  pinpadKey?: {
    possuiChaveAtiva: boolean;
    status: string;
    chavePrefixo?: string;
    expiraEm?: string;
  };
  maquininha?: {
    conectada: boolean;
    nomeTerminal?: string | null;
    tipo?: string | null;
    provedor?: string | null;
    status?: string | null;
    identificador?: string | null;
  };
}

export default function GerenciarPDV() {
  const [loading, setLoading] = useState(false);
  const [keyLoading, setKeyLoading] = useState<string | null>(null);
  const [pdvs, setPdvs] = useState<PDV[]>([]);
  const [result, setResult] = useState<any>(null);
  const [generatedKey, setGeneratedKey] = useState<any>(null);
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

  const handleGerarPinpadKey = async (pdvId: string) => {
    setKeyLoading(pdvId);
    setError('');
    setGeneratedKey(null);

    try {
      const { data } = await api.post(`/pdv/${encodeURIComponent(pdvId)}/pinpad-key`);
      setGeneratedKey(data.data);
      await loadActivePDVs();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Erro ao gerar chave do PinPad');
    } finally {
      setKeyLoading(null);
    }
  };

  const copyPinpadKey = async () => {
    if (!generatedKey?.pinpadKey) return;
    await navigator.clipboard.writeText(generatedKey.pinpadKey);
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
                    className="flex flex-col gap-4 p-4 border rounded-lg lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                      <div>
                        <p className="font-semibold">{pdv.name}</p>
                        <p className="text-sm text-muted-foreground">
                          📍 {pdv.location || 'Localização não especificada'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {pdv.id}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant={pdv.maquininha?.conectada ? 'default' : 'secondary'} className="gap-1">
                            <CreditCard className="h-3.5 w-3.5" />
                            Maquininha: {pdv.maquininha?.conectada ? 'Sim' : 'Nao'}
                          </Badge>
                          {pdv.maquininha?.conectada && (
                            <>
                              <Badge variant="outline">{pdv.maquininha.provedor || 'Provedor nao informado'}</Badge>
                              <Badge variant="outline">{labelTipoMaquininha(pdv.maquininha.tipo)}</Badge>
                              <Badge variant={isConnectedStatus(pdv.maquininha.status) ? 'default' : 'outline'}>
                                {pdv.maquininha.status || 'Nao testado'}
                              </Badge>
                            </>
                          )}
                        </div>
                        {pdv.maquininha?.conectada && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {pdv.maquininha.nomeTerminal}
                            {pdv.maquininha.identificador ? ` - ${pdv.maquininha.identificador}` : ''}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>CNPJ: {pdv.cnpjVinculado || '-'}</span>
                          <Badge variant={pdv.pinpadKey?.possuiChaveAtiva ? 'default' : 'outline'}>
                            Key PinPad: {pdv.pinpadKey?.status || 'Sem chave ativa'}
                          </Badge>
                          {pdv.pinpadKey?.chavePrefixo && <span>{pdv.pinpadKey.chavePrefixo}...</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleGerarPinpadKey(pdv.id)}
                        disabled={keyLoading === pdv.id}
                        size="sm"
                        variant="outline"
                      >
                        {keyLoading === pdv.id ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                        Gerar key PinPad
                      </Button>
                      <Button
                        onClick={() => handleEnviarCarga([pdv.id])}
                        disabled={loading}
                        size="sm"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Carga
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {generatedKey && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Chave gerada para configurar PinPad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">PDV vinculado</p>
                  <p className="font-semibold">{generatedKey.pdvId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CNPJ da empresa</p>
                  <p className="font-semibold">{generatedKey.cnpjEmpresa}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Validade</p>
                  <p className="font-semibold">{new Date(generatedKey.expiraEm).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {generatedKey.terminal && (
                <div className="rounded-md border bg-muted/20 p-3 text-sm">
                  <p className="font-medium">{generatedKey.terminal.nomeTerminal}</p>
                  <p className="text-muted-foreground">
                    {labelTipoMaquininha(generatedKey.terminal.tipo)}
                    {generatedKey.terminal.identificador ? ` - ${generatedKey.terminal.identificador}` : ''}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
                <code className="break-all text-sm font-semibold">{generatedKey.pinpadKey}</code>
                <Button variant="outline" size="sm" onClick={copyPinpadKey}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
              </div>

              <p className="text-sm text-amber-700">
                Essa chave aparece completa somente agora e expira em {generatedKey.validadeMinutos} minutos. Ela deve ser usada para parear a maquininha ao PDV e ao CNPJ exibidos acima.
              </p>
            </CardContent>
          </Card>
        )}

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

function labelTipoMaquininha(tipo?: string | null) {
  const labels: Record<string, string> = {
    manual: 'Manual',
    tef: 'TEF',
    pos_api: 'POS/API',
  };
  return tipo ? labels[tipo] || tipo : 'Tipo nao informado';
}

function isConnectedStatus(status?: string | null) {
  if (!status) return false;
  return ['Conectado', 'Credencial valida', 'Configuracao pronta', 'Configuracao TEF pronta'].some((item) => status.includes(item));
}
