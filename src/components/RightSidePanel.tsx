import { useState } from "react";
import { X, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RightSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RightSidePanel({ isOpen, onClose }: RightSidePanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const xmlFiles = droppedFiles.filter((file) =>
      file.name.toLowerCase().endsWith(".xml")
    );

    if (xmlFiles.length === 0) {
      toast.error("Apenas arquivos XML são permitidos");
      return;
    }

    if (xmlFiles.length !== droppedFiles.length) {
      toast.warning(
        `${droppedFiles.length - xmlFiles.length} arquivo(s) ignorado(s) (apenas XML)`
      );
    }

    setFiles((prev) => [...prev, ...xmlFiles]);
    toast.success(`${xmlFiles.length} arquivo(s) adicionado(s)`);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const xmlFiles = selectedFiles.filter((file) =>
      file.name.toLowerCase().endsWith(".xml")
    );

    if (xmlFiles.length === 0) {
      toast.error("Apenas arquivos XML são permitidos");
      return;
    }

    setFiles((prev) => [...prev, ...xmlFiles]);
    toast.success(`${xmlFiles.length} arquivo(s) adicionado(s)`);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (files.length === 0) {
      toast.error("Nenhum arquivo para processar");
      return;
    }

    setProcessing(true);
    
    // Simular processamento
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast.success(`${files.length} NFe(s) importada(s) com sucesso!`);
    setFiles([]);
    setProcessing(false);
    onClose();
  };

  const clearAll = () => {
    setFiles([]);
    toast.info("Arquivos removidos");
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Painel Lateral */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Importar NFe
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Arraste arquivos XML ou clique para selecionar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Área de Drag and Drop */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
            )}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <Upload
              className={cn(
                "w-12 h-12 mx-auto mb-4",
                isDragging ? "text-blue-500" : "text-slate-400"
              )}
            />
            <p className="text-lg font-medium text-slate-700 mb-2">
              {isDragging
                ? "Solte os arquivos aqui"
                : "Arraste arquivos XML aqui"}
            </p>
            <p className="text-sm text-slate-500">
              ou clique para selecionar arquivos
            </p>
            <input
              id="file-input"
              type="file"
              multiple
              accept=".xml"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Lista de Arquivos */}
          {files.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Arquivos ({files.length})
                </h3>
                <button
                  onClick={clearAll}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Limpar tudo
                </button>
              </div>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informações */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Dicas:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Apenas arquivos XML de NFe são aceitos</li>
                  <li>• Você pode arrastar múltiplos arquivos de uma vez</li>
                  <li>• Os dados serão validados antes da importação</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={processFiles}
              className="flex-1"
              disabled={files.length === 0 || processing}
            >
              {processing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Importar {files.length > 0 && `(${files.length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
