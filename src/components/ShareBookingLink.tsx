import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Copy,
  Check,
  Share2,
  ExternalLink,
  Printer,
  Download,
  MessageCircle,
  Sparkles,
  QrCode,
  Store,
  Crown
} from 'lucide-react';
import { useSalon } from '@/hooks/useSalon';
import { cn } from '@/lib/utils';

export interface ShareBookingLinkProps {
  salonId?: string;
  salonName?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'card';
}

export const ShareBookingLink: React.FC<ShareBookingLinkProps> = ({
  salonId: propSalonId,
  salonName: propSalonName,
  className,
  variant = 'default',
}) => {
  const { salon } = useSalon();
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  // Determinar identificador do salão e nome
  const activeSalonId = propSalonId || salon?.slug || salon?.id || 'demo';
  const activeSalonName = propSalonName || salon?.name || 'BelezaFlow';

  // URL pública completa de agendamento
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const bookingUrl = `${origin}/agendar/${activeSalonId}`;

  // Copiar link para o clipboard
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(bookingUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = bookingUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  };

  // Abrir link no WhatsApp com mensagem de convite profissional
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá! ✨ Agende seu atendimento no *${activeSalonName}* com facilidade e rapidez pelo nosso link exclusivo:\n\n` +
      `🔗 ${bookingUrl}\n\n` +
      `Escolha o serviço desejado, o profissional e o melhor horário para você. Esperamos por você!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Compartilhamento nativo mobile (se suportado)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Agendamento - ${activeSalonName}`,
          text: `Agende seu horário no ${activeSalonName}:`,
          url: bookingUrl,
        });
      } catch (err) {
        // Usuário cancelou ou navegador não suportou
      }
    } else {
      handleCopyLink();
    }
  };

  // Baixar QR Code em alta resolução (PNG)
  const handleDownloadQr = () => {
    const canvas = qrCanvasRef.current?.querySelector('canvas');
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    const sanitizedName = activeSalonName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    downloadLink.download = `qrcode-agendar-${sanitizedName}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  };

  // Imprimir flyer elegante do QR Code para colocar no balcão/recepção
  const handlePrintQr = () => {
    const canvas = qrCanvasRef.current?.querySelector('canvas');
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';

    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code de Agendamento - ${activeSalonName}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: auto; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 40px 20px;
              text-align: center;
              background-color: #ffffff;
            }
            .container {
              max-width: 520px;
              margin: 0 auto;
              border: 2px solid #d97706;
              border-radius: 24px;
              padding: 40px 30px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            }
            .brand-badge {
              display: inline-block;
              background: #0f172a;
              color: #f59e0b;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 2px;
              text-transform: uppercase;
              padding: 6px 16px;
              border-radius: 50px;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 28px;
              margin: 0 0 8px 0;
              color: #0f172a;
            }
            p.subtitle {
              font-size: 15px;
              color: #64748b;
              margin: 0 0 28px 0;
            }
            .qr-wrapper {
              background: #ffffff;
              padding: 20px;
              display: inline-block;
              border-radius: 20px;
              border: 1px solid #e2e8f0;
              margin-bottom: 24px;
            }
            .qr-wrapper img {
              display: block;
              width: 220px;
              height: 220px;
            }
            .instructions {
              font-size: 14px;
              font-weight: 600;
              color: #0f172a;
              margin: 0 0 6px 0;
            }
            .url-display {
              font-size: 12px;
              color: #d97706;
              font-family: monospace;
              word-break: break-all;
              margin-bottom: 24px;
            }
            .footer {
              border-top: 1px solid #e2e8f0;
              padding-top: 18px;
              font-size: 11px;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="brand-badge">Agendamento Online</div>
            <h1>${activeSalonName}</h1>
            <p class="subtitle">Aponte a câmera do seu celular para agendar seu horário em instantes</p>
            
            <div class="qr-wrapper">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>

            <div class="instructions">✦ Sem aplicativo • Rápido • 24 horas ✦</div>
            <div class="url-display">${bookingUrl}</div>

            <div class="footer">
              Powered by BelezaFlow • Gestão & Agendamentos
            </div>
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-xl',
        className
      )}
    >
      {/* Detalhes de iluminação sutil (Luxury Gold Glow) */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-44 h-44 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative p-5 sm:p-7">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 tracking-wide uppercase">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Link Público do Salão</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400">
                <Crown className="w-3 h-3 text-amber-400/70" />
                Sem necessidade de login para o cliente
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-luxury text-white tracking-tight flex items-center gap-2">
              <span>Compartilhe sua Agenda Online</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Divulgue seu link exclusivo nas redes sociais, WhatsApp e imprima o QR Code para o balcão. Seus clientes agendam em menos de 1 minuto.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Testar Link</span>
            </a>
          </div>
        </div>

        {/* Conteúdo Principal: Link + QR Code */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Coluna Esquerda: Link copiável e Botões de Compartilhamento */}
          <div className="lg:col-span-8 space-y-4">
            {/* Campo do Link com Botão Copiar Embutido */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-amber-400/90">
                Endereço Web Exclusivo
              </label>
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-1.5 pl-3.5 focus-within:border-amber-500/60 transition-all">
                <Store className="w-4 h-4 text-amber-400 shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={bookingUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-transparent text-xs sm:text-sm font-mono text-slate-200 focus:outline-none select-all truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer',
                    copied
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs hover:shadow-amber-500/20'
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ações de Compartilhamento Direto */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </button>

              {/* Botão Copiar Link Secundário */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{copied ? 'Link Copiado!' : 'Copiar'}</span>
              </button>

              {/* Compartilhar Geral (Mobile Share API) */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>Compartilhar</span>
                </button>
              )}

              {/* Ações de QR Code no Mobile */}
              <button
                type="button"
                onClick={handlePrintQr}
                className="inline-flex items-center justify-center gap-2 h-10 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700/80 transition-all cursor-pointer"
                title="Imprimir QR Code para o balcão"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">Imprimir QR</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center justify-center gap-2 h-10 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700/80 transition-all cursor-pointer"
                title="Baixar imagem do QR Code"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">Baixar PNG</span>
              </button>
            </div>
          </div>

          {/* Coluna Direita: Card QR Code Luxo */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div
              ref={qrCanvasRef}
              className="bg-white p-3 rounded-xl shadow-lg border border-amber-500/40 relative group cursor-pointer"
              onClick={handleDownloadQr}
              title="Clique para baixar o QR Code"
            >
              <QRCodeCanvas
                value={bookingUrl}
                size={120}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="Q"
                includeMargin={false}
              />
              <div className="absolute inset-0 bg-slate-900/70 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-amber-400 text-xs font-semibold gap-1">
                <Download className="w-4 h-4" />
                <span>Baixar</span>
              </div>
            </div>

            <div className="text-center sm:text-left lg:text-center space-y-1">
              <div className="flex items-center justify-center sm:justify-start lg:justify-center gap-1.5 text-xs font-semibold text-amber-400">
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code para Balcão</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-[200px]">
                Imprima em papel ou acrílico e coloque na recepção do salão.
              </p>
              <div className="pt-1 flex items-center justify-center sm:justify-start lg:justify-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintQr}
                  className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3 h-3" />
                  Imprimir
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="text-[11px] font-semibold text-slate-300 hover:text-white underline underline-offset-2 cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Baixar PNG
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
