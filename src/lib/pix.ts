import QRCode from 'qrcode';

export interface PixPayloadParams {
  pixKey: string;
  name: string;
  city: string;
  amount: number;
  txId?: string;
}

/**
 * Gerador Oficial do Payload EMV PIX Copia-e-Cola (Bacen / BR Code) com CRC16 CCITT
 */
export function generatePixPayload({
  pixKey,
  name,
  city,
  amount,
  txId = 'COPILOTO',
}: PixPayloadParams): string {
  const formatField = (id: string, value: string): string => {
    const len = String(value.length).padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const merchantAccountInfo = [
    formatField('00', 'br.gov.bcb.pix'),
    formatField('01', pixKey),
  ].join('');

  const cleanTxId = txId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';
  const additionalDataField = formatField('05', cleanTxId);

  // Normalização de caracteres para padrão ISO sem acentos
  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 25);

  const cleanCity = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 15);

  const payload = [
    formatField('00', '01'), // Payload Format Indicator
    formatField('26', merchantAccountInfo), // Merchant Account Info
    formatField('52', '0000'), // Merchant Category Code
    formatField('53', '986'), // Currency BRL
    formatField('54', Number(amount).toFixed(2)), // Amount
    formatField('58', 'BR'), // Country
    formatField('59', cleanName), // Name
    formatField('60', cleanCity), // City
    formatField('62', additionalDataField), // Additional Data
    '6304', // CRC16 indicator
  ].join('');

  // Cálculo de redundância cíclica CRC-16 / CCITT-FALSE
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');

  return payload + crcHex;
}

/**
 * Gera DataURL em PNG do QR Code PIX para renderização nativa
 */
export async function generatePixQrCodeDataUrl(payload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      margin: 1,
      width: 280,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Erro ao renderizar QR Code PIX:', err);
    // Fallback de URL pública caso a lib falhe
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(payload)}`;
  }
}

/**
 * Gera URL de WhatsApp com mensagem pronta de envio de comprovante
 */
export function generatePixProofWhatsAppUrl(params: {
  phone?: string;
  email?: string | null;
  amount?: number;
}): string {
  const phone = (params.phone || '5521992113903').replace(/\D/g, '');
  const destination = phone.startsWith('55') ? phone : `55${phone}`;
  const emailText = params.email ? ` da conta *${params.email}*` : '';
  const amountText = params.amount ? ` (R$ ${params.amount.toFixed(2)})` : ' de R$ 19,90';

  const text = `Fala Luciano! Acabei de fazer o PIX da minha assinatura mensal do Copiloto-Rota${amountText}${emailText}.\n\nEstou enviando o comprovante em anexo para você liberar meu acesso Pro imediato! Obrigado! 🚀`;

  return `https://wa.me/${destination}?text=${encodeURIComponent(text)}`;
}
